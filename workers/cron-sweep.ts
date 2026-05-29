import type { Env, Alert, Settings } from '../lib/types';
import {
  getSettings,
  getBriefing,
  setBriefing,
  setDelta,
  setSweepStatus,
  getSweepStatus,
} from '../lib/kv';
import { runSweep } from '../lib/sweep/orchestrator';
import { computeDelta } from '../lib/delta/engine';
import { classifyAlerts } from '../lib/alerts/classifier';
import { deduplicateAlerts } from '../lib/alerts/dedup';
import { addAlertsToHistory } from '../lib/alerts/history';
import { sendTelegramAlert } from '../lib/bots/telegram';
import { sendDiscordWebhookAlert } from '../lib/bots/discord-webhook';

export default {
  async scheduled(
    event: ScheduledEvent,
    env: Env,
    ctx: ExecutionContext,
  ): Promise<void> {
    const config = await getSettings(env.CONFIG_KV, env);
    if (!config) return;

    const previousBriefing = await getBriefing(env.BRIEFING_KV);
    const previousStatus = await getSweepStatus(env.BRIEFING_KV);

    await setSweepStatus(env.BRIEFING_KV, {
      lastSweep: previousStatus?.lastSweep ?? '',
      nextSweep: previousStatus?.nextSweep ?? '',
      sourceCount: previousStatus?.sourceCount ?? 0,
      healthySources: previousStatus?.healthySources ?? 0,
      isSweeping: true,
    });

    let briefing;
    try {
      briefing = await runSweep(env.BRIEFING_KV, config);
    } catch {
      const status = await getSweepStatus(env.BRIEFING_KV);
      await setSweepStatus(env.BRIEFING_KV, {
        lastSweep: status?.lastSweep ?? '',
        nextSweep: status?.nextSweep ?? '',
        sourceCount: status?.sourceCount ?? 0,
        healthySources: status?.healthySources ?? 0,
        isSweeping: false,
      });
      return;
    }

    await setBriefing(env.BRIEFING_KV, briefing);

    const delta = computeDelta(briefing, previousBriefing);
    await setDelta(env.BRIEFING_KV, delta);

    let alerts = await classifyAlerts(delta, briefing, config.llm);
    alerts = deduplicateAlerts(alerts);

    if (alerts.length > 0) {
      await addAlertsToHistory(env.BRIEFING_KV, alerts);
    }

    const now = new Date().toISOString();
    const nextSweep = new Date(Date.now() + config.refreshInterval * 60000).toISOString();
    await setSweepStatus(env.BRIEFING_KV, {
      lastSweep: now,
      nextSweep,
      sourceCount: briefing.newsTicker.length + briefing.osintFeed.length,
      healthySources: briefing.newsTicker.length + briefing.osintFeed.length,
      isSweeping: false,
    });

    for (const alert of alerts) {
      ctx.waitUntil(pushAlert(config, alert, env.BRIEFING_KV));
    }
  },
} as ExportedHandler<Env>;

async function pushAlert(
  config: Settings,
  alert: Alert,
  kv: KVNamespace,
): Promise<void> {
  const promises: Promise<void>[] = [];
  if (config.telegram?.botToken && config.telegram.chatId) {
    promises.push(sendTelegramAlert(config.telegram.botToken, config.telegram.chatId, alert, kv));
  }
  if (config.discord?.webhookUrl) {
    promises.push(sendDiscordWebhookAlert(config.discord.webhookUrl, alert));
  }
  await Promise.allSettled(promises);
}

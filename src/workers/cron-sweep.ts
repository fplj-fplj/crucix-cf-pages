import type { Env, Alert, Settings, SourceResult } from '../types';
import {
  getSettings,
  getBriefing,
  setBriefing,
  setDelta,
  setSweepStatus,
  getSweepStatus,
} from '../kv';
import { runSweep, computeDelta } from '../sweep/orchestrator';
import { classifyAlerts } from '../alerts/classifier';
import { deduplicateAlerts } from '../alerts/dedup';
import { addAlertsToHistory } from '../alerts/history';
import { sendTelegramAlert } from '../bots/telegram';
import { sendDiscordWebhookAlert } from '../bots/discord-webhook';

export async function runCronSweep(env: Env, ctx: ExecutionContext): Promise<void> {
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

  let results: SourceResult[];
  let briefing;
  try {
    const sweepResult = await runSweep(config);
    briefing = sweepResult.briefing;
    results = sweepResult.results;
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

  const delta = computeDelta(briefing, previousBriefing);
  briefing.sweepDelta = delta;
  
  await setBriefing(env.BRIEFING_KV, briefing);
  await setDelta(env.BRIEFING_KV, delta);

  let alerts = await classifyAlerts(delta, briefing, config.llm);
  alerts = deduplicateAlerts(alerts);

  if (alerts.length > 0) {
    await addAlertsToHistory(env.BRIEFING_KV, alerts);
  }

  const now = new Date().toISOString();
  const nextSweep = new Date(Date.now() + config.refreshInterval * 60000).toISOString();
  const healthySources = results.filter((r) => r.success).length;
  await setSweepStatus(env.BRIEFING_KV, {
    lastSweep: now,
    nextSweep,
    sourceCount: results.length,
    healthySources,
    isSweeping: false,
  });

  for (const alert of alerts) {
    ctx.waitUntil(pushAlert(config, alert, env.BRIEFING_KV));
  }
}

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

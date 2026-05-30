import type { Env, Settings, BriefingData, DeltaData, Alert, SourceResult } from '../types';
import { getSweepStatus, setSweepStatus, getSettings, getBriefing, setBriefing, setDelta } from '../kv';
import { runSweep, computeDelta } from '../sweep/orchestrator';
import { classifyAlerts } from '../alerts/classifier';
import { deduplicateAlerts } from '../alerts/dedup';
import { addAlertsToHistory } from '../alerts/history';

async function pushToTelegram(botToken: string, chatId: string, alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return;

  const lines = alerts
    .map((a) => `[${a.tier}] ${a.title}\n${a.description}`)
    .join('\n\n');
  const text = `🚨 Crucix Alerts\n\n${lines}`.slice(0, 4096);

  try {
    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
  } catch {}
}

async function pushToDiscord(webhookUrl: string, alerts: Alert[]): Promise<void> {
  if (alerts.length === 0) return;

  const content = alerts
    .map((a) => `**[${a.tier}]** ${a.title}\n${a.description}`)
    .join('\n\n')
    .slice(0, 2000);

  try {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content }),
    });
  } catch {}
}

export async function handleSweepRequest(request: Request, env: Env) {
  try {
    const status = await getSweepStatus(env.BRIEFING_KV);

    if (status?.isSweeping) {
      return new Response(JSON.stringify({ status: 'sweep_in_progress' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await setSweepStatus(env.BRIEFING_KV, {
      lastSweep: status?.lastSweep ?? new Date().toISOString(),
      nextSweep: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      sourceCount: status?.sourceCount ?? 0,
      healthySources: status?.healthySources ?? 0,
      isSweeping: true,
    });

    try {
      const settings = await getSettings(env.CONFIG_KV, env);
      if (!settings) {
        return new Response(JSON.stringify({ status: 'error', message: 'No settings configured' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const previousBriefing = await getBriefing(env.BRIEFING_KV);

      const { briefing, results } = await runSweep(settings);
      
      const delta: DeltaData = computeDelta(briefing, previousBriefing);
      briefing.sweepDelta = delta;
      
      await setBriefing(env.BRIEFING_KV, briefing);
      await setDelta(env.BRIEFING_KV, delta);

      let alerts = await classifyAlerts(delta, briefing, settings?.llm);
      alerts = deduplicateAlerts(alerts);

      if (alerts.length > 0) {
        await addAlertsToHistory(env.BRIEFING_KV, alerts);
      }

      if (settings?.telegram) {
        await pushToTelegram(settings.telegram.botToken, settings.telegram.chatId, alerts);
      }
      if (settings?.discord) {
        await pushToDiscord(settings.discord.webhookUrl, alerts);
      }

      const healthySources = results.filter((r: SourceResult) => r.success).length;
      await setSweepStatus(env.BRIEFING_KV, {
        lastSweep: new Date().toISOString(),
        nextSweep: new Date(Date.now() + (settings?.refreshInterval ?? 15) * 60 * 1000).toISOString(),
        sourceCount: results.length,
        healthySources,
        isSweeping: false,
      });

      return new Response(JSON.stringify({ status: 'ok', briefing }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    } catch (err) {
      await setSweepStatus(env.BRIEFING_KV, {
        lastSweep: status?.lastSweep ?? new Date().toISOString(),
        nextSweep: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        sourceCount: status?.sourceCount ?? 0,
        healthySources: status?.healthySources ?? 0,
        isSweeping: false,
      });

      throw err;
    }
  } catch (err) {
    return new Response(
      JSON.stringify({
        status: 'error',
        message: err instanceof Error ? err.message : 'Internal error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      },
    );
  }
}

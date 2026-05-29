import type { Env } from '../../lib/types';
import { getSweepStatus, getSettings, getBriefing } from '../../lib/kv';

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const [status, settings, briefing] = await Promise.all([
      getSweepStatus(context.env.BRIEFING_KV),
      getSettings(context.env.CONFIG_KV, context.env),
      getBriefing(context.env.BRIEFING_KV),
    ]);

    const llmStatus = settings?.llm?.apiKey ? 'configured' : 'not_configured';

    const health = {
      status: 'ok',
      lastSweep: status?.lastSweep ?? null,
      sourceCount: status?.sourceCount ?? 0,
      healthySources: status?.healthySources ?? 0,
      llmStatus,
      uptime: Date.now(),
      briefingAge: briefing?.timestamp ?? null,
    };

    return new Response(JSON.stringify(health), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
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

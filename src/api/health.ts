import type { Env } from '../types';
import { getSweepStatus, getSettings, getBriefing } from '../kv';

export function createRequestHandler() {
  return async (request: Request, env: Env) => {
    try {
      const [status, settings, briefing] = await Promise.all([
        getSweepStatus(env.BRIEFING_KV),
        getSettings(env.CONFIG_KV, env),
        getBriefing(env.BRIEFING_KV),
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
  };
}

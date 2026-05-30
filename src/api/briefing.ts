import type { Env } from '../types';
import { getBriefing } from '../kv';

export async function handleBriefingRequest(request: Request, env: Env) {
  try {
    const briefing = await getBriefing(env.BRIEFING_KV);

    if (!briefing) {
      return new Response(
        JSON.stringify({ status: 'no_data', message: 'No sweep data available' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ status: 'ok', data: briefing }), {
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

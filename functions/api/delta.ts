import type { Env } from '../../lib/types';
import { getDelta } from '../../lib/kv';

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const delta = await getDelta(context.env.BRIEFING_KV);

    if (!delta) {
      return new Response(
        JSON.stringify({ status: 'no_data', message: 'No delta data available' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ status: 'ok', data: delta }), {
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

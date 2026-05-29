import type { Env } from '../../../lib/types';
import { getSettings } from '../../../lib/kv';
import { handleDiscordCommand } from '../../../lib/bots/discord';

export async function onRequestPost(context: {
  env: Env;
  request: Request;
}): Promise<Response> {
  const { env, request } = context;
  const body = (await request.json()) as {
    type?: number;
    data?: { name?: string };
  };
  if (body.type === 1) {
    return new Response(JSON.stringify({ type: 1 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  if (body.type === 2 && body.data?.name) {
    const config = await getSettings(env.CONFIG_KV, env);
    if (!config) {
      return new Response(
        JSON.stringify({ type: 4, data: { content: 'Configuration not found.' } }),
        { status: 200, headers: { 'Content-Type': 'application/json' } },
      );
    }
    const response = await handleDiscordCommand(body.data.name, env.BRIEFING_KV, config);
    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
  return new Response('OK', { status: 200 });
}

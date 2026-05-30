import type { Env } from '../../types';
import { getSettings } from '../../kv';
import { handleDiscordCommand } from '../../bots/discord';

export async function handleDiscordInteraction(request: Request, env: Env): Promise<Response> {
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

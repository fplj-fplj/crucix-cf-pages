import type { Env } from '../../types';
import { getSettings } from '../../kv';
import { handleTelegramCommand, sendTelegramMessage } from '../../bots/telegram';

export async function handleTelegramWebhook(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  const body = (await request.json()) as {
    message?: { text?: string; chat?: { id?: number } };
  };
  const message = body.message;
  if (!message?.text || !message.chat?.id) {
    return new Response('OK', { status: 200 });
  }
  const text = message.text;
  const chatId = String(message.chat.id);
  const parts = text.split(' ');
  const command = parts[0];
  const args = parts.slice(1).join(' ');
  const config = await getSettings(env.CONFIG_KV, env);
  if (!config?.telegram) {
    return new Response('OK', { status: 200 });
  }
  const reply = await handleTelegramCommand(command, args, env.BRIEFING_KV, config);
  ctx.waitUntil(sendTelegramMessage(config.telegram.botToken, chatId, reply));
  return new Response('OK', { status: 200 });
}

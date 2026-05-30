import type { Env } from '../../types';

export async function handleTelegramRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    botToken?: string;
    publicUrl?: string;
  };
  const { botToken, publicUrl } = body;
  if (!botToken || !publicUrl) {
    return new Response(
      JSON.stringify({ error: 'botToken and publicUrl required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const webhookUrl = `${publicUrl}/api/telegram/webhook`;
  const res = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: webhookUrl }),
  });
  const result = (await res.json()) as { ok?: boolean; description?: string };
  return new Response(
    JSON.stringify({
      status: result.ok ? 'ok' : 'error',
      webhookUrl,
      description: result.description,
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

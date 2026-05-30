import type { Env } from '../../types';

export async function handleDiscordRegister(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as {
    botToken?: string;
    applicationId?: string;
    guildId?: string;
  };
  const { botToken, applicationId, guildId } = body;
  if (!botToken || !applicationId) {
    return new Response(
      JSON.stringify({ error: 'botToken and applicationId required' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } },
    );
  }
  const commands = [
    { name: 'status', description: 'Show system health and sweep status' },
    { name: 'sweep', description: 'Trigger a manual sweep' },
    { name: 'brief', description: 'Show latest briefing summary' },
    { name: 'alerts', description: 'Show recent alert history' },
  ];
  const baseUrl = guildId
    ? `https://discord.com/api/v10/applications/${applicationId}/guilds/${guildId}/commands`
    : `https://discord.com/api/v10/applications/${applicationId}/commands`;
  const res = await fetch(baseUrl, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bot ${botToken}`,
    },
    body: JSON.stringify(commands),
  });
  const result = (await res.json()) as Array<{ name: string }>;
  return new Response(
    JSON.stringify({ status: 'ok', commands: result.map((c) => c.name) }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  );
}

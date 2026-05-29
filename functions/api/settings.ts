import type { Env, Settings } from '../../lib/types';
import { getSettings, setSettings } from '../../lib/kv';

function maskApiKey(key: string): string {
  if (!key || key.length <= 4) return '****';
  return '*'.repeat(key.length - 4) + key.slice(-4);
}

function maskSettings(settings: Settings): Record<string, unknown> {
  const masked: Record<string, unknown> = { ...settings };

  if (settings.apiKeys) {
    const maskedKeys: Record<string, string> = {};
    for (const [k, v] of Object.entries(settings.apiKeys)) {
      maskedKeys[k] = maskApiKey(v);
    }
    masked.apiKeys = maskedKeys;
  }

  if (settings.llm?.apiKey) {
    masked.llm = { ...settings.llm, apiKey: maskApiKey(settings.llm.apiKey) };
  }

  if (settings.telegram?.botToken) {
    masked.telegram = { ...settings.telegram, botToken: maskApiKey(settings.telegram.botToken) };
  }

  if (settings.discord?.webhookUrl) {
    const url = settings.discord.webhookUrl;
    const parts = url.split('/');
    const token = parts[parts.length - 1];
    masked.discord = {
      ...settings.discord,
      webhookUrl: parts.slice(0, -1).join('/') + '/' + maskApiKey(token),
    };
  }

  return masked;
}

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const settings = await getSettings(context.env.CONFIG_KV, context.env);

    if (!settings) {
      return new Response(
        JSON.stringify({ status: 'no_data', message: 'No settings found' }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ status: 'ok', data: maskSettings(settings) }), {
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

export async function onRequestPut(context: { env: Env; request: Request }) {
  try {
    const body = (await context.request.json()) as Partial<Settings>;

    if (!body.refreshInterval || !body.llm) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required fields: refreshInterval, llm' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    if (!body.llm.provider || !body.llm.model) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required LLM fields: provider, model' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const settings: Settings = {
      apiKeys: body.apiKeys ?? {},
      llm: body.llm,
      telegram: body.telegram,
      discord: body.discord,
      refreshInterval: body.refreshInterval,
    };

    await setSettings(context.env.CONFIG_KV, settings, context.env);

    return new Response(JSON.stringify({ status: 'ok' }), {
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

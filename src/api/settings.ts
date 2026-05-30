import type { Env, Settings } from '../types';
import { getSettings, setSettings } from '../kv';

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

  if (settings.translation) {
    masked.translation = {
      ...settings.translation,
      apiKey: settings.translation.apiKey ? maskApiKey(settings.translation.apiKey) : undefined,
    };
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

export async function handleSettingsGet(request: Request, env: Env) {
  try {
    const settings = await getSettings(env.CONFIG_KV, env);

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

export async function handleSettingsPut(request: Request, env: Env) {
  try {
    let body: Partial<Settings>;
    try {
      body = (await request.json()) as Partial<Settings>;
    } catch {
      // Fallback for different formats
      body = {};
    }

    // Support both old and new format from frontend
    const refreshInterval = (body as any).sweep?.refreshInterval || body.refreshInterval || 15;

    const llm = (body as any).llm || body;

    if (!llm.provider) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required LLM field: provider' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const settings: Settings = {
      apiKeys: (body as any).apiKeys || (body as any).sweep?.apiKeys || {},
      llm: {
        provider: llm.provider,
        model: llm.model || (body as any).model || '',
        apiKey: llm.apiKey || '',
        baseUrl: llm.baseUrl,
      },
      translation: (body as any).translation,
      telegram: (body as any).telegram || (body as any).bots?.telegram,
      discord: (body as any).discord,
      refreshInterval: refreshInterval,
    };

    await setSettings(env.CONFIG_KV, settings, env);

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

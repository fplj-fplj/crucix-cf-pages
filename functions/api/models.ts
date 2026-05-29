import type { Env, LLMConfig, LLMProvider } from '../../lib/types';
import { fetchAvailableModels } from '../../lib/llm/provider';

export async function onRequestGet(context: { env: Env; request: Request }) {
  try {
    const url = new URL(context.request.url);
    const provider = url.searchParams.get('provider') as LLMProvider | null;
    const apiKey = url.searchParams.get('apiKey');

    if (!provider || !apiKey) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required params: provider, apiKey' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const config: LLMConfig = { provider, apiKey, model: '' };
    const models = await fetchAvailableModels(config);

    return new Response(JSON.stringify({ status: 'ok', models }), {
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

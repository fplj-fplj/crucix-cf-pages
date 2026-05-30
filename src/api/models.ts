import type { Env, LLMConfig, LLMProvider } from '../types';
import { fetchAvailableModels } from '../llm/provider';

export async function handleModelsRequest(request: Request, env: Env) {
  try {
    const url = new URL(request.url);
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

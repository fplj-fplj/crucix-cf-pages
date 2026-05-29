import type { Env } from '../../lib/types';
import { translateText } from '../../lib/llm/translator';

interface TranslateRequest {
  text: string;
  targetLang: string;
  translationConfig?: {
    provider: string;
    apiKey: string;
    model?: string;
    baseUrl?: string;
  };
}

export async function onRequestPost(context: { env: Env; request: Request }) {
  try {
    const body = (await context.request.json()) as TranslateRequest;

    if (!body.text || !body.targetLang) {
      return new Response(
        JSON.stringify({ status: 'error', message: 'Missing required fields: text, targetLang' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        },
      );
    }

    const result = await translateText(body.text, body.targetLang, body.translationConfig);

    return new Response(
      JSON.stringify({
        status: 'ok',
        translated: result.translated,
        original: body.text,
        sourceLang: result.sourceLang,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      },
    );
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

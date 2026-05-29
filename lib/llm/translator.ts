import { safeFetch } from '../utils/fetch';

export interface TranslationConfig {
  provider: string;
  apiKey?: string;
  model?: string;
  baseUrl?: string;
}

export interface TranslationResult {
  translated: string;
  sourceLang: string | null;
}

const CJK_RANGES = /[\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/;

export function detectLanguage(text: string): string | null {
  if (CJK_RANGES.test(text)) {
    if (/[\u3040-\u309f\u30a0-\u30ff]/.test(text)) {
      return 'ja';
    }
    if (/[\uac00-\ud7af]/.test(text)) {
      return 'ko';
    }
    return 'zh';
  }
  return null;
}

const CJK_LANGS = new Set(['zh', 'ja', 'ko']);

function isSameLanguageFamily(detected: string | null, target: string): boolean {
  if (!detected) return false;
  if (detected === target) return true;
  if (CJK_LANGS.has(detected) && CJK_LANGS.has(target)) {
    return detected === target;
  }
  return false;
}

async function translateGoogle(
  text: string,
  targetLang: string,
  apiKey: string,
): Promise<TranslationResult> {
  const url = `https://translation.googleapis.com/language/translate/v2`;
  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      q: text,
      target: targetLang,
      format: 'text',
    }),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Google Translation API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    data: { translations: { translatedText: string; detectedSourceLanguage: string }[] };
  };

  const translation = data.data.translations[0];
  return {
    translated: translation?.translatedText ?? text,
    sourceLang: translation?.detectedSourceLanguage ?? null,
  };
}

async function translateMicrosoft(
  text: string,
  targetLang: string,
  apiKey: string,
): Promise<TranslationResult> {
  const url = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=${targetLang}`;
  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Ocp-Apim-Subscription-Key': apiKey,
      'content-type': 'application/json',
    },
    body: JSON.stringify([{ text }]),
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Microsoft Translation API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    translations: { text: string; to: string }[];
    detectedLanguage?: { language: string };
  }[];

  return {
    translated: data[0]?.translations[0]?.text ?? text,
    sourceLang: data[0]?.detectedLanguage?.language ?? null,
  };
}

function normalizeConfig(config?: TranslationConfig): TranslationConfig {
  if (!config) {
    return { provider: 'none' };
  }
  return {
    provider: (['google', 'microsoft', 'none'].includes(config.provider)
      ? config.provider
      : 'none') as TranslationConfig['provider'],
    apiKey: config.apiKey,
    model: config.model,
    baseUrl: config.baseUrl,
  };
}

export async function translateText(
  text: string,
  targetLang: string,
  config?: TranslationConfig,
): Promise<TranslationResult> {
  const normalized = normalizeConfig(config);

  if (normalized.provider === 'none' || !normalized.apiKey) {
    return {
      translated: text,
      sourceLang: detectLanguage(text),
    };
  }

  const detected = detectLanguage(text);
  if (isSameLanguageFamily(detected, targetLang)) {
    return {
      translated: text,
      sourceLang: detected,
    };
  }

  switch (normalized.provider) {
    case 'google':
      return translateGoogle(text, targetLang, normalized.apiKey);

    case 'microsoft':
      return translateMicrosoft(text, targetLang, normalized.apiKey);

    default:
      return {
        translated: text,
        sourceLang: detected,
      };
  }
}

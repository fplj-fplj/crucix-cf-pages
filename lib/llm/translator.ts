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

async function translateDeepL(
  text: string,
  targetLang: string,
  apiKey?: string,
): Promise<TranslationResult> {
  const url = apiKey
    ? `https://api.deepl.com/v2/translate`
    : `https://api-free.deepl.com/v2/translate`;
  
  const response = await safeFetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...(apiKey ? { 'Authorization': `DeepL-Auth-Key ${apiKey}` } : {}),
    },
    body: `text=${encodeURIComponent(text)}&target_lang=${targetLang.toUpperCase()}`,
  }, 15000);

  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`DeepL API error ${response.status}: ${errorText}`);
  }

  const data = (await response.json()) as {
    translations: { text: string; detected_source_language: string }[];
  };

  return {
    translated: data.translations?.[0]?.text ?? text,
    sourceLang: data.translations?.[0]?.detected_source_language ?? null,
  };
}

function normalizeConfig(config?: TranslationConfig): TranslationConfig {
  if (!config) {
    return { provider: 'deepl-free' };
  }
  const validProviders = ['deepl', 'deepl-free', 'none'];
  return {
    provider: validProviders.includes(config.provider)
      ? config.provider
      : 'deepl-free',
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

  if (normalized.provider === 'none') {
    return { translated: text, sourceLang: detectLanguage(text) };
  }

  const detected = detectLanguage(text);
  if (isSameLanguageFamily(detected, targetLang)) {
    return { translated: text, sourceLang: detected };
  }

  try {
    switch (normalized.provider) {
      case 'deepl':
        return await translateDeepL(text, targetLang, normalized.apiKey);

      case 'deepl-free':
      default:
        return await translateDeepL(text, targetLang);
    }
  } catch (err) {
    throw err;
  }
}

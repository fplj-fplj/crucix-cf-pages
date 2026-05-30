import { LLMConfig, LLMProvider } from '../types';
import { callAnthropic, fetchAnthropicModels } from './anthropic';
import { callOpenAI, fetchOpenAIModels } from './openai';
import { callGemini, fetchGeminiModels } from './gemini';
import { callOpenRouter, fetchOpenRouterModels } from './openrouter';
import { callMiniMax, fetchMiniMaxModels } from './minimax';
import { callMistral, fetchMistralModels } from './mistral';
import { callGrok, fetchGrokModels } from './grok';

export class LLMError extends Error {
  provider: LLMProvider;
  retryable: boolean;

  constructor(provider: LLMProvider, message: string, retryable: boolean) {
    super(message);
    this.name = 'LLMError';
    this.provider = provider;
    this.retryable = retryable;
  }
}

const DEFAULT_MODELS: Record<string, string> = {
  anthropic: 'claude-sonnet-4-20250514',
  openai: 'gpt-4o',
  gemini: 'gemini-1.5-pro',
  openrouter: 'openrouter/auto',
  minimax: 'MiniMax-Text-01',
  mistral: 'mistral-large-latest',
  grok: 'grok-3-latest',
};

export function getDefaultModel(provider: LLMProvider): string {
  return DEFAULT_MODELS[provider] ?? 'gpt-4o';
}

export async function callLLM(
  config: LLMConfig,
  prompt: string,
  systemPrompt?: string,
): Promise<string> {
  const model = config.model || getDefaultModel(config.provider);

  try {
    switch (config.provider) {
      case LLMProvider.Anthropic:
        return await callAnthropic(config.apiKey, model, prompt, systemPrompt);

      case LLMProvider.OpenAI:
        return await callOpenAI(config.apiKey, model, prompt, systemPrompt);

      case LLMProvider.Gemini:
        return await callGemini(config.apiKey, model, prompt, systemPrompt);

      case LLMProvider.OpenRouter:
        return await callOpenRouter(config.apiKey, model, prompt, systemPrompt);

      case LLMProvider.MiniMax:
        return await callMiniMax(config.apiKey, model, prompt, systemPrompt);

      case LLMProvider.Mistral:
        return await callMistral(config.apiKey, model, prompt, systemPrompt);

      case LLMProvider.Grok:
        return await callGrok(config.apiKey, model, prompt, systemPrompt);

      default:
        throw new LLMError(
          config.provider,
          `Unsupported LLM provider: ${config.provider}`,
          false,
        );
    }
  } catch (err) {
    if (err instanceof LLMError) {
      throw err;
    }

    const message = err instanceof Error ? err.message : String(err);
    const retryable = message.includes('timeout') ||
      message.includes('429') ||
      message.includes('503') ||
      message.includes('500');

    throw new LLMError(config.provider, message, retryable);
  }
}

export async function fetchAvailableModels(config: LLMConfig): Promise<string[]> {
  switch (config.provider) {
    case LLMProvider.Anthropic:
      return fetchAnthropicModels(config.apiKey);

    case LLMProvider.OpenAI:
      return fetchOpenAIModels(config.apiKey);

    case LLMProvider.Gemini:
      return fetchGeminiModels(config.apiKey);

    case LLMProvider.OpenRouter:
      return fetchOpenRouterModels(config.apiKey);

    case LLMProvider.MiniMax:
      return fetchMiniMaxModels(config.apiKey);

    case LLMProvider.Mistral:
      return fetchMistralModels(config.apiKey);

    case LLMProvider.Grok:
      return fetchGrokModels(config.apiKey);

    default:
      return [];
  }
}

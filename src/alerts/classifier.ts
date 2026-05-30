import type { DeltaData, BriefingData, LLMConfig, Alert } from '../types';
import { evaluateAlerts } from '../llm/alert-evaluator';
import { evaluateAlertsByRules } from '../llm/rule-evaluator';

async function contentHash(content: string): Promise<string> {
  const data = new TextEncoder().encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('').slice(0, 12);
}

async function generateAlertId(title: string, description: string): Promise<string> {
  const ts = Date.now().toString(36);
  const hash = await contentHash(title + description);
  return `alert_${ts}_${hash}`;
}

export async function classifyAlerts(
  delta: DeltaData,
  briefing: BriefingData,
  llmConfig?: LLMConfig,
): Promise<Alert[]> {
  let alerts: Alert[];

  if (llmConfig?.apiKey) {
    try {
      alerts = await evaluateAlerts(delta, briefing, llmConfig);
    } catch {
      alerts = evaluateAlertsByRules(delta, briefing);
    }
  } else {
    alerts = evaluateAlertsByRules(delta, briefing);
  }

  const now = new Date().toISOString();
  const enriched: Alert[] = [];

  for (const alert of alerts) {
    const id = alert.id || (await generateAlertId(alert.title, alert.description));
    enriched.push({
      ...alert,
      id,
      timestamp: alert.timestamp || now,
    });
  }

  return enriched;
}

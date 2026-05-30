import { LLMConfig, BriefingData, TradeIdea } from '../types';
import { callLLM } from './provider';

const SYSTEM_PROMPT = `You are a quantitative analyst specializing in cross-domain intelligence analysis. Based on multi-source intelligence data including market data, risk indicators, OSINT signals, and conflict events, generate actionable trade ideas.

For each trade idea, provide:
- direction: "long", "short", or "hedge"
- asset: specific ticker or asset name
- timeframe: expected holding period
- confidence: 0-100 score
- rationale: brief explanation linking cross-domain signals
- risk: key risk factor

Respond with a JSON array of trade ideas. No other text.`;

function buildBriefingSummary(briefing: BriefingData): string {
  const parts: string[] = [];

  parts.push(`Region: ${briefing.region}`);
  parts.push(`Timestamp: ${briefing.timestamp}`);
  parts.push(`Overall Delta Status: ${briefing.sweepDelta.overallStatus}`);

  if (briefing.markets.length > 0) {
    const marketItems = briefing.markets
      .flatMap((m) => m.items)
      .slice(0, 10)
      .map((i) => `${i.name}: ${i.value} (${i.changePercent >= 0 ? '+' : ''}${i.changePercent}%)`)
      .join('; ');
    parts.push(`Markets: ${marketItems}`);
  }

  if (briefing.riskGauges.length > 0) {
    const gauges = briefing.riskGauges
      .map((g) => `${g.name}: ${g.value}${g.unit} (trend: ${g.trend})`)
      .join('; ');
    parts.push(`Risk Gauges: ${gauges}`);
  }

  if (briefing.osintFeed.length > 0) {
    const posts = briefing.osintFeed
      .slice(0, 5)
      .map((p) => `[${p.urgency}] ${p.channel}: ${p.content}`)
      .join('; ');
    parts.push(`OSINT: ${posts}`);
  }

  if (briefing.newsTicker.length > 0) {
    const news = briefing.newsTicker
      .slice(0, 5)
      .map((n) => `${n.title} (${n.category})`)
      .join('; ');
    parts.push(`News: ${news}`);
  }

  if (briefing.nuclearWatch.length > 0) {
    const nuclear = briefing.nuclearWatch
      .filter((n) => n.status !== 'normal')
      .map((n) => `${n.name}: ${n.cpm} CPM (${n.status})`)
      .join('; ');
    if (nuclear) parts.push(`Nuclear Alerts: ${nuclear}`);
  }

  if (briefing.crossSignals.length > 0) {
    const signals = briefing.crossSignals
      .map((s) => `${s.domain}: ${s.signals.join(', ')} (severity: ${s.severity}, correlation: ${s.correlation})`)
      .join('; ');
    parts.push(`Cross Signals: ${signals}`);
  }

  if (briefing.sweepDelta.entries.length > 0) {
    const deltas = briefing.sweepDelta.entries
      .slice(0, 10)
      .map((d) => `[${d.severity}] ${d.type} from ${d.source}: ${d.description}`)
      .join('; ');
    parts.push(`Delta Changes: ${deltas}`);
  }

  return parts.join('\n\n');
}

function generateFallbackIdeas(briefing: BriefingData): TradeIdea[] {
  const ideas: TradeIdea[] = [];

  const vixItem = briefing.markets
    .flatMap((m) => m.items)
    .find((i) => i.name.toLowerCase().includes('vix'));

  if (vixItem && vixItem.value > 25) {
    ideas.push({
      direction: 'hedge',
      asset: 'SPY',
      timeframe: '1-2 weeks',
      confidence: 60,
      rationale: `VIX elevated at ${vixItem.value}, suggesting increased market uncertainty`,
      risk: 'VIX may revert quickly if volatility subsides',
    });
  }

  const criticalNuclear = briefing.nuclearWatch.filter((n) => n.status === 'critical');
  if (criticalNuclear.length > 0) {
    ideas.push({
      direction: 'long',
      asset: 'GLD',
      timeframe: '1-3 months',
      confidence: 50,
      rationale: `Nuclear radiation anomalies detected at ${criticalNuclear.map((n) => n.name).join(', ')}`,
      risk: 'Anomalies may be sensor errors or temporary',
    });
  }

  const criticalOsint = briefing.osintFeed.filter((p) => p.urgency === 'critical');
  if (criticalOsint.length > 0) {
    ideas.push({
      direction: 'short',
      asset: 'EEM',
      timeframe: '1-2 weeks',
      confidence: 45,
      rationale: `${criticalOsint.length} critical OSINT signals detected, potential geopolitical risk`,
      risk: 'OSINT signals may not translate to market impact',
    });
  }

  if (ideas.length === 0) {
    ideas.push({
      direction: 'hedge',
      asset: 'TLT',
      timeframe: '1 month',
      confidence: 30,
      rationale: 'No strong directional signals detected, defensive positioning recommended',
      risk: 'Opportunity cost of hedging in stable conditions',
    });
  }

  return ideas;
}

export async function generateTradeIdeas(
  config: LLMConfig,
  briefing: BriefingData,
): Promise<TradeIdea[]> {
  const userPrompt = buildBriefingSummary(briefing);

  try {
    const response = await callLLM(config, userPrompt, SYSTEM_PROMPT);
    const cleaned = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!Array.isArray(parsed)) {
      return generateFallbackIdeas(briefing);
    }

    return parsed.map((idea: Record<string, unknown>) => ({
      direction: (['long', 'short', 'hedge'].includes(idea.direction as string)
        ? idea.direction
        : 'hedge') as TradeIdea['direction'],
      asset: (idea.asset as string) || 'UNKNOWN',
      timeframe: (idea.timeframe as string) || 'unknown',
      confidence: typeof idea.confidence === 'number' ? idea.confidence : 50,
      rationale: (idea.rationale as string) || '',
      risk: (idea.risk as string) || '',
    }));
  } catch {
    return generateFallbackIdeas(briefing);
  }
}

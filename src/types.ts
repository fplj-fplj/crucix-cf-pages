export enum AlertTier {
  FLASH = 'FLASH',
  PRIORITY = 'PRIORITY',
  ROUTINE = 'ROUTINE',
}

export enum LLMProvider {
  OpenAI = 'openai',
  Anthropic = 'anthropic',
  Google = 'google',
  Gemini = 'gemini',
  Groq = 'groq',
  OpenRouter = 'openrouter',
  MiniMax = 'minimax',
  Mistral = 'mistral',
  Grok = 'grok',
  Local = 'local',
}

export enum Region {
  WORLD = 'WORLD',
  AMERICAS = 'AMERICAS',
  EUROPE = 'EUROPE',
  MIDDLE_EAST = 'MIDDLE_EAST',
  ASIA_PACIFIC = 'ASIA_PACIFIC',
  AFRICA = 'AFRICA',
}

export interface SensorGridItem {
  name: string;
  value: number;
  unit: string;
  status: 'normal' | 'elevated' | 'critical';
  icon: string;
}

export interface NuclearSite {
  name: string;
  location: string;
  cpm: number;
  status: 'normal' | 'elevated' | 'critical';
  lat: number;
  lng: number;
}

export interface RiskGauge {
  name: string;
  value: number;
  unit: string;
  trend: 'rising' | 'falling' | 'stable';
  threshold: number;
}

export interface SpaceObject {
  name: string;
  count: number;
  type: 'satellite' | 'debris' | 'rocket_body' | 'unknown';
  details: string;
}

export interface NewsItem {
  title: string;
  source: string;
  time: string;
  category: string;
  lat?: number;
  lng?: number;
}

export interface OsintPost {
  channel: string;
  content: string;
  time: string;
  tags: string[];
  urgency: 'low' | 'medium' | 'high' | 'critical';
}

export interface MarketItem {
  name: string;
  value: number;
  change: number;
  changePercent: number;
  category: string;
}

export interface MarketData {
  category: string;
  items: MarketItem[];
}

export interface TradeIdea {
  direction: 'long' | 'short' | 'hedge';
  asset: string;
  timeframe: string;
  confidence: number;
  rationale: string;
  risk: string;
}

export interface CrossSignal {
  domain: string;
  signals: string[];
  correlation: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeltaEntry {
  type: 'new' | 'escalation' | 'deescalation' | 'numeric_change';
  source: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  oldValue?: number;
  newValue?: number;
}

export interface DeltaData {
  timestamp: string;
  overallStatus: 'stable' | 'shift' | 'alert';
  entries: DeltaEntry[];
  summary: string;
}

export interface SignalGuideEntry {
  name: string;
  meaning: string;
  whyItMatters: string;
  notProofOf: string;
  example: string;
}

export interface Alert {
  id: string;
  tier: AlertTier;
  title: string;
  description: string;
  timestamp: string;
  sources: string[];
  confidence: number;
  correlations: string[];
}

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export interface TranslationConfig {
  enabled: boolean;
  provider: string;
  apiKey?: string;
  baseUrl?: string;
  targetLang: string;
}

export interface Settings {
  apiKeys: Record<string, string>;
  llm: LLMConfig;
  translation?: TranslationConfig;
  telegram?: { botToken: string; chatId: string };
  discord?: { webhookUrl: string; botToken?: string; channelId?: string; guildId?: string };
  refreshInterval: number;
}

export interface SweepStatus {
  lastSweep: string;
  nextSweep: string;
  sourceCount: number;
  healthySources: number;
  isSweeping: boolean;
}

export interface GeoPoint {
  lat: number;
  lng: number;
  label: string;
  type: string;
  details?: string;
}

export interface FlightArc {
  start: GeoPoint;
  end: GeoPoint;
  count: number;
}

export interface SourceResult {
  source: string;
  success: boolean;
  data?: unknown;
  error?: string;
  timestamp: string;
}

export interface BriefingData {
  timestamp: string;
  region: Region;
  sensorGrid: SensorGridItem[];
  nuclearWatch: NuclearSite[];
  riskGauges: RiskGauge[];
  spaceWatch: SpaceObject[];
  newsTicker: NewsItem[];
  osintFeed: OsintPost[];
  markets: MarketData[];
  tradeIdeas: TradeIdea[];
  crossSignals: CrossSignal[];
  sweepDelta: DeltaData;
  signalGuide: SignalGuideEntry[];
  geoPoints: GeoPoint[];
  flightArcs: FlightArc[];
}

export interface Env {
  BRIEFING_KV: KVNamespace;
  CONFIG_KV: KVNamespace;
  ENCRYPTION_KEY?: string;
}

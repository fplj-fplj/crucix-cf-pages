import { fetchFirmsData } from '../sources/firms';
import { fetchOpenSkyData } from '../sources/opensky';
import { fetchAdsbData } from '../sources/adsb';
import { fetchFredData } from '../sources/fred';
import { fetchEiaData } from '../sources/eia';
import { fetchYahooData } from '../sources/yahoo-finance';
import { fetchAcledData } from '../sources/acled';
import { fetchGdeltData } from '../sources/gdelt';
import { fetchOfacData } from '../sources/ofac';
import { fetchSafecastData } from '../sources/safecast';
import { fetchEpaRadnetData } from '../sources/epa-radnet';
import { fetchWhoData } from '../sources/who';
import { fetchAisData } from '../sources/ais-stream';
import { fetchCisaKevData } from '../sources/cisa-kev';
import { fetchCfRadarData } from '../sources/cf-radar';
import { fetchCelesttrakData } from '../sources/celesttrak';
import { fetchRssData } from '../sources/rss';
import { fetchTelegramOsintData } from '../sources/telegram-osint';
import { fetchUsDebtData } from '../sources/us-debt';
import { fetchGscpiData } from '../sources/gscpi';
import type { SourceResult, Settings, BriefingData, DeltaData } from '../types';
import { synthesizeBriefing } from './synthesizer';
import { computeDelta } from '../delta/engine';

export { computeDelta };

export interface SweepResult {
  briefing: BriefingData;
  results: SourceResult[];
}

export async function runSweep(config: Settings): Promise<SweepResult> {
  const keys = config.apiKeys ?? {};
  const telegramToken = config.telegram?.botToken ?? '';

  const sourcePromises: Promise<SourceResult>[] = [
    fetchFirmsData(keys.FIRMS_MAP_KEY ?? ''),
    fetchOpenSkyData(),
    fetchAdsbData(keys.ADSB_API_KEY ?? ''),
    fetchFredData(keys.FRED_API_KEY ?? ''),
    fetchEiaData(keys.EIA_API_KEY ?? ''),
    fetchYahooData(),
    fetchAcledData(keys.ACLED_EMAIL ?? '', keys.ACLED_PASSWORD ?? ''),
    fetchGdeltData(),
    fetchOfacData(),
    fetchSafecastData(),
    fetchEpaRadnetData(),
    fetchWhoData(),
    fetchAisData(keys.AISSTREAM_API_KEY ?? ''),
    fetchCisaKevData(),
    fetchCfRadarData(keys.CLOUDFLARE_API_TOKEN ?? ''),
    fetchCelesttrakData(),
    fetchRssData(),
    fetchTelegramOsintData(telegramToken, keys.TELEGRAM_CHANNELS),
    fetchUsDebtData(),
    fetchGscpiData(),
  ];

  const settled = await Promise.allSettled(sourcePromises);

  const results: SourceResult[] = settled.map((r, i) => {
    if (r.status === 'fulfilled') return r.value;
    return {
      source: `source-${i}`,
      success: false,
      error: r.reason instanceof Error ? r.reason.message : String(r.reason),
      timestamp: new Date().toISOString(),
    };
  });

  const briefing = synthesizeBriefing(results);

  return { briefing, results };
}

import type {
  SourceResult,
  BriefingData,
  SensorGridItem,
  NuclearSite,
  RiskGauge,
  SpaceObject,
  NewsItem,
  OsintPost,
  MarketData,
  TradeIdea,
  CrossSignal,
  DeltaData,
  SignalGuideEntry,
  GeoPoint,
  FlightArc,
  Region,
} from '../types';

function findResult(results: SourceResult[], source: string): SourceResult | undefined {
  return results.find((r) => r.source === source && r.success);
}

function getData<T>(results: SourceResult[], source: string): T | null {
  const r = findResult(results, source);
  return r?.data ? (r.data as T) : null;
}

function buildSensorGrid(results: SourceResult[]): SensorGridItem[] {
  const items: SensorGridItem[] = [];

  const opensky = getData<any>(results, 'opensky');
  if (opensky) {
    items.push({
      name: 'Aviation Activity',
      value: opensky.totalAircraft ?? 0,
      unit: 'aircraft',
      status: opensky.totalAircraft > 12000 ? 'elevated' : 'normal',
      icon: '✈',
    });
  } else {
    items.push({ name: 'Aviation Activity', value: 0, unit: 'aircraft', status: 'normal', icon: '✈' });
  }

  const adsb = getData<any>(results, 'adsb');
  if (adsb) {
    items.push({
      name: 'ADS-B Tracked',
      value: adsb.totalAircraft ?? 0,
      unit: 'aircraft',
      status: adsb.noCallsign > 500 ? 'elevated' : 'normal',
      icon: '📡',
    });
  } else {
    items.push({ name: 'ADS-B Tracked', value: 0, unit: 'aircraft', status: 'normal', icon: '📡' });
  }

  const firms = getData<any>(results, 'firms');
  if (firms) {
    items.push({
      name: 'Thermal Detections',
      value: firms.total ?? 0,
      unit: 'hotspots',
      status: firms.total > 5000 ? 'critical' : firms.total > 2000 ? 'elevated' : 'normal',
      icon: '🔥',
    });
  } else {
    items.push({ name: 'Thermal Detections', value: 0, unit: 'hotspots', status: 'normal', icon: '🔥' });
  }

  const safecast = getData<any>(results, 'safecast');
  if (safecast) {
    const anomalyCount = safecast.anomalies?.length ?? 0;
    items.push({
      name: 'Radiation Anomalies',
      value: anomalyCount,
      unit: 'sites',
      status: anomalyCount > 10 ? 'critical' : anomalyCount > 3 ? 'elevated' : 'normal',
      icon: '☢',
    });
  } else {
    items.push({ name: 'Radiation Anomalies', value: 0, unit: 'sites', status: 'normal', icon: '☢' });
  }

  const ais = getData<any>(results, 'ais-stream');
  if (ais) {
    const vesselCount = ais.vessels?.length ?? 0;
    items.push({
      name: 'Maritime Traffic',
      value: vesselCount,
      unit: 'vessels',
      status: vesselCount > 3000 ? 'elevated' : 'normal',
      icon: '🚢',
    });
  } else {
    items.push({ name: 'Maritime Traffic', value: 0, unit: 'vessels', status: 'normal', icon: '🚢' });
  }

  const acled = getData<any>(results, 'acled');
  if (acled) {
    items.push({
      name: 'Conflict Events',
      value: acled.totalEvents ?? 0,
      unit: 'events',
      status: acled.fatalities > 500 ? 'critical' : acled.fatalities > 100 ? 'elevated' : 'normal',
      icon: '⚔',
    });
  } else {
    items.push({ name: 'Conflict Events', value: 0, unit: 'events', status: 'normal', icon: '⚔' });
  }

  const who = getData<any>(results, 'who');
  if (who) {
    const alertCount = who.alerts?.length ?? 0;
    items.push({
      name: 'Health Alerts',
      value: alertCount,
      unit: 'alerts',
      status: alertCount > 20 ? 'critical' : alertCount > 5 ? 'elevated' : 'normal',
      icon: '🏥',
    });
  } else {
    items.push({ name: 'Health Alerts', value: 0, unit: 'alerts', status: 'normal', icon: '🏥' });
  }

  const rss = getData<any>(results, 'rss');
  if (rss) {
    items.push({
      name: 'News Volume',
      value: rss.articles?.length ?? 0,
      unit: 'articles',
      status: 'normal',
      icon: '📰',
    });
  } else {
    items.push({ name: 'News Volume', value: 0, unit: 'articles', status: 'normal', icon: '📰' });
  }

  const telegram = getData<any>(results, 'telegram-osint');
  if (telegram) {
    items.push({
      name: 'OSINT Urgent',
      value: telegram.urgentCount ?? 0,
      unit: 'posts',
      status: telegram.urgentCount > 10 ? 'critical' : telegram.urgentCount > 3 ? 'elevated' : 'normal',
      icon: '🔍',
    });
  } else {
    items.push({ name: 'OSINT Urgent', value: 0, unit: 'posts', status: 'normal', icon: '🔍' });
  }

  const celesttrak = getData<any>(results, 'celesttrak');
  if (celesttrak) {
    items.push({
      name: 'Active Satellites',
      value: celesttrak.totalActive ?? 0,
      unit: 'objects',
      status: 'normal',
      icon: '🛰',
    });
  } else {
    items.push({ name: 'Active Satellites', value: 0, unit: 'objects', status: 'normal', icon: '🛰' });
  }

  const cisa = getData<any>(results, 'cisa-kev');
  if (cisa) {
    items.push({
      name: 'Known Exploited Vulns',
      value: cisa.totalVulnerabilities ?? 0,
      unit: 'CVEs',
      status: cisa.ransomwareRelated > 50 ? 'critical' : cisa.ransomwareRelated > 20 ? 'elevated' : 'normal',
      icon: '🔒',
    });
  } else {
    items.push({ name: 'Known Exploited Vulns', value: 0, unit: 'CVEs', status: 'normal', icon: '🔒' });
  }

  const cfRadar = getData<any>(results, 'cf-radar');
  if (cfRadar) {
    const outageCount = cfRadar.outages?.length ?? 0;
    items.push({
      name: 'Internet Outages',
      value: outageCount,
      unit: 'events',
      status: outageCount > 10 ? 'critical' : outageCount > 3 ? 'elevated' : 'normal',
      icon: '🌐',
    });
  } else {
    items.push({ name: 'Internet Outages', value: 0, unit: 'events', status: 'normal', icon: '🌐' });
  }

  const usDebt = getData<any>(results, 'us-debt');
  if (usDebt) {
    items.push({
      name: 'US National Debt',
      value: Math.round((usDebt.totalDebt ?? 0) / 1e9),
      unit: 'B USD',
      status: 'normal',
      icon: '💵',
    });
  } else {
    items.push({ name: 'US National Debt', value: 0, unit: 'B USD', status: 'normal', icon: '💵' });
  }

  const gscpi = getData<any>(results, 'gscpi');
  if (gscpi) {
    items.push({
      name: 'Supply Chain Pressure',
      value: parseFloat((gscpi.currentValue ?? 0).toFixed(2)),
      unit: 'index',
      status: gscpi.currentValue > 2 ? 'critical' : gscpi.currentValue > 0.5 ? 'elevated' : 'normal',
      icon: '📦',
    });
  } else {
    items.push({ name: 'Supply Chain Pressure', value: 0, unit: 'index', status: 'normal', icon: '📦' });
  }

  const ofac = getData<any>(results, 'ofac');
  if (ofac) {
    items.push({
      name: 'Sanctions List',
      value: ofac.totalEntries ?? 0,
      unit: 'entries',
      status: 'normal',
      icon: '⚖',
    });
  } else {
    items.push({ name: 'Sanctions List', value: 0, unit: 'entries', status: 'normal', icon: '⚖' });
  }

  return items;
}

function buildNuclearWatch(results: SourceResult[]): NuclearSite[] {
  const sites: NuclearSite[] = [];

  const safecast = getData<any>(results, 'safecast');
  if (safecast) {
    const readings: any[] = safecast.readings ?? [];
    for (const r of readings) {
      const cpm = r.cpm ?? 0;
      sites.push({
        name: r.location ?? 'Unknown',
        location: r.location ?? 'Unknown',
        cpm,
        status: cpm > 150 ? 'critical' : cpm > 50 ? 'elevated' : 'normal',
        lat: r.lat ?? 0,
        lng: r.lng ?? 0,
      });
    }
  }

  const epa = getData<any>(results, 'epa-radnet');
  if (epa) {
    const monitors: any[] = epa.monitors ?? [];
    for (const m of monitors) {
      const reading = m.reading ?? 0;
      sites.push({
        name: `${m.city ?? 'Unknown'}, ${m.state ?? ''}`,
        location: `${m.city ?? 'Unknown'}, ${m.state ?? ''}`,
        cpm: reading,
        status: m.status === 'elevated' ? 'elevated' : m.status === 'critical' ? 'critical' : 'normal',
        lat: m.lat ?? 0,
        lng: m.lng ?? 0,
      });
    }
  }

  return sites;
}

function buildRiskGauges(results: SourceResult[]): RiskGauge[] {
  const gauges: RiskGauge[] = [];

  const fred = getData<any>(results, 'fred');
  if (fred) {
    const series: any[] = fred.series ?? [];
    const gaugeDefs: Record<string, { threshold: number; unit: string }> = {
      VIXCLS: { threshold: 25, unit: 'Index' },
      BAMLH0A0HYM2: { threshold: 5, unit: 'Percent' },
      DTWEXBGS: { threshold: 120, unit: 'Index' },
      ICSA: { threshold: 300000, unit: 'Claims' },
      CPIAUCSL: { threshold: 310, unit: 'Index' },
      WM2NS: { threshold: 22000, unit: 'B USD' },
      MORTGAGE30US: { threshold: 7, unit: 'Percent' },
      GSCPI: { threshold: 2, unit: 'Index' },
    };

    for (const s of series) {
      const def = gaugeDefs[s.id];
      if (!def) continue;
      const val = s.value ?? 0;
      const change = s.change ?? 0;
      gauges.push({
        name: s.title ?? s.id,
        value: parseFloat(val.toFixed(2)),
        unit: def.unit,
        trend: change > 0 ? 'rising' : change < 0 ? 'falling' : 'stable',
        threshold: def.threshold,
      });
    }
  }

  const gscpi = getData<any>(results, 'gscpi');
  if (gscpi) {
    const existing = gauges.find((g) => g.name.includes('Supply Chain'));
    if (!existing) {
      gauges.push({
        name: 'Global Supply Chain Pressure Index',
        value: parseFloat((gscpi.currentValue ?? 0).toFixed(2)),
        unit: 'Index',
        trend: gscpi.trend ?? 'stable',
        threshold: 2,
      });
    }
  }

  return gauges;
}

function buildSpaceWatch(results: SourceResult[]): SpaceObject[] {
  const objects: SpaceObject[] = [];

  const celesttrak = getData<any>(results, 'celesttrak');
  if (celesttrak) {
    objects.push({
      name: 'Active Satellites',
      count: celesttrak.totalActive ?? 0,
      type: 'satellite',
      details: `Starlink: ${celesttrak.starlinkCount ?? 0}, OneWeb: ${celesttrak.onewebCount ?? 0}`,
    });

    objects.push({
      name: 'Military/Intel Satellites',
      count: celesttrak.militarySats ?? 0,
      type: 'satellite',
      details: 'Reconnaissance, SIGINT, early warning',
    });

    objects.push({
      name: 'New Objects (30d)',
      count: celesttrak.newObjects30d ?? 0,
      type: 'unknown',
      details: 'Recently launched or cataloged',
    });

    if (celesttrak.issAltitude !== null && celesttrak.issAltitude !== undefined) {
      objects.push({
        name: 'ISS Altitude',
        count: celesttrak.issAltitude,
        type: 'satellite',
        details: 'International Space Station orbit altitude (km)',
      });
    }

    const recentLaunches: any[] = celesttrak.recentLaunches ?? [];
    for (const launch of recentLaunches.slice(0, 5)) {
      objects.push({
        name: launch.name ?? 'Unknown',
        count: 1,
        type: 'rocket_body',
        details: `Launched: ${launch.launchDate ?? 'Unknown'}`,
      });
    }
  }

  return objects;
}

function buildNewsTicker(results: SourceResult[]): NewsItem[] {
  const items: NewsItem[] = [];

  const rss = getData<any>(results, 'rss');
  if (rss) {
    const articles: any[] = rss.articles ?? [];
    for (const a of articles.slice(0, 50)) {
      items.push({
        title: a.title ?? '',
        source: a.source ?? 'RSS',
        time: a.pubDate ?? '',
        category: a.category ?? 'General',
        lat: a.lat,
        lng: a.lng,
      });
    }
  }

  const gdelt = getData<any>(results, 'gdelt');
  if (gdelt) {
    const events: any[] = gdelt.events ?? [];
    for (const e of events.slice(0, 30)) {
      items.push({
        title: e.title ?? '',
        source: e.source ?? 'GDELT',
        time: e.date ?? '',
        category: 'Geopolitical',
        lat: e.lat ?? undefined,
        lng: e.lng ?? undefined,
      });
    }
  }

  const telegram = getData<any>(results, 'telegram-osint');
  if (telegram) {
    const posts: any[] = telegram.posts ?? [];
    for (const p of posts.filter((p: any) => p.urgency === 'critical' || p.urgency === 'high').slice(0, 20)) {
      items.push({
        title: p.content?.slice(0, 120) ?? '',
        source: p.channel ?? 'Telegram',
        time: p.date ? new Date(p.date).toISOString() : '',
        category: 'OSINT',
      });
    }
  }

  items.sort((a, b) => {
    const ta = a.time ? new Date(a.time).getTime() : 0;
    const tb = b.time ? new Date(b.time).getTime() : 0;
    return tb - ta;
  });

  return items.slice(0, 100);
}

function buildOsintFeed(results: SourceResult[]): OsintPost[] {
  const posts: OsintPost[] = [];

  const telegram = getData<any>(results, 'telegram-osint');
  if (telegram) {
    const rawPosts: any[] = telegram.posts ?? [];
    for (const p of rawPosts) {
      posts.push({
        channel: p.channel ?? '',
        content: p.content ?? '',
        time: p.date ? new Date(p.date).toISOString() : '',
        tags: p.tags ?? [],
        urgency: p.urgency ?? 'low',
      });
    }
  }

  return posts.sort((a, b) => {
    const ta = a.time ? new Date(a.time).getTime() : 0;
    const tb = b.time ? new Date(b.time).getTime() : 0;
    return tb - ta;
  }).slice(0, 100);
}

function buildMarkets(results: SourceResult[]): MarketData[] {
  const categories: MarketData[] = [];

  const yahoo = getData<any>(results, 'yahoo-finance');
  if (yahoo) {
    if (yahoo.indexes?.length) {
      categories.push({
        category: 'Indices',
        items: yahoo.indexes.map((q: any) => ({
          name: q.name ?? q.symbol ?? '',
          value: q.price ?? 0,
          change: q.change ?? 0,
          changePercent: q.changePercent ?? 0,
          category: 'Indices',
        })),
      });
    }
    if (yahoo.crypto?.length) {
      categories.push({
        category: 'Crypto',
        items: yahoo.crypto.map((q: any) => ({
          name: q.name ?? q.symbol ?? '',
          value: q.price ?? 0,
          change: q.change ?? 0,
          changePercent: q.changePercent ?? 0,
          category: 'Crypto',
        })),
      });
    }
    if (yahoo.energy?.length) {
      categories.push({
        category: 'Energy Futures',
        items: yahoo.energy.map((q: any) => ({
          name: q.name ?? q.symbol ?? '',
          value: q.price ?? 0,
          change: q.change ?? 0,
          changePercent: q.changePercent ?? 0,
          category: 'Energy Futures',
        })),
      });
    }
    if (yahoo.metals?.length) {
      categories.push({
        category: 'Metals',
        items: yahoo.metals.map((q: any) => ({
          name: q.name ?? q.symbol ?? '',
          value: q.price ?? 0,
          change: q.change ?? 0,
          changePercent: q.changePercent ?? 0,
          category: 'Metals',
        })),
      });
    }
  }

  const eia = getData<any>(results, 'eia');
  if (eia) {
    const eiaItems: any[] = (eia.series ?? [])
      .filter((s: any) => s.value !== null)
      .map((s: any) => ({
        name: s.name ?? s.id ?? '',
        value: s.value ?? 0,
        change: 0,
        changePercent: 0,
        category: 'Energy Inventories',
      }));
    if (eiaItems.length > 0) {
      categories.push({ category: 'Energy Inventories', items: eiaItems });
    }
  }

  return categories;
}

function buildCrossSignals(results: SourceResult[]): CrossSignal[] {
  const signals: CrossSignal[] = [];

  const fred = getData<any>(results, 'fred');
  const gscpi = getData<any>(results, 'gscpi');
  const firms = getData<any>(results, 'firms');
  const acled = getData<any>(results, 'acled');
  const telegram = getData<any>(results, 'telegram-osint');
  const cfRadar = getData<any>(results, 'cf-radar');
  const cisa = getData<any>(results, 'cisa-kev');

  if (fred && gscpi) {
    const vixSeries = (fred.series ?? []).find((s: any) => s.id === 'VIXCLS');
    const hySeries = (fred.series ?? []).find((s: any) => s.id === 'BAMLH0A0HYM2');
    const vixVal = vixSeries?.value ?? 0;
    const hyVal = hySeries?.value ?? 0;
    const gscpiVal = gscpi.currentValue ?? 0;

    if (vixVal > 20 && gscpiVal > 0.5) {
      signals.push({
        domain: 'Financial-Supply Chain',
        signals: ['VIX elevated', 'Supply chain pressure rising'],
        correlation: 0.7,
        severity: vixVal > 30 ? 'high' : 'medium',
      });
    }

    if (vixVal > 25 && hyVal > 4) {
      signals.push({
        domain: 'Credit-Volatility',
        signals: ['VIX spike', 'HY spread widening'],
        correlation: 0.8,
        severity: vixVal > 35 ? 'critical' : 'high',
      });
    }
  }

  if (firms && acled) {
    const thermalTotal = firms.total ?? 0;
    const conflictFatalities = acled.fatalities ?? 0;
    if (thermalTotal > 2000 && conflictFatalities > 100) {
      signals.push({
        domain: 'Conflict-Thermal',
        signals: ['High thermal activity', 'Elevated conflict fatalities'],
        correlation: 0.6,
        severity: conflictFatalities > 500 ? 'critical' : 'high',
      });
    }
  }

  if (telegram && cfRadar) {
    const urgentPosts = telegram.urgentCount ?? 0;
    const outages = cfRadar.outages?.length ?? 0;
    if (urgentPosts > 5 && outages > 3) {
      signals.push({
        domain: 'OSINT-Internet',
        signals: ['Urgent OSINT activity', 'Internet outages detected'],
        correlation: 0.5,
        severity: urgentPosts > 10 ? 'high' : 'medium',
      });
    }
  }

  if (cisa && cfRadar) {
    const ransomware = cisa.ransomwareRelated ?? 0;
    const outages = cfRadar.outages?.length ?? 0;
    if (ransomware > 30 && outages > 5) {
      signals.push({
        domain: 'Cyber-Infrastructure',
        signals: ['Ransomware vulnerabilities active', 'Internet disruptions'],
        correlation: 0.5,
        severity: 'high',
      });
    }
  }

  return signals;
}

function buildGeoPoints(results: SourceResult[]): GeoPoint[] {
  const points: GeoPoint[] = [];

  const firms = getData<any>(results, 'firms');
  if (firms) {
    const topFires: any[] = firms.topFires ?? [];
    for (const f of topFires.slice(0, 20)) {
      points.push({
        lat: f.lat ?? 0,
        lng: f.lng ?? 0,
        label: `Fire (FRP: ${f.frp ?? 0})`,
        type: 'thermal',
        details: `Confidence: ${f.confidence ?? 'unknown'}`,
      });
    }
  }

  const acled = getData<any>(results, 'acled');
  if (acled) {
    const recentEvents: any[] = acled.recentEvents ?? [];
    for (const e of recentEvents.slice(0, 20)) {
      points.push({
        lat: 0,
        lng: 0,
        label: `${e.type ?? 'Conflict'}: ${e.country ?? ''}`,
        type: 'conflict',
        details: `Fatalities: ${e.fatalities ?? 0}`,
      });
    }
  }

  const safecast = getData<any>(results, 'safecast');
  if (safecast) {
    const anomalies: any[] = safecast.anomalies ?? [];
    for (const a of anomalies.slice(0, 10)) {
      points.push({
        lat: a.lat ?? 0,
        lng: a.lng ?? 0,
        label: `Radiation: ${a.cpm ?? 0} CPM`,
        type: 'radiation',
        details: `Threshold: ${a.threshold ?? 150} CPM`,
      });
    }
  }

  const ais = getData<any>(results, 'ais-stream');
  if (ais) {
    const chokepoints: any[] = ais.chokepoints ?? [];
    for (const cp of chokepoints) {
      points.push({
        lat: cp.lat ?? 0,
        lng: cp.lng ?? 0,
        label: `${cp.name ?? 'Chokepoint'}: ${cp.vesselCount ?? 0} vessels`,
        type: 'maritime',
      });
    }
  }

  const cfRadar = getData<any>(results, 'cf-radar');
  if (cfRadar) {
    const outages: any[] = cfRadar.outages ?? [];
    for (const o of outages.slice(0, 20)) {
      points.push({
        lat: 0,
        lng: 0,
        label: `Outage: ${o.country ?? 'Unknown'}`,
        type: 'outage',
        details: o.type ?? '',
      });
    }
  }

  return points;
}

function buildFlightArcs(results: SourceResult[]): FlightArc[] {
  const arcs: FlightArc[] = [];

  const opensky = getData<any>(results, 'opensky');
  if (opensky) {
    const hotspots: any[] = opensky.hotspots ?? [];
    for (let i = 0; i < hotspots.length - 1; i += 2) {
      arcs.push({
        start: { lat: hotspots[i].lat ?? 0, lng: hotspots[i].lng ?? 0, label: hotspots[i].label ?? '', type: 'aviation' },
        end: { lat: hotspots[i + 1].lat ?? 0, lng: hotspots[i + 1].lng ?? 0, label: hotspots[i + 1].label ?? '', type: 'aviation' },
        count: (hotspots[i].count ?? 0) + (hotspots[i + 1].count ?? 0),
      });
    }
  }

  return arcs;
}

const SIGNAL_GUIDE: SignalGuideEntry[] = [
  {
    name: 'VIX Spike',
    meaning: 'CBOE Volatility Index above 25',
    whyItMatters: 'Indicates market fear and expected turbulence in equities',
    notProofOf: 'Imminent market crash or economic collapse',
    example: 'VIX at 35 during geopolitical tension — markets pricing uncertainty, not certainty of loss',
  },
  {
    name: 'HY Spread Widening',
    meaning: 'High-yield bond spreads expanding above 4%',
    whyItMatters: 'Credit stress signal; lenders demanding more risk premium',
    notProofOf: 'Systemic credit crisis',
    example: 'BAML H0A0HYM2 at 5.2% — credit markets tightening, watch for contagion',
  },
  {
    name: 'Thermal Anomaly Surge',
    meaning: 'Significant increase in VIIRS fire detections',
    whyItMatters: 'May indicate military activity, infrastructure damage, or natural disasters',
    notProofOf: 'Direct military action or attack',
    example: 'Night-time thermal spike in conflict zone — consistent with but not confirming strikes',
  },
  {
    name: 'Radiation Anomaly',
    meaning: 'Safecast CPM reading above 150',
    whyItMatters: 'Potential nuclear incident or facility malfunction',
    notProofOf: 'Nuclear weapon detonation or meltdown',
    example: 'CPM 200 near nuclear plant — requires verification, could be equipment malfunction',
  },
  {
    name: 'Aviation Activity Spike',
    meaning: 'Unusual concentration of airborne aircraft in a theater',
    whyItMatters: 'May indicate military operations, evacuations, or surveillance',
    notProofOf: 'Imminent attack or military operation',
    example: '200+ aircraft over Eastern Europe — could be NATO exercise or real response',
  },
  {
    name: 'Maritime Chokepoint Congestion',
    meaning: 'Unusual vessel density at strategic chokepoints',
    whyItMatters: 'Disruption risk to global trade routes',
    notProofOf: 'Blockade or deliberate interference',
    example: '50+ vessels near Strait of Hormuz — could be weather delay or tension indicator',
  },
  {
    name: 'OSINT Urgent Signal',
    meaning: 'Multiple high-urgency posts from monitored channels',
    whyItMatters: 'Real-time crowd-sourced intelligence indicating fast-moving events',
    notProofOf: 'Verified fact or confirmed event',
    example: '3+ critical posts from different channels — cross-reference needed before acting',
  },
  {
    name: 'Internet Outage Cluster',
    meaning: 'Multiple concurrent outages in a region',
    whyItMatters: 'May indicate infrastructure attack, censorship, or natural disaster',
    notProofOf: 'Deliberate cyberattack or government shutdown',
    example: '5+ outages in Middle East — could be cable cut, power issue, or intentional',
  },
  {
    name: 'Supply Chain Pressure',
    meaning: 'GSCPI above 1.0 standard deviations',
    whyItMatters: 'Global supply chain disruptions affecting trade and inflation',
    notProofOf: 'Specific commodity shortage or economic collapse',
    example: 'GSCPI at 2.5 — supply chains under strain, watch for downstream effects',
  },
  {
    name: 'Satellite Activity Change',
    meaning: 'Unusual number of new orbital objects or military satellite maneuvers',
    whyItMatters: 'May indicate space-based military capability changes',
    notProofOf: 'Space weapon deployment or imminent space-based attack',
    example: '15 new military satellites in 30 days — capability expansion, intent unclear',
  },
];

export function synthesizeBriefing(results: SourceResult[]): BriefingData {
  return {
    timestamp: new Date().toISOString(),
    region: 'WORLD' as Region,
    sensorGrid: buildSensorGrid(results),
    nuclearWatch: buildNuclearWatch(results),
    riskGauges: buildRiskGauges(results),
    spaceWatch: buildSpaceWatch(results),
    newsTicker: buildNewsTicker(results),
    osintFeed: buildOsintFeed(results),
    markets: buildMarkets(results),
    tradeIdeas: [],
    crossSignals: buildCrossSignals(results),
    sweepDelta: {
      timestamp: new Date().toISOString(),
      overallStatus: 'stable',
      entries: [],
      summary: '',
    },
    signalGuide: SIGNAL_GUIDE,
    geoPoints: buildGeoPoints(results),
    flightArcs: buildFlightArcs(results),
  };
}

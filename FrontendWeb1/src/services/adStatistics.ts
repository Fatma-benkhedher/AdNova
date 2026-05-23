import { api } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AdStatEntry = {
  id: number;
  adId: number;
  date: string;
  views: number;
  impressions: number;
  reach: number;
  airedCount: number;
  skippedCount: number;
  femaleViews: number;
  maleViews: number;
  otherViews: number;
  ageBand0?: number;
  ageBand1?: number;
  ageBand2?: number;
  ageBand3?: number;
  ageBand4?: number;
  dwellTimeTotal: number;
  dwellTimeCount: number;
  avgDwellTimeSeconds: number;
  interactions: number;
  createdAt: string;
  updatedAt: string;
};

/** Dashboard-level totals — no adId filter. Matches GlobalSummary on the backend. */
export type StatsSummary = {
  from: string;
  to: string;
  totalViews: number;
  totalImpressions: number;
  totalReach: number;
  totalAired: number;
  totalSkipped: number;
  totalInteractions: number;
};

/** Per-ad totals */
export type RangeSummary = {
  adId: number;
  from: string;
  to: string;
  totalViews: number;
  totalInteractions: number;
};

export type DemographicsData = {
  ageGroups:   { label: string; count: number }[];
  genderSplit: { label: string; count: number }[];
};

export type RecordStatsRequest = {
  adId: number;
  date: string;
  views?: number;
  impressions?: number;
  reach?: number;
  airedCount?: number;
  skippedCount?: number;
  femaleViews?: number;
  maleViews?: number;
  otherViews?: number;
  dwellTimeTotal?: number;
  dwellTimeCount?: number;
  interactions?: number;
};

// ─── Global / Dashboard endpoints ────────────────────────────────────────────

/**
 * GET /api/ads/statistics/global/summary?from=&to=
 * Aggregated totals across ALL ads — feeds the dashboard stat cards.
 */
export async function fetchSummary(from: string, to: string): Promise<StatsSummary> {
  const res = await api.get<StatsSummary>(`/ads/statistics/global/summary`, {
    params: { from, to },
  });
  return res.data;
}

/**
 * GET /api/ads/statistics/global/range?from=&to=
 * All stat rows across every ad — feeds the Top Ads table.
 */
export async function fetchStatsByRange(from: string, to: string): Promise<AdStatEntry[]> {
  const res = await api.get<AdStatEntry[]>(`/ads/statistics/global/range`, {
    params: { from, to },
  });
  return res.data;
}

/**
 * GET /api/ads/statistics/global/demographics?from=&to=
 * Gender split + age group buckets — feeds the demographics donuts.
 */
export async function fetchDemographics(from: string, to: string): Promise<DemographicsData> {
  const res = await api.get<DemographicsData>(`/ads/statistics/global/demographics`, {
    params: { from, to },
  });
  return res.data;
}

// ─── Per-ad endpoints ─────────────────────────────────────────────────────────

/** POST /api/ads/statistics — upsert daily stats */
export async function recordStats(req: RecordStatsRequest): Promise<AdStatEntry> {
  const res = await api.post<AdStatEntry>(`/ads/statistics`, req);
  return res.data;
}

/** GET /api/ads/{adId}/statistics?date=2025-06-01 */
export async function fetchStatsByDate(adId: number, date: string): Promise<AdStatEntry> {
  const res = await api.get<AdStatEntry>(`/ads/${adId}/statistics`, { params: { date } });
  return res.data;
}

/** GET /api/ads/{adId}/statistics/all */
export async function fetchAllStatsByAd(adId: number): Promise<AdStatEntry[]> {
  const res = await api.get<AdStatEntry[]>(`/ads/${adId}/statistics/all`);
  return res.data;
}

/** GET /api/ads/{adId}/statistics/range?from=&to= */
export async function fetchStatsByAdAndRange(
  adId: number,
  from: string,
  to: string
): Promise<AdStatEntry[]> {
  const res = await api.get<AdStatEntry[]>(`/ads/${adId}/statistics/range`, {
    params: { from, to },
  });
  return res.data;
}

/** GET /api/ads/{adId}/statistics/summary?from=&to= */
export async function fetchAdSummary(
  adId: number,
  from: string,
  to: string
): Promise<RangeSummary> {
  const res = await api.get<RangeSummary>(`/ads/${adId}/statistics/summary`, {
    params: { from, to },
  });
  return res.data;
}

/** PUT /api/ads/statistics/{id} */
export async function updateStats(id: number, req: RecordStatsRequest): Promise<AdStatEntry> {
  const res = await api.put<AdStatEntry>(`/ads/statistics/${id}`, req);
  return res.data;
}

/** DELETE /api/ads/statistics/{id} */
export async function deleteStats(id: number): Promise<void> {
  await api.delete(`/ads/statistics/${id}`);
}
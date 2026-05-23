import { api } from "./api";
import type { DemographicsData } from "./adStatistics";
import type { AiCoreMetrics } from "../types/ai";
import type { StatsSummary } from "./adStatistics";

export async function fetchAiDemographics(from: string, to: string): Promise<DemographicsData> {
  const res = await api.get<DemographicsData>("/ai-analysis/demographics", {
    params: { from, to },
  });
  return res.data;
}

export async function fetchAiSummary(from: string, to: string): Promise<StatsSummary & { dwellSecondsTotal: number; dwellSamples: number }> {
  const res = await api.get<{
    totalViews: number;
    totalImpressions: number;
    totalReach: number;
    dwellSecondsTotal: number;
    dwellSamples: number;
  }>("/ai-analysis/summary", { params: { from, to } });

  return {
    from,
    to,
    totalViews: res.data.totalViews ?? 0,
    totalImpressions: res.data.totalImpressions ?? 0,
    totalReach: res.data.totalReach ?? 0,
    totalAired: res.data.totalViews ?? 0,
    totalSkipped: 0,
    totalInteractions: 0,
    dwellSecondsTotal: res.data.dwellSecondsTotal ?? 0,
    dwellSamples: res.data.dwellSamples ?? 0,
  };
}

export function computeAiCoreMetrics(dwellTotal: number, dwellSamples: number, reachTotal: number): AiCoreMetrics {
  return {
    avgDwellSeconds: dwellSamples > 0 ? Number((dwellTotal / dwellSamples).toFixed(1)) : 0,
    totalReach: Math.max(0, reachTotal),
  };
}

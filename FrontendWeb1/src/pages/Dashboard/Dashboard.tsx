import { useState, useEffect, useMemo } from "react";
import Countpeople from "../../components/operator_dashboard/Countpeople";
import StatisticsYearAdsChart from "../../components/operator_dashboard/StatisticsYearAdsChart";
import AdsMonthlyTarget from "../../components/operator_dashboard/AdsMonthlyTarget";
import MonthlyAdsChart from "../../components/operator_dashboard/MonthlyAdsChart";
import Chart from "react-apexcharts";
import PageMeta from "../../components/common/PageMeta";
import { ApexOptions } from "apexcharts";
import {
  VideoCameraIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import {
  StatsSummary, AdStatEntry, DemographicsData,
} from "../../services/adStatistics";
import { fetchSummary, fetchDemographics } from "../../services/adStatistics";
import { fetchAiDemographics, computeAiCoreMetrics } from "../../services/aiAnalysis";
import { fetchUserAdvertisements, Advertisement } from "../../services/AdvertisementsList";

// ── Donut Chart ───────────────────────────────────────────────────────────────
interface DonutChartProps {
  title: string;
  labels: string[];
  series: number[];
  colors?: string[];
  height?: number;
}

const DonutChart = ({
  title, labels, series,
  colors = ["#F97316", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"],
  height = 220,
}: DonutChartProps) => {
  const options: ApexOptions = {
    labels,
    chart: { type: "donut", toolbar: { show: false }, background: "transparent" },
    legend: { position: "bottom", fontSize: "12px", fontFamily: "inherit" },
    dataLabels: { enabled: false },
    colors,
    plotOptions: {
      pie: {
        donut: {
          size: "70%",
          labels: {
            show: true,
            total: {
              show: true, label: "Total", fontSize: "11px", fontWeight: 600, color: "#6B7280",
              formatter: (w) =>
                w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString(),
            },
          },
        },
      },
    },
    stroke: { width: 2 },
  };
  return (
    <div className="flex flex-col items-center">
      <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-gray-500 dark:text-gray-400">
        {title}
      </p>
      <Chart options={options} series={series} type="donut" height={height} width="100%" />
    </div>
  );
};

// ── Section Label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <div className="col-span-12 flex items-center gap-3 mt-2 mb-1">
    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
    <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400 dark:text-gray-500 whitespace-nowrap">
      {children}
    </span>
    <span className="h-px flex-1 bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-gray-700" />
  </div>
);

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({
  icon, label, value, accent, loading,
}: {
  icon: string; label: string; value: string; accent: string; loading?: boolean;
}) => (
  <div className="flex items-center gap-3 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-700 rounded-2xl px-5 py-4 shadow-sm">
    <div
      className="flex h-10 w-10 items-center justify-center rounded-xl text-xl flex-shrink-0"
      style={{ background: accent + "18", color: accent }}
    >
      {icon}
    </div>
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 leading-none mb-1">
        {label}
      </p>
      {loading ? (
        <div className="h-6 w-14 rounded bg-gray-100 dark:bg-gray-800 animate-pulse" />
      ) : (
        <p className="text-2xl font-extrabold leading-none" style={{ color: accent }}>{value}</p>
      )}
    </div>
  </div>
);

// ── Top Ads Table ─────────────────────────────────────────────────────────────
const TopAdsTable = ({
  entries, ads, loading,
}: {
  entries: AdStatEntry[];
  ads: Advertisement[];
  loading: boolean;
}) => {
  const adMap: Record<number, { name: string; views: number; aired: number; impressions: number }> = {};

  entries.forEach((e) => {
    const adId = e.adId;
    if (!adId) return;
    const name = ads.find((a) => a.id === adId)?.name ?? `Ad #${adId}`;
    if (!adMap[adId]) adMap[adId] = { name, views: 0, aired: 0, impressions: 0 };
    adMap[adId].views       += e.views       ?? 0;
    adMap[adId].aired       += e.airedCount  ?? 0;
    adMap[adId].impressions += e.impressions ?? 0;
  });

  const rows = Object.values(adMap).sort((a, b) => b.views - a.views).slice(0, 6);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
      <div className="p-5">
        <p className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
          Top Ads — This Period
        </p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-8">No statistics recorded yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <th className="text-left pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Ad Name</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Views</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Aired</th>
                  <th className="text-right pb-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Impressions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {rows.map((row, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/50 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-gray-900 dark:text-white truncate max-w-[180px]">
                      {row.name}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                      {row.views.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {row.aired.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-right font-semibold text-orange-600 dark:text-orange-400">
                      {row.impressions.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Audience reactions (DB-backed per advertiser creative) ────────────────────
function AudienceReactionsPanel({
  ads,
  loading,
}: {
  ads: Advertisement[];
  loading: boolean;
}) {
  const rows = ads ?? [];
  const totals = rows.reduce(
    (acc, row) => ({
      likes: acc.likes + (row.likeCount ?? 0),
      dislikes: acc.dislikes + (row.dislikeCount ?? 0),
      loves: acc.loves + (row.loveCount ?? 0),
    }),
    { likes: 0, dislikes: 0, loves: 0 }
  );

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow overflow-hidden mb-6">
      <div className="h-1 bg-gradient-to-r from-pink-400 via-rose-500 to-orange-400" />
      <div className="p-5 md:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600">
              <VideoCameraIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900 dark:text-white">Audience reactions</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Likes, dislikes, and love per video (from your campaigns in the database)
              </p>
            </div>
          </div>
          {!loading && rows.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs font-semibold">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-3 py-1.5 border border-emerald-200/80 dark:border-emerald-800">
                <HandThumbUpIcon className="w-3.5 h-3.5" /> {totals.likes} total likes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 px-3 py-1.5 border border-amber-200/80 dark:border-amber-800">
                <HandThumbDownIcon className="w-3.5 h-3.5" /> {totals.dislikes} total dislikes
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pink-50 dark:bg-pink-950/40 text-pink-800 dark:text-pink-200 px-3 py-1.5 border border-pink-200/80 dark:border-pink-800">
                <HeartIcon className="w-3.5 h-3.5" /> {totals.loves} total love
              </span>
            </div>
          )}
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
            ))}
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-center text-gray-500 dark:text-gray-400 py-10">
            No ads found for your account, or the list could not be loaded. Check that you are logged in as an advertiser
            and that the API <code className="text-xs bg-gray-100 dark:bg-gray-800 px-1 rounded">GET /advertisements/user/{"{id}"}</code> returns your campaigns.
          </p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-100 dark:border-gray-800">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-800/50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                  <th className="px-4 py-3">Video / campaign</th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1"><HandThumbUpIcon className="w-4 h-4 text-emerald-600" /> Likes</span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1"><HandThumbDownIcon className="w-4 h-4 text-amber-600" /> Dislikes</span>
                  </th>
                  <th className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1"><HeartIcon className="w-4 h-4 text-pink-600" /> Love</span>
                  </th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {rows.map((row) => {
                  const label =
                    (typeof row.videoName === "string" && row.videoName.trim()) ||
                    row.name ||
                    `Ad #${row.id}`;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-800/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white max-w-[240px]">
                        <span className="line-clamp-2" title={label}>{label}</span>
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-emerald-700 dark:text-emerald-400">
                        {row.likeCount ?? 0}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-amber-700 dark:text-amber-400">
                        {row.dislikeCount ?? 0}
                      </td>
                      <td className="px-4 py-3 tabular-nums font-semibold text-pink-700 dark:text-pink-400">
                        {row.loveCount ?? 0}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs font-semibold capitalize px-2 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                          {String(row.status ?? "—")}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function HomeOperator() {
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [entries, setEntries]               = useState<AdStatEntry[]>([]);
  const [aiSummary, setAiSummary]           = useState<StatsSummary & { dwellSecondsTotal: number; dwellSamples: number }>({
    from: "",
    to: "",
    totalViews: 0,
    totalImpressions: 0,
    totalReach: 0,
    totalAired: 0,
    totalSkipped: 0,
    totalInteractions: 0,
    dwellSecondsTotal: 0,
    dwellSamples: 0,
  });
  const [ads, setAds]                       = useState<Advertisement[]>([]);
  const [demographics, setDemographics]     = useState<DemographicsData>({
    ageGroups: [
      { label: "Child", count: 0 },
      { label: "Teen", count: 0 },
      { label: "Young Adult", count: 0 },
      { label: "Adult", count: 0 },
      { label: "Senior", count: 0 },
    ],
    genderSplit: [
      { label: "Male", count: 0 },
      { label: "Female", count: 0 },
      { label: "Other", count: 0 },
    ],
  });
  const [loading, setLoading]               = useState(true);
  /** True once `/advertisements/user/{id}` has finished (success or error). */
  const [adsReady, setAdsReady]             = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
               .toISOString().split("T")[0];
  const to   = today;

  useEffect(() => {
    // ── Get current user from localStorage ───────────────────────────────────
    const stored = localStorage.getItem("user");
    if (!stored) { setLoading(false); setAdsReady(true); return; }
    const user = JSON.parse(stored);
    if (!user?.id) { setLoading(false); setAdsReady(true); return; }

    setLoading(true);
    setAdsReady(false);

    // 1) User ads for reactions table
    // 2) AI summary + demographics from ai_analysis_batches
   Promise.all([
  fetchUserAdvertisements(user.id).catch(() => [] as Advertisement[]),
  fetchSummary(from, to).catch(() => null),         // ← real ad stats
  fetchDemographics(from, to).catch(() => null),    // ← real demographics
])
      .then(async ([userAds, summaryData, aiDemo]) => {
        setAds(userAds);
        setEntries([]); // no Top Ads block anymore
        if (summaryData) {
          setAiSummary(summaryData);
        }
        if (aiDemo) {
          setDemographics(aiDemo);
        }
      })
      .catch((err) => {
        console.error(err);
        setAds([]);
      })
      .finally(() => {
        setLoading(false);
        setAdsReady(true);
      });
  }, [from, to, selectedFilter]);

  const filteredEntries = useMemo(() => {
    if (selectedFilter === "all") return entries;
    const adId = Number(selectedFilter);
    if (!Number.isFinite(adId)) return entries;
    return entries.filter((e) => e.adId === adId);
  }, [entries, selectedFilter]);

  const summary: StatsSummary = useMemo(() => ({
    from,
    to,
    totalViews: aiSummary.totalViews ?? 0,
    totalImpressions: aiSummary.totalImpressions ?? 0,
    totalReach: aiSummary.totalReach ?? 0,
    totalAired: aiSummary.totalAired ?? 0,
    totalSkipped: 0,
    totalInteractions: 0,
  }), [aiSummary, from, to]);

  const aiKpis = useMemo(() => {
    const topByViews = filteredEntries.reduce<AdStatEntry | null>((best, row) => {
      if (!best) return row;
      return (row.views ?? 0) > (best.views ?? 0) ? row : best;
    }, null);

    const topLiked = ads.reduce<Advertisement | null>((best, ad) => {
      if (!best) return ad;
      return (ad.likeCount ?? 0) > (best.likeCount ?? 0) ? ad : best;
    }, null);

    const ageSorted = [...demographics.ageGroups].sort((a, b) => b.count - a.count);
    const genderSorted = [...demographics.genderSplit].sort((a, b) => b.count - a.count);
    const dominantAge = ageSorted[0]?.count ? ageSorted[0].label : "—";
    const dominantGender = genderSorted[0]?.count ? genderSorted[0].label : "—";

    const dwellTotal = filteredEntries.reduce((s, e) => s + (e.dwellTimeTotal ?? 0), 0);
    const dwellCount = filteredEntries.reduce((s, e) => s + (e.dwellTimeCount ?? 0), 0);
    const avgDwell = dwellCount > 0 ? (dwellTotal / dwellCount).toFixed(1) : "0";

    const topViewsName = topByViews
      ? ads.find((a) => a.id === topByViews.adId)?.name ?? `Ad #${topByViews.adId}`
      : "—";

    return {
      topViewsName,
      topViewsValue: topByViews?.views ?? 0,
      topLikedName: topLiked?.name ?? "—",
      topLikedValue: topLiked?.likeCount ?? 0,
      dominantAge,
      dominantGender,
      avgDwell,
    };
  }, [filteredEntries, ads, demographics]);

  const coreMetrics = useMemo(() => {
    const dwellTotal = aiSummary.dwellSecondsTotal ?? 0;
    const dwellCount = aiSummary.dwellSamples ?? 0;
    const reachTotal = aiSummary.totalReach ?? 0;
    return computeAiCoreMetrics(dwellTotal, dwellCount, reachTotal);
  }, [aiSummary]);

  const monthlyVideoStats = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const prev = new Date(y, m - 1, 1);
    const prevY = prev.getFullYear();
    const prevM = prev.getMonth();

    const currentMonthVideos = ads.filter((a) => {
      if (!a.submittedAt) return false;
      const d = new Date(a.submittedAt);
      return d.getFullYear() === y && d.getMonth() === m;
    }).length;
    const previousMonthVideos = ads.filter((a) => {
      if (!a.submittedAt) return false;
      const d = new Date(a.submittedAt);
      return d.getFullYear() === prevY && d.getMonth() === prevM;
    }).length;
    return { currentMonthVideos, previousMonthVideos };
  }, [ads]);

  const fmt = (n: number | undefined) =>
    n === undefined ? "—" : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();

  return (
    <>
      <PageMeta
        title="Operator Dashboard | Circuit Crew"
        description="Operator dashboard for monitoring ads, demographics, and playlists"
      />

      {/* ── Page Header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            Dashboard
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            Real-time overview • Ads • Audience • Statistics
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedFilter}
              onChange={(e) => setSelectedFilter(e.target.value)}
              className="appearance-none bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white pl-4 pr-10 py-2.5 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm min-w-[180px]"
            >
              <option value="all">All Campaigns</option>
              {ads.map((ad) => (
                <option key={ad.id} value={String(ad.id)}>{ad.name}</option>
              ))}
            </select>
            <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 text-xs">▼</span>
          </div>
          <button
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95"
            onClick={() => alert("Downloading report...")}
          >
            ⬇ Report
          </button>
        </div>
      </div>

      {/* ── Summary Stat Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        <StatCard icon="👁"  label="Total Views"   value={fmt(summary.totalViews)}        accent="#3B82F6" loading={loading} />
        <StatCard icon="📡" label="Total Aired"    value={fmt(summary.totalAired)}        accent="#10B981" loading={loading} />
        <StatCard icon="📣" label="Impressions"    value={fmt(summary.totalImpressions)}  accent="#F97316" loading={loading} />
        <StatCard icon="🌍" label="Total Reach"    value={fmt(summary.totalReach)}        accent="#8B5CF6" loading={loading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3 mb-6">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Top Video (Views)</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{aiKpis.topViewsName}</p>
          <p className="text-lg font-extrabold text-blue-600 dark:text-blue-400">{aiKpis.topViewsValue}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Top Video (Likes)</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{aiKpis.topLikedName}</p>
          <p className="text-lg font-extrabold text-emerald-600 dark:text-emerald-400">{aiKpis.topLikedValue}</p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Dominant Profile</p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Gender: <span className="text-indigo-600 dark:text-indigo-400">{aiKpis.dominantGender}</span></p>
          <p className="text-sm font-bold text-gray-900 dark:text-white">Age: <span className="text-indigo-600 dark:text-indigo-400">{aiKpis.dominantAge}</span></p>
        </div>
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 p-4 shadow-sm">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 mb-1">Avg Dwell Time (IA)</p>
          <p className="text-2xl font-extrabold text-purple-600 dark:text-purple-400">{aiKpis.avgDwell}s</p>
          <p className="text-xs text-gray-500">Average from AI camera batches</p>
        </div>
      </div>

      {/* ── Audience reactions (DB columns: like / dislike / love) ── */}
      <AudienceReactionsPanel ads={ads} loading={!adsReady} />

      <div className="grid grid-cols-12 gap-4 md:gap-6">
        <SectionLabel>Audience & Targets</SectionLabel>

        <div className="col-span-12 xl:col-span-7 flex">
          <div className="w-full rounded-2xl overflow-hidden shadow border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900">
            <Countpeople
              overallViewCount={summary.totalViews}
              avgDwellTimeSec={coreMetrics.avgDwellSeconds}
              dominantGender={aiKpis.dominantGender}
              dominantAgeGroup={aiKpis.dominantAge}
            />
          </div>
        </div>

        <div className="col-span-12 xl:col-span-5 flex">
          <div className="w-full rounded-2xl overflow-hidden shadow border border-orange-100 dark:border-orange-800/40 bg-gradient-to-br from-orange-50/70 to-white dark:from-gray-900 dark:to-orange-950/10 relative">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-orange-400 to-amber-500" />
            <AdsMonthlyTarget
              currentMonthVideos={monthlyVideoStats.currentMonthVideos}
              previousMonthVideos={monthlyVideoStats.previousMonthVideos}
            />
          </div>
        </div>

        <SectionLabel>Demographics Breakdown</SectionLabel>

        <div className="col-span-12">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400" />
            <div className="p-5 md:p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="rounded-xl bg-gray-50/60 dark:bg-gray-800/40 p-4">
                  <DonutChart
                    title="Age Groups"
                    labels={demographics.ageGroups.map((g: { label: string; count: number }) => g.label)}
                    series={demographics.ageGroups.map((g: { label: string; count: number }) => g.count)}
                    colors={["#6366F1","#3B82F6","#0EA5E9","#38BDF8","#BAE6FD"]}
                  />
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    {demographics.ageGroups.map((g) => `${g.label}: ${g.count}`).join(" • ")}
                  </p>
                </div>
                <div className="rounded-xl bg-gray-50/60 dark:bg-gray-800/40 p-4">
                  <DonutChart
                    title="Gender Split"
                    labels={demographics.genderSplit.map((g: { label: string; count: number }) => g.label)}
                    series={demographics.genderSplit.map((g: { label: string; count: number }) => g.count)}
                    colors={["#3B82F6","#EC4899","#A78BFA"]}
                  />
                  <p className="mt-3 text-xs text-gray-500 text-center">
                    {demographics.genderSplit.map((g) => `${g.label}: ${g.count}`).join(" • ")}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <SectionLabel>Performance Overview</SectionLabel>

        <div className="col-span-12 grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6">
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
            <div className="p-4 md:p-5">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Monthly Performance
              </p>
              <MonthlyAdsChart />
            </div>
          </div>
          <div className="rounded-2xl border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-900 shadow overflow-hidden">
            <div className="h-1 bg-gradient-to-r from-violet-500 to-purple-600" />
            <div className="p-4 md:p-5">
              <p className="mb-4 text-sm font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">
                Year in Review
              </p>
              <StatisticsYearAdsChart />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

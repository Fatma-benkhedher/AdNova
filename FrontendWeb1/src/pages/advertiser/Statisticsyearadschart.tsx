import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { fetchUserAdvertisements } from "../../services/AdvertisementsList";
import { fetchStatsByAdAndRange, AdStatEntry } from "../../services/adStatistics";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function StatisticsYearAdsChart() {
  const [impressionsSeries, setImpressionsSeries] = useState<number[]>(Array(12).fill(0));
  const [reachSeries, setReachSeries]             = useState<number[]>(Array(12).fill(0));
  const [interactionsSeries, setInteractionsSeries] = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading]                     = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (!user?.id) return;

    const year = new Date().getFullYear();
    const from = `${year}-01-01`;
    const to   = `${year}-12-31`;

    fetchUserAdvertisements(user.id)
      .then(async (ads) => {
        const approvedIds = ads.map((a) => a.id);
        if (approvedIds.length === 0) { setLoading(false); return; }

        const allResults = await Promise.all(
          approvedIds.map((adId) =>
            fetchStatsByAdAndRange(adId, from, to).catch(() => [] as AdStatEntry[])
          )
        );

        const monthlyImpressions  = Array(12).fill(0);
        const monthlyReach        = Array(12).fill(0);
        const monthlyInteractions = Array(12).fill(0);

        allResults.flat().forEach((entry) => {
          const month = new Date(entry.date).getMonth();
          monthlyImpressions[month]  += entry.impressions  ?? 0;
          monthlyReach[month]        += entry.reach        ?? 0;
          monthlyInteractions[month] += entry.interactions ?? 0;
        });

        setImpressionsSeries(monthlyImpressions);
        setReachSeries(monthlyReach);
        setInteractionsSeries(monthlyInteractions);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "area",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "inherit",
      sparkline: { enabled: false },
    },
    stroke: { curve: "smooth", width: 2.5 },
    fill: {
      type: "gradient",
      gradient: {
        shadeIntensity: 1,
        opacityFrom: 0.35,
        opacityTo: 0.02,
        stops: [0, 100],
      },
    },
    xaxis: {
      categories: MONTHS,
      labels: { style: { fontSize: "11px", colors: "#9CA3AF" } },
      axisBorder: { show: false },
      axisTicks: { show: false },
    },
    yaxis: {
      labels: {
        style: { fontSize: "11px", colors: "#9CA3AF" },
        formatter: (v) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : String(v)),
      },
    },
    colors: ["#F97316", "#8B5CF6", "#EC4899"],
    legend: {
      position: "top",
      fontSize: "12px",
      fontFamily: "inherit",
      labels: { colors: "#6B7280" },
    },
    grid: {
      borderColor: "#F3F4F6",
      strokeDashArray: 4,
      yaxis: { lines: { show: true } },
      xaxis: { lines: { show: false } },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: "light",
      y: { formatter: (v) => v.toLocaleString() },
    },
    markers: { size: 3, strokeWidth: 0 },
  };

  const series = [
    { name: "Impressions",  data: impressionsSeries },
    { name: "Reach",        data: reachSeries },
    { name: "Interactions", data: interactionsSeries },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-violet-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Chart options={options} series={series} type="area" height={260} width="100%" />
  );
}
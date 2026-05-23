import { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import { fetchUserAdvertisements } from "../../services/AdvertisementsList";
import { fetchStatsByAdAndRange, AdStatEntry } from "../../services/adStatistics";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function MonthlyAdsChart() {
  const [viewsSeries, setViewsSeries]       = useState<number[]>(Array(12).fill(0));
  const [airedSeries, setAiredSeries]       = useState<number[]>(Array(12).fill(0));
  const [loading, setLoading]               = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (!user?.id) return;

    const year  = new Date().getFullYear();
    const from  = `${year}-01-01`;
    const to    = `${year}-12-31`;

    fetchUserAdvertisements(user.id)
      .then(async (ads) => {
        const approvedIds = ads.map((a) => a.id);
        if (approvedIds.length === 0) { setLoading(false); return; }

        // Fetch stats for every ad in parallel
        const allResults = await Promise.all(
          approvedIds.map((adId) =>
            fetchStatsByAdAndRange(adId, from, to).catch(() => [] as AdStatEntry[])
          )
        );

        const monthlyViews = Array(12).fill(0);
        const monthlyAired = Array(12).fill(0);

        allResults.flat().forEach((entry) => {
          const month = new Date(entry.date).getMonth(); // 0-indexed
          monthlyViews[month] += entry.views      ?? 0;
          monthlyAired[month] += entry.airedCount ?? 0;
        });

        setViewsSeries(monthlyViews);
        setAiredSeries(monthlyAired);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const options: ApexOptions = {
    chart: {
      type: "bar",
      toolbar: { show: false },
      background: "transparent",
      fontFamily: "inherit",
    },
    plotOptions: {
      bar: { borderRadius: 6, columnWidth: "55%", dataLabels: { position: "top" } },
    },
    dataLabels: { enabled: false },
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
    colors: ["#3B82F6", "#10B981"],
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
    tooltip: {
      theme: "light",
      y: { formatter: (v) => v.toLocaleString() },
    },
  };

  const series = [
    { name: "Views", data: viewsSeries },
    { name: "Aired", data: airedSeries },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="w-8 h-8 border-4 border-orange-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Chart options={options} series={series} type="bar" height={260} width="100%" />
  );
}
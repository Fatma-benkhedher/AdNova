import { useState, useEffect } from "react";
import PageMeta from "../../components/common/PageMeta";
import { Pack, fetchPackByUser } from "../../services/packs";
import { fetchCalendar, CalendarEntry } from "../../services/Calendar";
import { fetchUserAdvertisements, Advertisement } from "../../services/AdvertisementsList";
import { formatScheduledAt, localDateISO } from "../../utils/localCalendar";
import { useNavigate } from "react-router-dom";
import {
  UserCircleIcon,
  MegaphoneIcon,
  CalendarIcon,
  EnvelopeIcon,
  SignalIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  VideoCameraIcon,
  HandThumbUpIcon,
  HandThumbDownIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// Slider images
const adPacks = [
  { image: "/images/cards/card-01.png" },
  { image: "/images/cards/card-02.png" },
];


function getEffectiveStatus(adTime: string, adDay: string): "aired" | "airing" | "scheduled" {
  const now = new Date();
  const todayStr = localDateISO(now);


  if (adDay < todayStr) return "aired";

  const [hours, minutes] = adTime.split(":").map(Number);
  const adDate = new Date();
  adDate.setHours(hours, minutes, 0, 0);

  const diffMs = now.getTime() - adDate.getTime();
  const diffMins = diffMs / 60000;

  if (diffMins > 5) return "aired";      
  if (diffMins >= -1) return "airing";   
  return "scheduled";                     
}

// Status config
const statusConfig = {
  aired: {
    label: "Aired",
    icon: CheckCircleSolid,
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200",
    glow: "",
  },
  airing: {
    label: "On Air",
    icon: SignalIcon,
    dot: "bg-red-500 animate-pulse",
    badge: "bg-red-50 text-red-700 border border-red-200",
    glow: "shadow-red-100 shadow-md",
  },
  scheduled: {
    label: "Scheduled",
    icon: ClockIcon,
    dot: "bg-slate-400",
    badge: "bg-slate-50 text-slate-600 border border-slate-200",
    glow: "",
  },
};

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [calendarEntries, setCalendarEntries] = useState<CalendarEntry[]>([]);
  const [myAds, setMyAds] = useState<Advertisement[]>([]);
  const [adsReactionsLoading, setAdsReactionsLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [userPack, setUserPack] = useState<Pack | null>(null);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const currentUserId = currentUser.id;
  const todaySchedule = localDateISO(now);
  const todayLongLabel = new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);

  const adsUsedToday = calendarEntries.length;
  const adsProgress = userPack
    ? Math.min((adsUsedToday / userPack.totalVideoPlays) * 100, 100)
    : 0;

  // Tick every 30s so statuses update automatically
  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(tick);
  }, []);

  const airedCount = calendarEntries.filter((e) => getEffectiveStatus(e.time, e.day) === "aired").length;
  const airingCount = calendarEntries.filter((e) => getEffectiveStatus(e.time, e.day) === "airing").length;
  const scheduledCount = calendarEntries.filter((e) => getEffectiveStatus(e.time, e.day) === "scheduled").length;

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % adPacks.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    async function loadCalendar() {
      try {
        const entries = await fetchCalendar();
        const todaysEntries = entries
  .filter(
    (entry) =>
      entry.day === todaySchedule &&
      entry.userId === currentUserId
  )
  .sort((a, b) => a.time.localeCompare(b.time));
        setCalendarEntries(todaysEntries);
      } catch (err) {
        console.error("Failed to fetch calendar entries", err);
      } finally {
        setLoading(false);
      }
    }

    async function loadUserPack() {
      try {
        const pack = await fetchPackByUser(currentUserId);
        setUserPack(pack);
      } catch (err) {
        console.error(err);
      }
    }

    async function loadMyAds() {
      if (!currentUserId) {
        setAdsReactionsLoading(false);
        return;
      }
      try {
        const list = await fetchUserAdvertisements(currentUserId);
        setMyAds(list);
      } catch (e) {
        console.error("Failed to load advertisements for dashboard", e);
      } finally {
        setAdsReactionsLoading(false);
      }
    }

    loadCalendar();
    loadUserPack();
    loadMyAds();
  }, [todaySchedule, currentUserId]);

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % adPacks.length);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + adPacks.length) % adPacks.length);

  const handleClick = (path: string) => navigate(path);

  return (
    <>
      <PageMeta
        title="TV Channel Dashboard"
        description="Manage your ads, plans, and schedule from your dashboard"
      />

      <div className="space-y-6">

        {/* ── Slider ── */}
        <div className="relative w-full aspect-[21/5] overflow-hidden rounded-2xl shadow-xl">
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent z-10 pointer-events-none rounded-2xl" />

          {adPacks.map((pack, idx) => (
            <img
              key={idx}
              src={pack.image}
              alt={`Promo ${idx + 1}`}
              className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                idx === currentSlide ? "opacity-100" : "opacity-0"
              }`}
              loading={idx === 0 ? "eager" : "lazy"}
            />
          ))}

          {/* Live badge */}
          <button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all"
          >
            ‹
          </button>
          <button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-9 h-9 flex items-center justify-center bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-sm border border-white/20 transition-all"
          >
            ›
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
            {adPacks.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentSlide(idx)}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  idx === currentSlide ? "w-6 bg-white" : "w-1.5 bg-white/50"
                }`}
              />
            ))}
          </div>
        </div>

        {/* ── Status Summary Chips ── */}
        {!loading && calendarEntries.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              {airingCount} On Air
            </div>
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              {airedCount} Aired
            </div>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-600 px-4 py-2 rounded-full text-sm font-medium">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              {scheduledCount} Scheduled
            </div>
          </div>
        )}

        {/* ── Main Row: Schedule + Plan ── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">

          {/* Today's Schedule */}
          <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden flex flex-col">

            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center">
                  <CalendarIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Today's Broadcast</h3>
                  <p className="text-xs text-gray-400">{todayLongLabel}</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400 px-3 py-1 rounded-full">
                {calendarEntries.length} queued
              </span>
            </div>

            {/* Cards */}
            <div className="flex-grow overflow-x-auto px-6 py-5 [scrollbar-width:thin] [&::-webkit-scrollbar]:h-1.5 [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full">
              <div className="flex gap-4 min-w-max pb-2">
                {loading ? (
                  <div className="flex gap-4">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="w-56 h-28 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                    ))}
                  </div>
                ) : calendarEntries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 px-6 text-center w-full">
                    <SparklesIcon className="w-8 h-8 text-gray-300 mb-2" />
                    <p className="text-sm text-gray-400 font-medium">No ads scheduled today</p>
                  </div>
                ) : (
                  calendarEntries.map((ad) => {
                    const effectiveStatus = getEffectiveStatus(ad.time, ad.day);
                    const cfg = statusConfig[effectiveStatus];
                    const StatusIcon = cfg.icon;
                    return (
                      <div
                        key={ad.id}
                        className={`w-56 flex-shrink-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl p-4 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${cfg.glow}`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-3">
                          <h5 className="font-semibold text-gray-900 dark:text-white text-sm leading-snug line-clamp-2 flex-1">
                            {ad.name}
                          </h5>
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400 font-mono">{ad.time}</span>
                          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.badge}`}>
                            <StatusIcon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </div>
                        {ad.createdAt && (
                          <p className="text-[10px] text-gray-400 mt-2 leading-snug">
                            Scheduled at {formatScheduledAt(ad.createdAt)}
                          </p>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Current Plan */}
          <div className="lg:col-span-5 xl:col-span-4">
            <div className="h-full bg-gradient-to-br from-orange-500 via-amber-500 to-rose-500 rounded-2xl shadow-lg shadow-orange-200 dark:shadow-orange-900/30 p-px overflow-hidden">
              <div className="h-full bg-white dark:bg-gray-950 rounded-[15px] p-5 flex flex-col">

                {/* Header */}
                <div className="flex items-start justify-between mb-5">
                  <div>
                    <p className="text-xs font-semibold text-orange-500 uppercase tracking-widest mb-1">Current Plan</p>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">
                      {userPack?.packageName || "No Pack Assigned"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {userPack ? "Active subscription" : "Contact admin to get a pack"}
                    </p>
                  </div>
                  {userPack && (
                    <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      ACTIVE
                    </div>
                  )}
                </div>

                {/* Stats */}
                {userPack ? (
                  <div className="flex-grow space-y-4">
                    {/* Progress */}
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs text-gray-500 font-medium">Daily Usage</span>
                        <span className="text-xs font-bold text-gray-900 dark:text-white">
                          {adsUsedToday} / {userPack.totalVideoPlays}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-orange-400 via-amber-400 to-rose-400 rounded-full transition-all duration-700"
                          style={{ width: `${adsProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{Math.round(adsProgress)}% of daily limit used</p>
                    </div>

                    {/* Pack details */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-orange-50 dark:bg-orange-950/40 rounded-xl p-3">
                        <p className="text-xs text-orange-400 font-medium mb-0.5">Daily Plays</p>
                        <p className="text-lg font-bold text-orange-600">{userPack.totalVideoPlays}</p>
                      </div>
                      <div className="bg-amber-50 dark:bg-amber-950/40 rounded-xl p-3">
                        <p className="text-xs text-amber-500 font-medium mb-0.5">Duration</p>
                        <p className="text-lg font-bold text-amber-600">{userPack.duration}d</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex-grow flex items-centeer justify-center">
                    <p className="text-sm text-gray-400 text-center">No active pack. Upgrade to start broadcasting.</p>
                  </div>
                )}

                {/* CTA */}
                <div className="mt-4">
                  <button className="w-full bg-gradient-to-r from-orange-500 to-rose-500 hover:from-orange-600 hover:to-rose-600 text-white text-sm font-semibold py-2.5 px-4 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-orange-200 dark:hover:shadow-orange-900/30 active:scale-95">
                    {userPack ? "Upgrade or Renew →" : "Get a Pack →"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Per-video reactions (from advertisements table) ── */}
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-rose-50 dark:bg-rose-950 flex items-center justify-center">
                <VideoCameraIcon className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Audience reactions</h3>
                <p className="text-xs text-gray-400">Like / dislike / love counts per creative (your ads)</p>
              </div>
            </div>
          </div>

          <div className="px-6 py-5">
            {adsReactionsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-14 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
                ))}
              </div>
            ) : myAds.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No ads yet — create one to collect reactions here.
              </p>
            ) : (
              <div className="overflow-x-auto [scrollbar-width:thin]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-100 dark:border-gray-800">
                      <th className="pb-3 pr-4 font-medium">Video / campaign name</th>
                      <th className="pb-3 px-3 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <HandThumbUpIcon className="w-4 h-4 text-emerald-600" /> Likes
                        </span>
                      </th>
                      <th className="pb-3 px-3 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <HandThumbDownIcon className="w-4 h-4 text-amber-600" /> Dislikes
                        </span>
                      </th>
                      <th className="pb-3 px-3 font-medium whitespace-nowrap">
                        <span className="inline-flex items-center gap-1.5">
                          <HeartIcon className="w-4 h-4 text-pink-600" /> Love
                        </span>
                      </th>
                      <th className="pb-3 pl-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {myAds.map((row) => {
                      const likes = row.likeCount ?? 0;
                      const dislikes = row.dislikeCount ?? 0;
                      const loves = row.loveCount ?? 0;
                      const displayName =
                        (typeof row.videoName === "string" && row.videoName.trim()) ||
                        row.name ||
                        `Ad #${row.id}`;
                      return (
                        <tr key={row.id} className="text-gray-800 dark:text-gray-200">
                          <td className="py-3 pr-4 font-medium max-w-[220px]">
                            <span className="line-clamp-2" title={displayName}>
                              {displayName}
                            </span>
                          </td>
                          <td className="py-3 px-3 tabular-nums text-emerald-700 dark:text-emerald-400 font-semibold">
                            {likes}
                          </td>
                          <td className="py-3 px-3 tabular-nums text-amber-700 dark:text-amber-400 font-semibold">
                            {dislikes}
                          </td>
                          <td className="py-3 px-3 tabular-nums text-pink-700 dark:text-pink-400 font-semibold">
                            {loves}
                          </td>
                          <td className="py-3 pl-3">
                            <span className="text-xs font-semibold capitalize px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                              {String(row.status || "—")}
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

        {/* ── Quick Actions ── */}
        <div className="bg-white dark:bg-gray-950 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-widest mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "My Profile", path: "/profile", Icon: UserCircleIcon, color: "text-indigo-600 bg-indigo-50 dark:bg-indigo-950 dark:text-indigo-400" },
              { label: "Manage Ads", path: "/advertiser/advertisements", Icon: MegaphoneIcon, color: "text-rose-600 bg-rose-50 dark:bg-rose-950 dark:text-rose-400" },
              { label: "Schedule", path: "/calendar", Icon: CalendarIcon, color: "text-amber-600 bg-amber-50 dark:bg-amber-950 dark:text-amber-400" },
              { label: "Contact", path: "/contactus", Icon: EnvelopeIcon, color: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950 dark:text-emerald-400" },
            ].map(({ label, path, Icon, color }) => (
              <button
                key={path}
                onClick={() => handleClick(path)}
                className="group flex flex-col items-center justify-center gap-3 py-6 rounded-xl border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 hover:shadow-sm transition-all duration-200 active:scale-95"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color} transition-transform duration-200 group-hover:scale-110`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
              </button>
            ))}
          </div>
        </div>

      </div>
    </>
  );
}
import { useState, useRef, useEffect } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin, { DateClickArg } from "@fullcalendar/interaction";
import enGbLocale from "@fullcalendar/core/locales/en-gb";
import { Modal } from "../../components/ui/modal";
import { useModal } from "../../hooks/useModal";
import PageMeta from "../../components/common/PageMeta";
import { fetchUserAdvertisements, Advertisement } from "../../services/AdvertisementsList";
import { fetchCalendar, CalendarEntry, createCalendar, CreateCalendarPayload, scheduleAd } from "../../services/Calendar";
import { fetchScreens, ScreenDto } from "../../services/screensService";
import { Pack } from "../../services/packs";
import { api } from "../../services/api";
import {
  pad,
  localDateISO,
  normalizeToTwoMinuteSlot,
  toDatetimeLocalValue,
  formatScheduledAt,
} from "../../utils/localCalendar";
import {
  CalendarIcon,
  FunnelIcon,
  CheckCircleIcon,
  SignalIcon,
  ClockIcon,
  XMarkIcon,
  VideoCameraIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  MapPinIcon,
} from "@heroicons/react/24/outline";
import { CheckCircleIcon as CheckCircleSolid } from "@heroicons/react/24/solid";

// ── Status helpers ──────────────────────────────────────────────────────────
function computeStatus(day: string, time: string, now: Date): "scheduled" | "airing" | "aired" {
  const startDate = new Date(`${day}T${time}`);
  const endDate = new Date(startDate.getTime() + 2 * 60 * 1000);
  if (now >= startDate && now < endDate) return "airing";
  if (now >= endDate) return "aired";
  return "scheduled";
}

/** UI copy + FullCalendar: English regardless of browser locale (e.g. fr-FR). */
const CALENDAR_UI_LOCALE = "en-US";

const STATUS = {
  airing:    { label: "On Air",    dot: "bg-red-500 animate-pulse",  pill: "bg-red-50 text-red-700 border-red-200",     icon: SignalIcon,        event: "bg-red-600"    },
  aired:     { label: "Aired",     dot: "bg-emerald-500",            pill: "bg-emerald-50 text-emerald-700 border-emerald-200", icon: CheckCircleSolid, event: "bg-slate-500"  },
  scheduled: { label: "Scheduled", dot: "bg-blue-400",               pill: "bg-blue-50 text-blue-700 border-blue-200",   icon: ClockIcon,         event: "bg-blue-600"   },
};

// ── Component ───────────────────────────────────────────────────────────────
const CalendarAds: React.FC = () => {
  const [adTemplates, setAdTemplates]           = useState<Partial<Advertisement>[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Partial<Advertisement> | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<string>("all");
  const [screens, setScreens]                   = useState<ScreenDto[]>([]);
  const [selectedScreen, setSelectedScreen]     = useState<ScreenDto | null>(null);
  const [formData, setFormData]                 = useState({ startDateTime: "" });
  const [errors, setErrors]                     = useState({ startDateTime: "", template: "", screen: "" });
  const [submitStatus, setSubmitStatus]         = useState<"idle" | "success" | "error">("idle");
  const [selectedAd, setSelectedAd]             = useState<any | null>(null);
  const [userEntries, setUserEntries]           = useState<CalendarEntry[]>([]);   // ← only this user's
  const [allEntries, setAllEntries]             = useState<CalendarEntry[]>([]);   // ← for conflict checking
  const [userPack, setUserPack]                 = useState<Pack | null>(null);
  const [now, setNow]                           = useState(new Date());
  const [currentUser, setCurrentUser]           = useState<any>(null);
  const hasPack = !!userPack;
  const calendarRef = useRef<FullCalendar>(null);
  const { isOpen, openModal, closeModal } = useModal();
  const isEditing = !!selectedAd;
const { isOpen: isPackOpen, openModal: openPackModal, closeModal: closePackModal } = useModal();
  /** When opening an existing booking (API `created_at`). */
  const [bookingCreatedAt, setBookingCreatedAt] = useState<string | null>(null);
  const todayLongLabel = new Intl.DateTimeFormat(CALENDAR_UI_LOCALE, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored);
    if (!user?.id) return;
    setCurrentUser(user);

    fetchUserAdvertisements(user.id)
      .then((data) => {
        const approved = data.filter((ad) => ad.status === "Approved");
        setAdTemplates(approved.map((ad: Advertisement) => ({
          id: ad.id, name: ad.name, description: ad.description, videoName: ad.videoName,
        })));
      })
      .catch(console.error);

    fetchCalendar()
      .then((entries: CalendarEntry[]) => {
        setAllEntries(entries);
        // ── KEY FIX: only keep this user's entries for display ──
        setUserEntries(entries.filter((e) => e.userId === user.id));
      })
      .catch(console.error);

    // ── Load screens ──
    fetchScreens()
      .then((data) => {
        setScreens(data);
        if (data.length > 0) setSelectedScreen(data[0]);
      })
      .catch(console.error);

    api.get(`/packs/user/${user.id}`)
      .then((res) => setUserPack(res.data))
      .catch(console.error);
  }, []);

  // Clock tick — refreshes status every 30s
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  // ── Derived counts ─────────────────────────────────────────────────────────
  const today = localDateISO(now);
  const todayEntries = userEntries.filter((e) => e.day === today);
  const counts = {
    airing:    todayEntries.filter((e) => computeStatus(e.day, e.time, now) === "airing").length,
    aired:     todayEntries.filter((e) => computeStatus(e.day, e.time, now) === "aired").length,
    scheduled: todayEntries.filter((e) => computeStatus(e.day, e.time, now) === "scheduled").length,
  };

  // ── Conflict check ─────────────────────────────────────────────────────────
  const isSlotAvailable = (dateTimeStr: string) => {
    const newStart = new Date(dateTimeStr);
    const newEnd   = new Date(newStart.getTime() + 2 * 60 * 1000);
    return !allEntries.some((entry) => {
      const eStart = new Date(`${entry.day}T${entry.time}`);
      const eEnd   = new Date(eStart.getTime() + 2 * 60 * 1000);
      const sameAdTime = entry.adId === selectedTemplate?.id && eStart.getTime() === newStart.getTime();
      const overlaps   = newStart < eEnd && newEnd > eStart;
      return sameAdTime || overlaps;
    });
  };

  const canScheduleOnDay = (day: string) => {
    if (!userPack || !currentUser) return true;
    const count = allEntries.filter((e) => e.userId === currentUser.id && e.day === day).length;
    return count + 1 <= userPack.totalVideoPlays;
  };

  // ── Form helpers ────────────────────────────────────────────────────────────
  const resetForm = () => {
    setFormData({ startDateTime: "" });
    setSelectedTemplate(null);
    setSelectedAd(null);
    setBookingCreatedAt(null);
    setSelectedScreen(screens.length > 0 ? screens[0] : null);
    setErrors({ startDateTime: "", template: "", screen: "" });
    setSubmitStatus("idle");
  };

  const validateForm = () => {
    const errs = { startDateTime: "", template: "", screen: "" };
    let ok = true;
    if (!selectedTemplate)         { errs.template = "Please select a campaign."; ok = false; }
    if (!selectedScreen)           { errs.screen = "Please select a screen/address."; ok = false; }
    if (!isEditing) {
      if (!formData.startDateTime) { errs.startDateTime = "Start date & time is required."; ok = false; }
      else if (new Date(formData.startDateTime) < new Date()) { errs.startDateTime = "Start time cannot be in the past."; ok = false; }
    }
    setErrors(errs);
    return ok;
  };

  const handleDateClick = (info: DateClickArg) => {
  if (!hasPack) {
    openPackModal();   
    return;
  }

  resetForm();
  setFormData({ startDateTime: normalizeToTwoMinuteSlot(info.date) });
  openModal();
};
  const handleSubmit = async () => {
    if (!validateForm()) return;
    const start = new Date(formData.startDateTime);
    if (start.getMinutes() % 2 !== 0) {
      setErrors((p) => ({ ...p, startDateTime: "Minutes must be multiples of 2 (00, 02, 04…)" }));
      return;
    }
    if (!isEditing && !isSlotAvailable(formData.startDateTime)) {
      setErrors((p) => ({ ...p, startDateTime: "This slot is taken or overlaps another ad." }));
      return;
    }
    const day = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
    const time = `${pad(start.getHours())}:${pad(start.getMinutes())}`;
    if (!canScheduleOnDay(day)) {
      setErrors((p) => ({ ...p, startDateTime: `Daily limit of ${userPack?.totalVideoPlays} ads reached.` }));
      return;
    }
    if (!selectedTemplate || !currentUser?.id || !selectedScreen) return;

    const payload: CreateCalendarPayload = {
      name: selectedTemplate.name!,
      adId: selectedTemplate.id!,
      userId: currentUser.id,
      screenId: selectedScreen.id,
      day,
      time,
      status: "scheduled",
    };
    try {
      const entry = await scheduleAd(currentUser.id, payload, userPack);
      setUserEntries((p) => [...p, entry]);
      setAllEntries((p)  => [...p, entry]);
      setSubmitStatus("success");
      setTimeout(() => { closeModal(); resetForm(); }, 1500);
    } catch (err: any) {
  alert(err.message);
  setSubmitStatus("error");
}
  };

  // ── Calendar events — only user's ──────────────────────────────────────────
  const getEvents = () => {
    let events = userEntries.map((entry) => {
      const ad      = adTemplates.find((t) => t.id === entry.adId);
      const start   = new Date(`${entry.day}T${entry.time}`);
      const end     = new Date(start.getTime() + 2 * 60 * 1000);
      const status  = computeStatus(entry.day, entry.time, now);
      return {
        id: entry.id.toString(),
        title: ad?.name || entry.name || "Unnamed Ad",
        start,
        end,
        extendedProps: { status, createdAt: entry.createdAt },
        backgroundColor: STATUS[status].event.replace("bg-", ""),
        borderColor: "transparent",
      };
    });

    if (selectedCampaign !== "all") {
      const name = adTemplates.find((t) => String(t.id) === selectedCampaign)?.name;
      if (name) events = events.filter((e) => e.title === name);
    }
    return events;
  };

  // ── Event render ────────────────────────────────────────────────────────────
  const renderEventContent = (info: any) => {
    const status = info.event.extendedProps.status as keyof typeof STATUS;
    const cfg    = STATUS[status] || STATUS.scheduled;
    const Icon   = cfg.icon;
    const colorMap: Record<string, string> = {
      airing: "bg-red-500", aired: "bg-slate-500", scheduled: "bg-blue-500",
    };
    return (
      <div className={`${colorMap[status]} rounded-md px-2 py-1 text-white text-xs w-full overflow-hidden`}>
        <div className="flex items-center gap-1 font-semibold truncate">
          <Icon className="w-3 h-3 flex-shrink-0" />
          <span className="truncate">{info.event.title}</span>
        </div>
        <div className="opacity-75 mt-0.5">{cfg.label}</div>
      </div>
    );
  };

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <PageMeta title="Ad Calendar | Circuit Crew" description="Schedule and visualize your advertising campaigns" />

      {/* ── Page header ── */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
            <CalendarIcon className="w-5 h-5 text-orange-600 dark:text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">My Ad Calendar</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Your personal broadcast schedule</p>
            <p className="text-xs font-medium text-orange-700 dark:text-orange-400 mt-1">{todayLongLabel}</p>
          </div>
        </div>

        {/* Status chips + filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Status pills */}
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-red-50 border border-red-300 text-red-700 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              {counts.airing} On Air
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-emerald-50 border border-emerald-300 text-emerald-700 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              {counts.aired} Aired
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold bg-blue-50 border border-blue-300 text-blue-700 px-3 py-1.5 rounded-full">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              {counts.scheduled} Scheduled
            </span>
          </div>

          {/* Pack limit badge */}
          {userPack && (
            <span className="text-xs font-bold bg-orange-100 border border-orange-300 text-orange-800 px-3 py-1.5 rounded-full">
              {todayEntries.length} / {userPack.totalVideoPlays} today
            </span>
          )}

          {/* Campaign filter */}
       <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-full px-3 py-1.5 shadow-sm">
  <FunnelIcon className="w-4 h-4 text-gray-500" />

  <select
  value={selectedCampaign}
  onChange={(e) => setSelectedCampaign(e.target.value)}
  className="bg-white border border-gray-200 rounded-full px-3 py-1 text-sm text-gray-700 min-w-[150px] 
             focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 
             cursor-pointer"
>
  <option value="all">All Campaigns</option>
  {adTemplates.map((t) => (
    <option key={t.id} value={String(t.id)}>
      {t.name}
    </option>
  ))}
</select>
</div>

        </div>
      </div>

      {/* ── Calendar ── */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-sm overflow-hidden">
        <style>{`
          .fc { font-family: 'DM Sans', system-ui, sans-serif; }
          .fc-toolbar-title { font-size: 1rem !important; font-weight: 700 !important; color: #111827; }
          .dark .fc-toolbar-title { color: #f9fafb; }
          .fc-button-primary { background: #ea580c !important; border-color: #ea580c !important; border-radius: 8px !important; font-size: 0.8rem !important; font-weight: 600 !important; padding: 6px 14px !important; color: #fff !important; box-shadow: 0 1px 3px rgba(234,88,12,0.3) !important; }
          .fc-button-primary:hover { background: #f97316 !important; border-color: #f97316 !important; }
          .fc-button-active, .fc-button-primary:not(:disabled):active { background: #9a3412 !important; border-color: #9a3412 !important; }
          .fc-button-primary:focus { box-shadow: 0 0 0 3px rgba(234,88,12,0.35) !important; }
          .fc-button-primary:disabled { background: #fed7aa !important; border-color: #fed7aa !important; color: #c2410c !important; }
          .fc-col-header-cell { background: #fafafa; }
          .dark .fc-col-header-cell { background: #111827; }
          .fc-col-header-cell-cushion { font-size: 0.75rem; font-weight: 600; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; text-decoration: none !important; }
          .fc-timegrid-slot { border-color: #f3f4f6 !important; }
          .dark .fc-timegrid-slot { border-color: #1f2937 !important; }
          .fc-timegrid-slot-label { font-size: 0.7rem; color: #9ca3af; }
          .fc-event { border-radius: 6px !important; border: none !important; }
          .fc-daygrid-event { border-radius: 6px !important; }
          .fc-day-today { background: rgba(234,88,12,0.04) !important; }
          .dark .fc-day-today { background: rgba(234,88,12,0.08) !important; }
          .fc-scrollgrid { border-color: #e5e7eb !important; border-radius: 0 !important; }
          .dark .fc-scrollgrid { border-color: #1f2937 !important; }
          .fc-scrollgrid-section > td { border-color: #e5e7eb !important; }
          .dark .fc-scrollgrid-section > td { border-color: #1f2937 !important; }
          .fc-theme-standard td, .fc-theme-standard th { border-color: #f3f4f6 !important; }
          .dark .fc-theme-standard td, .dark .fc-theme-standard th { border-color: #1f2937 !important; }
        `}</style>
        <div className="p-4 md:p-6">
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            locale={enGbLocale}
            firstDay={0}
            initialView="timeGridWeek"
            height="auto"
            events={getEvents()}
            dateClick={handleDateClick}
            eventContent={renderEventContent}
            eventOverlap={false}
            slotEventOverlap={false}
            displayEventTime={true}
            slotMinTime="06:00:00"
            slotMaxTime="24:00:00"
            slotDuration="00:15:00"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay",
            }}
            eventClick={(info) => {
              const event = info.event;
              setSelectedAd(event);
              const id = Number(event.id);
              const fromList = userEntries.find((e) => Number(e.id) === id);
              setBookingCreatedAt(fromList?.createdAt ?? null);
              const match = adTemplates.find((t) => t.name === event.title) || adTemplates[0];
              setSelectedTemplate(match);
              setFormData({
                startDateTime: event.start ? toDatetimeLocalValue(event.start) : "",
              });
              openModal();
            }}
          />
        </div>
      </div>

      {/* ── Schedule Modal ── */}
      <Modal isOpen={isOpen} onClose={() => { closeModal(); resetForm(); }} className="max-w-2xl">
        <div className="p-6 lg:p-8 space-y-6">

          {/* Modal header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
                <CalendarIcon className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {isEditing ? "Edit Scheduled Ad" : "Schedule an Ad"}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {isEditing ? "Change campaign for this slot" : "Pick a campaign, screen, and broadcast time"}
                </p>
              </div>
            </div>
            <button onClick={() => { closeModal(); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>

          {/* Success / Error banner */}
          {submitStatus === "success" && (
            <div className="flex items-center gap-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl px-4 py-3 text-sm font-medium">
              <CheckIcon className="w-4 h-4 flex-shrink-0" />
              {isEditing ? "Ad updated successfully!" : "Ad scheduled successfully!"}
            </div>
          )}
          {submitStatus === "error" && (
            <div className="flex items-center gap-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl px-4 py-3 text-sm font-medium">
              <ExclamationTriangleIcon className="w-4 h-4 flex-shrink-0" />
              Something went wrong. Please try again.
            </div>
          )}

                {/* Pack daily limit info */}
          {userPack && (
            <div className="flex items-center justify-between bg-orange-50 dark:bg-orange-950/30 border border-orange-200 dark:border-orange-800 rounded-xl px-4 py-3">
              <span className="text-xs text-orange-700 dark:text-orange-400 font-medium">Daily limit</span>
              <span className="text-xs font-bold text-orange-800 dark:text-orange-300">
                {todayEntries.length} / {userPack.totalVideoPlays} used today
              </span>
            </div>
          )}

          {/* ── No Active Pack Warning ── Clean Professional Centered White Card */}
          {!userPack && (
            <div className="mx-auto max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md p-12 flex flex-col items-center text-center">
              
              {/* Icon */}
              <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-6">
                <ExclamationTriangleIcon className="w-10 h-10 text-orange-600 dark:text-orange-400" />
              </div>

              {/* Title */}
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                No Active Pack
              </h3>

              {/* Description */}
              <p className="text-gray-600 dark:text-gray-400 text-[15.5px] leading-relaxed max-w-xs">
                You need an active advertising pack to schedule and broadcast your ads.
              </p>

              {/* Orange Button */}
              <a
                href="/packs"
                className="mt-10 w-full sm:w-auto inline-flex items-center justify-center gap-3 
                           bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all 
                           text-white font-semibold px-10 py-4 rounded-2xl shadow-lg shadow-orange-500/30 text-base"
              >
                Browse & Purchase Packs
                <span className="text-xl leading-none opacity-80">→</span>
              </a>

              <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
                Unlock full calendar scheduling
              </p>
            </div>
          )}

          {/* Campaign picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Choose Campaign <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {adTemplates.length === 0 ? (
                <div className="col-span-2 text-center py-8 text-gray-400 text-sm">
                  No approved ads found. Submit an ad for approval first.
                </div>
              ) : (
                adTemplates.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => { setSelectedTemplate(t); setErrors((p) => ({ ...p, template: "" })); }}
                    className={`text-left rounded-xl border p-4 transition-all duration-150 ${
                      selectedTemplate?.id === t.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 ring-2 ring-orange-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{t.name}</p>
                      {selectedTemplate?.id === t.id && (
                        <CheckCircleSolid className="w-4 h-4 text-orange-500 flex-shrink-0 mt-0.5" />
                      )}
                    </div>
                    {t.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.description}</p>
                    )}
                    {t.videoName && (
                      <div className="flex items-center gap-1 mt-2 text-xs text-orange-500">
                        <VideoCameraIcon className="w-3.5 h-3.5" />
                        <span className="truncate">{t.videoName}</span>
                      </div>
                    )}
                  </button>
                ))
              )}
            </div>
            {errors.template && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {errors.template}
              </p>
            )}
          </div>

          {/* Screen/Address picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Choose Screen Location <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 gap-2 max-h-56 overflow-y-auto pr-1 [scrollbar-width:thin]">
              {screens.length === 0 ? (
                <div className="col-span-1 text-center py-6 text-gray-400 text-sm">
                  No screens available.
                </div>
              ) : (
                screens.map((screen) => (
                  <button
                    key={screen.id}
                    onClick={() => { setSelectedScreen(screen); setErrors((p) => ({ ...p, screen: "" })); }}
                    className={`text-left rounded-xl border p-3 transition-all duration-150 flex items-start gap-3 ${
                      selectedScreen?.id === screen.id
                        ? "border-orange-500 bg-orange-50 dark:bg-orange-950/20 ring-2 ring-orange-500/20"
                        : "border-gray-200 dark:border-gray-700 hover:border-orange-300 hover:bg-orange-50/50"
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      <MapPinIcon className="w-4 h-4 text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">
                        {screen.name || "Unnamed Screen"}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5">
                        {screen.address}
                      </p>
                    </div>
                    {selectedScreen?.id === screen.id && (
                      <CheckCircleSolid className="w-4 h-4 text-orange-500 flex-shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
            {errors.screen && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {errors.screen}
              </p>
            )}
          </div>

          {/* Date/time picker */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
              Broadcast Time {!isEditing && <span className="text-red-500">*</span>}
            </label>
            <input
              type="datetime-local"
              name="startDateTime"
              value={formData.startDateTime}
              onChange={(e) => {
                setFormData((p) => ({ ...p, startDateTime: e.target.value }));
                setErrors((p) => ({ ...p, startDateTime: "" }));
              }}
              disabled={isEditing}
              className={`h-11 w-full rounded-xl border px-4 text-sm transition-all
                focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500
                dark:bg-gray-800 dark:text-white
                ${isEditing ? "bg-gray-100 dark:bg-gray-700 cursor-not-allowed border-gray-200 dark:border-gray-700 text-gray-400"
                            : errors.startDateTime ? "border-red-400" : "border-gray-200 dark:border-gray-700"}`}
            />
            {errors.startDateTime && (
              <p className="mt-1.5 text-xs text-red-600 flex items-center gap-1">
                <ExclamationTriangleIcon className="w-3.5 h-3.5" /> {errors.startDateTime}
              </p>
            )}
            {isEditing && (
              <p className="mt-1.5 text-xs text-amber-600">Start time is locked after scheduling.</p>
            )}
            {isEditing && bookingCreatedAt && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                You scheduled this slot on {formatScheduledAt(bookingCreatedAt)}.
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <button
              onClick={() => { closeModal(); resetForm(); }}
              className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 hover:border-gray-400 transition-all active:scale-95"
            >
              Cancel
            </button>
         <button
  onClick={handleSubmit}
  disabled={!userPack}
  className={`px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all
    ${!userPack
      ? "bg-gray-300 cursor-not-allowed"
      : "bg-orange-600 hover:bg-orange-700 active:scale-95"}
  `}
>
  {!userPack
    ? "Buy a pack to schedule ads"
    : isEditing
      ? "Update Ad"
      : "Schedule Ad"}
</button>
          </div>
        </div>
      </Modal>
      {/* ── NO PACK MODAL ── */}
<Modal
  isOpen={isPackOpen}
  onClose={closePackModal}
  className="max-w-2xl"
>
  <div className="p-6 lg:p-8 space-y-6">

    {/* Header identical to form modal */}
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-orange-50 dark:bg-orange-950/40 flex items-center justify-center">
          <ExclamationTriangleIcon className="w-5 h-5 text-orange-600" />
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            No Active Pack
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            You need a pack before scheduling ads
          </p>
        </div>
      </div>

      <button onClick={closePackModal} className="text-gray-400 hover:text-gray-600">
        <XMarkIcon className="w-5 h-5" />
      </button>
    </div>

    {/* Body — SAME CARD STYLE */}
    <div className="mx-auto max-w-md bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-700 shadow-md p-12 flex flex-col items-center text-center">
      
      <div className="w-20 h-20 rounded-2xl bg-orange-100 dark:bg-orange-950 flex items-center justify-center mb-6">
        <ExclamationTriangleIcon className="w-10 h-10 text-orange-600 dark:text-orange-400" />
      </div>

      <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
        Purchase Required
      </h3>

      <p className="text-gray-600 dark:text-gray-400 text-[15.5px] leading-relaxed max-w-xs">
        You don’t have an active advertising pack yet.  
        Buy one to unlock ad scheduling and broadcasting.
      </p>

      <a
        href="/packs"
        className="mt-10 w-full sm:w-auto inline-flex items-center justify-center gap-3 
                   bg-orange-600 hover:bg-orange-700 active:scale-95 transition-all 
                   text-white font-semibold px-10 py-4 rounded-2xl shadow-lg shadow-orange-500/30 text-base"
      >
        Browse & Purchase Packs
        <span className="text-xl leading-none opacity-80">→</span>
      </a>

      <p className="mt-6 text-xs text-gray-400 dark:text-gray-500">
        Unlock full calendar scheduling
      </p>
    </div>
  </div>
</Modal>
    </>
  );
};

export default CalendarAds;
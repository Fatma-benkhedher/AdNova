import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import { fetchTodayPlaylists, type PlaylistRow, type PlaylistItem } from "../../services/playlists";
import { fetchScreens, type ScreenDto } from "../../services/screensService";
import {
  AdDefaultRow,
  fetchCurrentAdDefault,
  saveAdDefaultMultipart,
} from "../../services/adDefaults";
import {
  CalendarIcon,
  ExclamationTriangleIcon,
  CheckIcon,
  UserCircleIcon,
  MusicalNoteIcon,
} from "@heroicons/react/24/outline";
import { MegaphoneIcon } from "@heroicons/react/24/solid";

const pad = (n: number) => n.toString().padStart(2, "0");

function todayLocalISO(): string {
  const n = new Date();
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** Same slot step as backend playlist gaps (minutes). */
const SLOT_MS = 2 * 60 * 1000;

function parseSlotStart(day: string, time: string): Date {
  const [y, m, d] = day.split("-").map(Number);
  const timeParts = time.split(":");
  const hh = Number(timeParts[0]) || 0;
  const mm = Number(timeParts[1]) || 0;
  return new Date(y, (m || 1) - 1, d || 1, hh, mm, 0, 0);
}

function shortMediaName(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  const t = raw.trim();
  const noQuery = t.split("?")[0];
  const parts = noQuery.split("/").filter(Boolean);
  const last = parts[parts.length - 1];
  if (!last) return t.length > 52 ? `${t.slice(0, 49)}…` : t;
  return last.length > 52 ? `${last.slice(0, 49)}…` : last;
}

function friendlyAdTitle(entry: PlaylistItem): string {
  const name = entry.adName?.trim();
  if (name && name.length < 96 && !name.includes("Playlist finale") && !name.includes("__Playlist")) {
    return name;
  }
  const fromUrl =
    shortMediaName(entry.adVideoUrl) || shortMediaName(entry.adThumbnailUrl);
  return fromUrl || name || "Annonce";
}

type TimelineEntry = {
  key: string;
  playlistId: number;
  screenName: string;
  day: string;
  calendarId: number | null;
  timeLabel: string;
  slotStart: Date;
  slotEnd: Date;
  title: string;
  adVideoUrl: string | null;
  adThumbnailUrl: string | null;
  actionType: "run" | "stop";
  isDefault: boolean;
};

function injectDefaultGaps(
  sorted: TimelineEntry[],
  defaultImageUrl: string | null,
  defaultVideoUrl: string | null,
): TimelineEntry[] {
  if (!defaultImageUrl?.trim() && !defaultVideoUrl?.trim()) return sorted;
  const img = defaultImageUrl?.trim() || null;
  const vid = defaultVideoUrl?.trim() || null;
  const out: TimelineEntry[] = [];
  for (let i = 0; i < sorted.length; i++) {
    out.push(sorted[i]);
    if (i === sorted.length - 1) break;
    const cur = sorted[i];
    const next = sorted[i + 1];
    let probe = new Date(cur.slotStart.getTime() + SLOT_MS);
    while (probe.getTime() < next.slotStart.getTime()) {
      out.push({
        key: `default-${probe.getTime()}-${next.slotStart.getTime()}`,
        playlistId: cur.playlistId,
        screenName: cur.screenName,
        day: cur.day,
        calendarId: null,
        timeLabel: `${pad(probe.getHours())}:${pad(probe.getMinutes())}`,
        slotStart: new Date(probe),
        slotEnd: new Date(probe.getTime() + SLOT_MS),
        title: "Média par défaut",
        adVideoUrl: vid,
        adThumbnailUrl: img,
        actionType: "run",
        isDefault: true,
      });
      probe = new Date(probe.getTime() + SLOT_MS);
    }
  }
  return out;
}

function buildTimeline(
  playlists: PlaylistRow[],
  defaultImageUrl: string | null,
  defaultVideoUrl: string | null,
): TimelineEntry[] {
  const real: TimelineEntry[] = [];
  for (const p of playlists) {
    for (const e of p.calendarEntries) {
      if (e.calendarId == null || !e.time) continue;
      const day = e.day || p.startDate;
      if (!day) continue;
      const slotStart = parseSlotStart(day, e.time);
      real.push({
        key: `cal-${p.id}-${e.calendarId}-${e.time}`,
        playlistId: p.id,
        screenName: p.screenName,
        day,
        calendarId: e.calendarId,
        timeLabel: e.time.slice(0, 5),
        slotStart,
        slotEnd: new Date(slotStart.getTime() + SLOT_MS),
        title: friendlyAdTitle(e),
        adVideoUrl: e.adVideoUrl,
        adThumbnailUrl: e.adThumbnailUrl,
        actionType: e.actionType === "stop" ? "stop" : "run",
        isDefault: false,
      });
    }
  }
  real.sort((a, b) => a.slotStart.getTime() - b.slotStart.getTime());
  return injectDefaultGaps(real, defaultImageUrl, defaultVideoUrl);
}

function slotStatus(
  entry: TimelineEntry,
  now: Date,
): "playing" | "stopped" | "default" | "waiting" | "past" {
  if (entry.isDefault) return "default";
  if (entry.actionType === "stop") return "stopped";
  const t = now.getTime();
  const a = entry.slotStart.getTime();
  const b = entry.slotEnd.getTime();
  if (t >= a && t < b) return "playing";
  if (t >= b) return "past";
  return "waiting";
}

function statusBadgeClass(status: ReturnType<typeof slotStatus>) {
  switch (status) {
    case "playing":
      return "bg-emerald-500/15 text-emerald-800 ring-emerald-500/25 dark:text-emerald-300";
    case "stopped":
      return "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200";
    case "default":
      return "bg-sky-500/15 text-sky-900 ring-sky-500/25 dark:text-sky-200";
    case "past":
      return "bg-slate-500/10 text-slate-600 ring-slate-500/20 dark:text-slate-400";
    default:
      return "bg-amber-500/15 text-amber-900 ring-amber-500/25 dark:text-amber-200";
  }
}

function statusLabel(status: ReturnType<typeof slotStatus>) {
  switch (status) {
    case "playing":
      return "run";
    case "stopped":
      return "attente";
    case "default":
      return "default";
    case "past":
      return "passé";
    default:
      return "attente";
  }
}

type DefaultAdImageFieldProps = {
  inputId: string;
  previewUrl: string | null;
  uploading: boolean;
  pickedFileName: string;
  onFile: (file: File) => void;
  onRemove: () => void;
};

function DefaultAdImageField({
  inputId,
  previewUrl,
  uploading,
  pickedFileName,
  onFile,
  onRemove,
}: DefaultAdImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusText = uploading
    ? "Uploading…"
    : previewUrl
      ? pickedFileName || "Image ready"
      : pickedFileName || "No file selected";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-900/60">
      <p className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
        Cover image <span className="font-normal text-gray-400">(optional)</span>
      </p>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative aspect-[4/3] w-full max-w-[220px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner dark:border-gray-600 dark:bg-gray-800">
          {previewUrl ? (
            <img src={previewUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full min-h-[132px] flex-col items-center justify-center gap-1 px-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
              <span className="text-lg opacity-70">🖼️</span>
              <span>Preview</span>
            </div>
          )}
        </div>
        <div className="flex w-full min-w-0 max-w-md flex-1 flex-col items-center gap-3 sm:max-w-none sm:items-stretch">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="image/*"
            className="sr-only"
            disabled={uploading}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              ev.target.value = "";
              if (f) onFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full max-w-xs rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-none dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            Choose image file
          </button>
          <div className="w-full rounded-lg border border-gray-200/80 bg-white/80 px-3 py-2 text-center sm:text-left dark:border-gray-600 dark:bg-gray-800/80">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Selected file
            </p>
            <p
              className="mt-1 break-words text-[11px] leading-relaxed text-gray-800 dark:text-gray-100"
              title={statusText}
            >
              {statusText}
            </p>
          </div>
          {previewUrl ? (
            <button
              type="button"
              className="text-center text-[11px] font-semibold text-red-500 hover:underline sm:text-left"
              onClick={onRemove}
            >
              Remove image
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type DefaultAdVideoFieldProps = {
  inputId: string;
  previewUrl: string | null;
  uploading: boolean;
  pickedFileName: string;
  onFile: (file: File) => void;
  onRemove: () => void;
};

function DefaultAdVideoField({
  inputId,
  previewUrl,
  uploading,
  pickedFileName,
  onFile,
  onRemove,
}: DefaultAdVideoFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusText = uploading
    ? "Uploading…"
    : previewUrl
      ? pickedFileName || "Video ready"
      : pickedFileName || "No file selected";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-900/60">
      <p className="mb-3 text-xs font-semibold text-gray-700 dark:text-gray-200">
        Video <span className="font-normal text-gray-400">(optional)</span>
      </p>
      <div className="flex flex-col items-center gap-5 sm:flex-row sm:items-start">
        <div className="relative aspect-video w-full max-w-[300px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-black shadow-inner dark:border-gray-600">
          {previewUrl ? (
            <video src={previewUrl} controls className="h-full w-full object-contain" />
          ) : (
            <div className="flex h-full min-h-[132px] flex-col items-center justify-center gap-1 px-2 text-center text-[11px] text-gray-500">
              <span className="text-lg opacity-70">🎬</span>
              <span>Preview</span>
            </div>
          )}
        </div>
        <div className="flex w-full min-w-0 max-w-md flex-1 flex-col items-center gap-3 sm:max-w-none sm:items-stretch">
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept="video/*,image/gif,.gif"
            className="sr-only"
            disabled={uploading}
            onChange={(ev) => {
              const f = ev.target.files?.[0];
              ev.target.value = "";
              if (f) onFile(f);
            }}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="w-full max-w-xs rounded-xl bg-slate-800 px-5 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:max-w-none dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            Choose video file
          </button>
          <div className="w-full rounded-lg border border-gray-200/80 bg-white/80 px-3 py-2 text-center sm:text-left dark:border-gray-600 dark:bg-gray-800/80">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              Selected file
            </p>
            <p
              className="mt-1 break-words text-[11px] leading-relaxed text-gray-800 dark:text-gray-100"
              title={statusText}
            >
              {statusText}
            </p>
          </div>
          {previewUrl ? (
            <button
              type="button"
              className="text-center text-[11px] font-semibold text-red-500 hover:underline sm:text-left"
              onClick={onRemove}
            >
              Remove video
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

const OperatorDefaultAdPage: React.FC = () => {
  const [current, setCurrent] = useState<AdDefaultRow | null>(null);
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);
  const [imageUrlText, setImageUrlText] = useState("");
  const [videoUrlText, setVideoUrlText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageBlobUrl, setImageBlobUrl] = useState<string | null>(null);
  const [videoBlobUrl, setVideoBlobUrl] = useState<string | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [videoRemoved, setVideoRemoved] = useState(false);
  const [imagePickedName, setImagePickedName] = useState("");
  const [videoPickedName, setVideoPickedName] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [screens, setScreens] = useState<ScreenDto[]>([]);
  const [selectedScreenId, setSelectedScreenId] = useState("");
  const [nowTick, setNowTick] = useState(() => Date.now());

  const today = todayLocalISO();
  const now = useMemo(() => new Date(nowTick), [nowTick]);

  const isOperator = useMemo(() => {
    if (typeof window === "undefined") return false;
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return false;
      const parsed = JSON.parse(stored) as { role?: string };
      return (parsed?.role || "").toLowerCase() === "operator";
    } catch {
      return false;
    }
  }, []);

  const reload = useCallback(async () => {
    const [def, rows] = await Promise.all([
      fetchCurrentAdDefault().catch(() => null),
      fetchTodayPlaylists(today, selectedScreenId || undefined),
    ]);
    setCurrent(def);
    setPlaylists(rows);
  }, [today, selectedScreenId]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (!stored) return;
    const user = JSON.parse(stored) as { id?: number };
    if (user?.id) setCurrentUser({ id: user.id });
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchScreens()
      .then((list) => {
        if (!cancelled) setScreens(list);
      })
      .catch(() => {
        if (!cancelled) setScreens([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => setNowTick(Date.now()), 15000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        await reload();
      } catch (e) {
        console.error(e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  useEffect(() => {
    return () => {
      if (imageBlobUrl) URL.revokeObjectURL(imageBlobUrl);
      if (videoBlobUrl) URL.revokeObjectURL(videoBlobUrl);
    };
  }, [imageBlobUrl, videoBlobUrl]);

  const timeline = useMemo(() => {
    const iu = imageUrlText.trim();
    const vu = videoUrlText.trim();
    const defImg = imageRemoved
      ? null
      : imageBlobUrl ?? (iu || null) ?? current?.imageUrl ?? null;
    const defVid = videoRemoved
      ? null
      : videoBlobUrl ?? (vu || null) ?? current?.videoUrl ?? null;
    return buildTimeline(playlists, defImg, defVid);
  }, [
    playlists,
    current?.imageUrl,
    current?.videoUrl,
    imageRemoved,
    videoRemoved,
    imageUrlText,
    videoUrlText,
    imageBlobUrl,
    videoBlobUrl,
  ]);

  const trimmedImgUrl = imageUrlText.trim();
  const trimmedVidUrl = videoUrlText.trim();

  const imagePreviewDisplay = imageRemoved
    ? null
    : imageBlobUrl ?? (trimmedImgUrl || null) ?? current?.imageUrl ?? null;
  const videoPreviewDisplay = videoRemoved
    ? null
    : videoBlobUrl ?? (trimmedVidUrl || null) ?? current?.videoUrl ?? null;

  const imageStatusLabel = imageBlobUrl
    ? imagePickedName || "Image ready"
    : trimmedImgUrl
      ? shortMediaName(trimmedImgUrl) || "Image URL"
      : imagePickedName || "No file selected";

  const videoStatusLabel = videoBlobUrl
    ? videoPickedName || "Video ready"
    : trimmedVidUrl
      ? shortMediaName(trimmedVidUrl) || "Video URL"
      : videoPickedName || "No file selected";

  const pickImage = (f: File) => {
    setImageRemoved(false);
    setImageFile(f);
    setImagePickedName(f.name);
    setImageBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const pickVideo = (f: File) => {
    setVideoRemoved(false);
    setVideoFile(f);
    setVideoPickedName(f.name);
    setVideoBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });
  };

  const removeImagePick = () => {
    setImageFile(null);
    setImagePickedName("");
    setImageRemoved(true);
    setImageBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const removeVideoPick = () => {
    setVideoFile(null);
    setVideoPickedName("");
    setVideoRemoved(true);
    setVideoBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const resetAfterSave = () => {
    setImageFile(null);
    setVideoFile(null);
    setImagePickedName("");
    setVideoPickedName("");
    setImageRemoved(false);
    setVideoRemoved(false);
    setImageUrlText("");
    setVideoUrlText("");
    setImageBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setVideoBlobUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  };

  const handleSave = async () => {
    setError("");
    setOk(false);
    setSaving(true);
    try {
      const fd = new FormData();
      if (currentUser?.id != null) {
        fd.append("userId", String(currentUser.id));
      }
      if (imageFile) fd.append("image", imageFile);
      if (videoFile) fd.append("video", videoFile);
      const iu = imageUrlText.trim();
      const vu = videoUrlText.trim();
      if (iu) fd.append("imageUrl", iu);
      if (vu) fd.append("videoUrl", vu);
      if (imageRemoved && !imageFile) fd.append("clearImage", "true");
      if (videoRemoved && !videoFile) fd.append("clearVideo", "true");
      const saved = await saveAdDefaultMultipart(fd);
      setCurrent(saved);
      resetAfterSave();
      setOk(true);
      setTimeout(() => setOk(false), 2800);
    } catch (e) {
      console.error(e);
      setError("Save failed. Check network, Supabase buckets, and DB.");
    } finally {
      setSaving(false);
    }
  };

  if (!isOperator) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <PageMeta
        title="Default ad | Circuit Crew"
        description="Default media and today’s advertisement playlist"
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md shadow-orange-500/25">
            <CalendarIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Default ad</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              All fields are optional — update image, video, or links whenever you want.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-6 items-start">
        <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-950">
          <div className="h-1.5 bg-gradient-to-r from-orange-400 via-amber-400 to-orange-500" />
          <div className="space-y-6 p-5 md:p-8">
            {loading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : (
              <>
                {current?.userDisplayName && (
                  <div className="flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3 text-sm text-gray-600 dark:border-gray-800 dark:bg-gray-900/50 dark:text-gray-300">
                    <UserCircleIcon className="h-5 w-5 shrink-0 text-orange-500" />
                    <span className="text-gray-500">Last saved by</span>
                    <span className="font-semibold text-gray-900 dark:text-white">
                      {current.userDisplayName}
                    </span>
                  </div>
                )}

                <div className="grid gap-6 lg:grid-cols-2">
                  <DefaultAdImageField
                    inputId="default-ad-image"
                    previewUrl={imagePreviewDisplay}
                    uploading={saving}
                    pickedFileName={imageStatusLabel}
                    onFile={pickImage}
                    onRemove={removeImagePick}
                  />
                  <DefaultAdVideoField
                    inputId="default-ad-video"
                    previewUrl={videoPreviewDisplay}
                    uploading={saving}
                    pickedFileName={videoStatusLabel}
                    onFile={pickVideo}
                    onRemove={removeVideoPick}
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="default-image-url"
                      className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300"
                    >
                      Or paste <span className="font-mono text-[10px]">image_url</span>{" "}
                      <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="default-image-url"
                      type="text"
                      value={imageUrlText}
                      onChange={(e) => setImageUrlText(e.target.value)}
                      placeholder="https://…"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-inner dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="default-video-url"
                      className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300"
                    >
                      Or paste <span className="font-mono text-[10px]">video_url</span>{" "}
                      <span className="font-normal text-gray-400">(optional)</span>
                    </label>
                    <input
                      id="default-video-url"
                      type="text"
                      value={videoUrlText}
                      onChange={(e) => setVideoUrlText(e.target.value)}
                      placeholder="https://…"
                      className="h-11 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 shadow-inner dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {ok && (
                  <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50/80 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-300">
                    <CheckIcon className="h-5 w-5 shrink-0" />
                    Saved successfully.
                  </div>
                )}
                {error && (
                  <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-sm text-red-800 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
                    <ExclamationTriangleIcon className="h-5 w-5 shrink-0" />
                    {error}
                  </div>
                )}

                <div className="flex justify-center pt-1 sm:justify-start">
                  <Button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full max-w-xs sm:max-w-none sm:w-auto"
                  >
                    {saving ? "Saving…" : "Save default ad"}
                  </Button>
                </div>
              </>
            )}
          </div>
        </div>

        <aside className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-gray-950 xl:sticky xl:top-4">
          <div className="h-1.5 bg-gradient-to-r from-violet-400 via-fuchsia-400 to-orange-400" />
          <div className="border-b border-gray-100 bg-gradient-to-br from-gray-50 to-white px-5 py-4 dark:border-gray-800 dark:from-gray-900/80 dark:to-gray-950">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md">
                <MegaphoneIcon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <h2 className="text-base font-bold text-gray-900 dark:text-white">
                  Today&apos;s playlist
                </h2>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="sr-only" htmlFor="playlist-screen">
                    Screen
                  </label>
                  <select
                    id="playlist-screen"
                    value={selectedScreenId}
                    onChange={(e) => setSelectedScreenId(e.target.value)}
                    className="max-w-full rounded-lg border border-gray-200 bg-white px-2 py-1 text-[11px] font-medium text-gray-800 shadow-inner dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200"
                  >
                    <option value="">Tous les écrans</option>
                    {screens.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">{today}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-h-[min(78vh,720px)] space-y-3 overflow-y-auto p-4 [scrollbar-width:thin]">
            {timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 py-14 text-center dark:border-gray-700 dark:bg-gray-900/30">
                <MusicalNoteIcon className="mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">No ads today</p>
                <p className="mt-1 max-w-[220px] text-xs text-gray-400 dark:text-gray-500">
                  Scheduled spots for this date will appear here with name and status.
                </p>
              </div>
            ) : (
              timeline.map((entry, idx) => {
                const st = slotStatus(entry, now);
                const mediaHint =
                  shortMediaName(entry.adVideoUrl) || shortMediaName(entry.adThumbnailUrl);
                return (
                  <article
                    key={entry.key}
                    className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-white via-white to-gray-50/80 shadow-sm transition hover:border-orange-200/80 hover:shadow-md dark:border-gray-800 dark:from-gray-900 dark:via-gray-900 dark:to-gray-950/80 dark:hover:border-orange-500/25"
                  >
                    <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-orange-400 to-amber-500 opacity-90" />
                    <div className="flex items-start gap-3 p-4 pl-5">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 text-xs font-bold text-white shadow-sm">
                        {idx + 1}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusBadgeClass(st)}`}
                          >
                            {statusLabel(st)}
                          </span>
                          <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            playlist {entry.day}
                          </span>
                        </div>
                        <h3 className="mt-1.5 line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">
                          {entry.title}
                        </h3>
                        {mediaHint && mediaHint !== entry.title ? (
                          <p
                            className="mt-1 text-[10px] text-gray-500 dark:text-gray-400"
                            title={entry.adVideoUrl || entry.adThumbnailUrl || undefined}
                          >
                            {mediaHint}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </aside>
      </div>
    </>
  );
};

export default OperatorDefaultAdPage;

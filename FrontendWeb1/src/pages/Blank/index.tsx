import { useEffect, useRef, useState } from "react";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Button from "../../components/ui/button/Button";
import {
  type Pack as ApiPack,
  createPack as apiCreatePack,
  fetchPacks,
  updatePack as apiUpdatePack,
  deletePack as apiDeletePack,
  assignUserToPack,
  uploadPackImage,
} from "../../services/packs";
import {
  type Advertiser,
  fetchAdvertisers,
} from "../../services/advertisers";

type Pack = {
  id: number;
  packageName: string;
  duration: number;
  totalVideoPlays: number;
  description: string;
  imageUrl?: string | null;
  color: string;
  assignedUsers?: Advertiser[];
};
type NewPackForm = {
  packageName: string;
  duration: string;
  totalVideoPlays: string;
  description: string;
  imageUrl: string;
};

type PackFieldErrors = Partial<
  Record<"packageName" | "duration" | "totalVideoPlays", string>
>;

function validatePackForm(form: NewPackForm): PackFieldErrors {
  const e: PackFieldErrors = {};
  if (!form.packageName?.trim()) {
    e.packageName = "Package name is required.";
  }
  if (!form.duration?.trim()) {
    e.duration = "Duration is required.";
  } else {
    const d = parseInt(form.duration, 10);
    if (Number.isNaN(d) || d < 1) {
      e.duration = "Enter a valid number of days (at least 1).";
    }
  }
  if (!form.totalVideoPlays?.trim()) {
    e.totalVideoPlays = "Total video plays is required.";
  } else {
    const t = parseInt(form.totalVideoPlays, 10);
    if (Number.isNaN(t) || t < 0) {
      e.totalVideoPlays = "Enter a valid number (0 or more).";
    }
  }
  return e;
}

type CoverImageFieldProps = {
  inputId: string;
  imageUrl: string;
  uploading: boolean;
  pickedFileName: string;
  onFile: (file: File) => void;
  onRemove: () => void;
};

function CoverImageField({
  inputId,
  imageUrl,
  uploading,
  pickedFileName,
  onFile,
  onRemove,
}: CoverImageFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const statusText = uploading
    ? "Uploading…"
    : imageUrl
      ? pickedFileName || "Image uploaded"
      : pickedFileName || "No file selected";

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/90 p-4 dark:border-gray-700 dark:bg-gray-900/60">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <div className="relative mx-auto aspect-[4/3] w-full max-w-[200px] shrink-0 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-inner dark:border-gray-600 dark:bg-gray-800 sm:mx-0">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full min-h-[120px] flex-col items-center justify-center gap-1 px-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
              <span className="text-lg opacity-70">🖼️</span>
              <span>Preview</span>
            </div>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-3">
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
            className="w-full rounded-xl bg-slate-800 px-4 py-2.5 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-900 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto sm:min-w-[160px] dark:bg-slate-600 dark:hover:bg-slate-500"
          >
            Choose image file
          </button>
          <div className="w-full rounded-lg border border-gray-200/80 bg-white/80 px-3 py-2 dark:border-gray-600 dark:bg-gray-800/80">
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
          {imageUrl ? (
            <button
              type="button"
              className="text-[11px] font-semibold text-red-500 hover:underline"
              onClick={onRemove}
            >
              Remove image
            </button>
          ) : null}
          <p className="text-[10px] leading-relaxed text-gray-400 dark:text-gray-500">
            JPEG, PNG or WebP — max 5 MB. Stored under{" "}
            <code className="rounded bg-gray-200/80 px-1 dark:bg-gray-800">
              pictures/adbot/
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}

const CARD_COLORS = [
  "#6EE7B7",
  "#93C5FD",
  "#FCA5A5",
  "#C4B5FD",
  "#FDE68A",
  "#A5F3FC",
];

const PlayIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z" />
  </svg>
);

const ClockIcon = () => (
  <svg
    width="16"
    height="16"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
);

const UserPlusIcon = () => (
  <svg
    width="18"
    height="18"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <line x1="19" y1="8" x2="19" y2="14" />
    <line x1="22" y1="11" x2="16" y2="11" />
  </svg>
);

const XIcon = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PlusIcon = () => (
  <svg
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

const EditIcon = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
  </svg>
);

const TrashIcon = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

export default function Blank() {
  return (
    <div>
      <PageMeta
        title="Packs | Makerskills Dashboard"
        description="Manage and configure packs for Makerskills."
      />
      <PageBreadcrumb pageTitle="📦 Packs" />
      <PacksManagement />
    </div>
  );
}

function PacksManagement() {
  const [packs, setPacks] = useState<Pack[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loadingAdvertisers, setLoadingAdvertisers] = useState(false);
  const [searchUser, setSearchUser] = useState("");
  const [newPack, setNewPack] = useState<NewPackForm>({
    packageName: "",
    duration: "",
    totalVideoPlays: "",
    description: "",
    imageUrl: "",
  });
  const [uploadingNewImage, setUploadingNewImage] = useState(false);
  const [uploadingEditImage, setUploadingEditImage] = useState(false);
  const [newPackErrors, setNewPackErrors] = useState<PackFieldErrors>({});
  const [editPackErrors, setEditPackErrors] = useState<PackFieldErrors>({});
  const [newPickedFileName, setNewPickedFileName] = useState("");
  const [editPickedFileName, setEditPickedFileName] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  const [editPack, setEditPack] = useState<Pack | null>(null);
  const [editForm, setEditForm] = useState<NewPackForm | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Pack | null>(null);

  useEffect(() => {
    const loadPacks = async () => {
      try {
        setLoading(true);
        setError(null);
        const apiPacks = await fetchPacks();
        setPacks(
          apiPacks.map((p: ApiPack, index) => ({
            ...p,
            color: CARD_COLORS[index % CARD_COLORS.length],
            assignedUsers: (p as any).advertisers || [],
          })),
        );
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Failed to load packs";
        setError(msg);
        console.error("Failed to load packs", error);
      } finally {
        setLoading(false);
      }
    };

    void loadPacks();
  }, []);

  const handleCreatePack = async () => {
    const v = validatePackForm(newPack);
    setNewPackErrors(v);
    if (Object.keys(v).length > 0) {
      return;
    }

    const durationNumber = parseInt(newPack.duration, 10);
    const totalPlaysNumber = parseInt(newPack.totalVideoPlays, 10);

    try {
      setCreating(true);
      const created = await apiCreatePack({
        packageName: newPack.packageName,
        duration: durationNumber,
        totalVideoPlays: totalPlaysNumber,
        description: newPack.description,
        imageUrl: newPack.imageUrl.trim() || null,
      });
      setPacks((prev) => [
        ...prev,
        {
          ...created,
          color: CARD_COLORS[prev.length % CARD_COLORS.length],
        },
      ]);
      setNewPack({
        packageName: "",
        duration: "",
        totalVideoPlays: "",
        description: "",
        imageUrl: "",
      });
      setNewPackErrors({});
      setNewPickedFileName("");
      setShowAddModal(false);
      setSuccessMsg("New pack created successfully!");
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to create pack", error);
    } finally {
      setCreating(false);
    }
  };

  const handleOpenAssignModal = async (pack: Pack) => {
    setSelectedPack(pack);
    setSearchUser("");
    try {
      setLoadingAdvertisers(true);
      const result = await fetchAdvertisers();
      setAdvertisers(result);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to load advertisers", error);
    } finally {
      setLoadingAdvertisers(false);
    }
  };

  const handleAssignUser = async (user: Advertiser) => {
    if (!selectedPack) return;

    const current = selectedPack.assignedUsers || [];
    const exists = current.some((u) => u.id === user.id);
    if (exists) {
      return;
    }

    try {
      const updated = await assignUserToPack(selectedPack.id, user.id);
      const updatedAssigned =
        (updated as any).advertisers && Array.isArray((updated as any).advertisers)
          ? ((updated as any).advertisers as Advertiser[])
          : [...current, user];
      const updatedPack: Pack = {
        ...selectedPack,
        ...updated,
        assignedUsers: updatedAssigned,
      };

      setPacks((prev) =>
        prev.map((p) =>
          p.id === selectedPack.id ? updatedPack : p,
        ),
      );
      setSelectedPack(updatedPack);
      setSuccessMsg(
        `${user.firstName} ${user.lastName} assigned to pack "${selectedPack.packageName}" successfully.`,
      );
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Failed to assign advertiser to pack", error);
    }
  };

  const visibleAdvertisers = advertisers.filter((u) => {
    const q = searchUser.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(q) ||
      u.lastName.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.companyName || "").toLowerCase().includes(q)
    );
  });

  return (
    <div className="min-h-screen rounded-2xl border border-gray-200 bg-white px-5 py-7 dark:border-gray-800 dark:bg-white/[0.03] xl:px-10 xl:py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
            Packs Management
          </h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Manage packs, cover images (stored in Supabase{" "}
            <code className="rounded bg-gray-100 px-1 text-[10px] dark:bg-gray-800">
              pictures/adbot/
            </code>
            ), duration, and plays.
          </p>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setNewPackErrors({});
            setNewPickedFileName("");
            setShowAddModal(true);
          }}
          startIcon={<PlusIcon />}
          className="shadow-theme-xs"
        >
          New pack
        </Button>
      </div>

      {/* Toast */}
      {successMsg && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-success-500/40 bg-success-50 px-4 py-2 text-xs text-success-700 shadow-theme-xs dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-200">
          <span>✓</span>
          <span>{successMsg}</span>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="mb-6 flex items-center gap-2 rounded-xl border border-red-500/40 bg-red-50 px-4 py-3 text-xs text-red-700 shadow-theme-xs dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-200">
          <span>✕</span>
          <span>{error}</span>
          <button
            onClick={() => {
              setError(null);
              window.location.reload();
            }}
            className="ml-auto underline hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mb-6 text-xs text-gray-500 dark:text-gray-400">
          Loading packs...
        </div>
      )}

      {/* Grid packs */}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {packs.map((pack) => (
          <div
            key={pack.id}
            className="group flex flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs transition hover:-translate-y-1 hover:shadow-theme-lg dark:border-gray-800 dark:bg-gray-900/80"
          >
            <div className="relative aspect-[16/10] w-full shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
              {pack.imageUrl ? (
                <img
                  src={pack.imageUrl}
                  alt=""
                  className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  loading="lazy"
                />
              ) : (
                <div className="flex h-full min-h-[140px] flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500">
                  <span className="text-2xl opacity-60">📦</span>
                  <span className="text-[11px] font-medium">No cover image</span>
                </div>
              )}
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/55 to-transparent"
                aria-hidden
              />
              <div
                className="absolute left-3 top-3 h-1 w-10 rounded-full opacity-90"
                style={{
                  background: `linear-gradient(90deg, ${pack.color}, ${pack.color}88)`,
                }}
              />
            </div>

            <div className="flex flex-col p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                    {pack.packageName}
                  </h4>
                  {pack.assignedUsers && pack.assignedUsers.length > 0 && (
                    <p
                      className="mt-1 text-[11px] font-medium"
                      style={{ color: pack.color }}
                    >
                      👤 {pack.assignedUsers.length}{" "}
                      {pack.assignedUsers.length === 1
                        ? "advertiser"
                        : "advertisers"}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditPackErrors({});
                    setEditPickedFileName("");
                    setEditPack(pack);
                    setEditForm({
                      packageName: pack.packageName,
                      duration: String(pack.duration),
                      totalVideoPlays: String(pack.totalVideoPlays),
                      description: pack.description,
                      imageUrl: pack.imageUrl ?? "",
                    });
                  }}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                >
                  <EditIcon />
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(pack)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
                >
                  <TrashIcon />
                </button>
                  <div
                    className="flex h-9 w-9 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${pack.color}22`,
                      color: pack.color,
                    }}
                  >
                    <PlayIcon />
                  </div>
                </div>
              </div>

              <p className="mb-4 line-clamp-3 text-xs text-gray-500 dark:text-gray-400">
                {pack.description || "No description yet."}
              </p>

              <div className="mb-4 flex flex-wrap gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium"
                  style={{
                    backgroundColor: `${pack.color}20`,
                    color: pack.color,
                  }}
                >
                  <ClockIcon />
                  {pack.duration} days
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1 text-[11px] font-medium text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <PlayIcon />
                  {pack.totalVideoPlays.toLocaleString()} plays
                </span>
              </div>

              <div className="mt-auto flex flex-col gap-2 border-t border-dashed border-gray-200 pt-3 text-[11px] dark:border-gray-800">
                <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                  Assigned advertisers
                </span>
                <div className="max-h-28 overflow-y-auto pr-1">
                  {pack.assignedUsers && pack.assignedUsers.length > 0 ? (
                    <ul className="flex flex-col gap-1.5">
                      {pack.assignedUsers.map((user) => (
                        <li
                          key={user.id}
                          className="flex items-center gap-2 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[11px] text-gray-700 dark:bg-gray-800 dark:text-gray-200"
                        >
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[10px] font-semibold text-brand-500">
                            {user.firstName.charAt(0)}
                            {user.lastName.charAt(0)}
                          </div>
                          <span className="min-w-0 truncate">
                            <span className="font-medium">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="block truncate text-[10px] text-gray-500 dark:text-gray-400">
                              {user.email}
                            </span>
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 dark:text-gray-500">
                      No advertiser assigned
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleOpenAssignModal(pack)}
                  className="inline-flex w-full items-center justify-center gap-1 rounded-full px-2.5 py-2 text-[11px] font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-brand-500/10 sm:w-auto sm:justify-start"
                >
                  <UserPlusIcon />
                  Assign user
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Assign user modal */}
      {selectedPack && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="flex max-h-[min(90vh,640px)] w-full max-w-lg flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-3 flex shrink-0 items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Assign advertisers
                </h4>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Pack:{" "}
                  <span style={{ color: selectedPack.color }}>
                    {selectedPack.packageName}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPack(null);
                  setSearchUser("");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <XIcon />
              </button>
            </div>

            <input
              className="mb-3 h-10 w-full shrink-0 rounded-lg border border-gray-200 bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
              placeholder="Search advertiser..."
              value={searchUser}
              onChange={(e) => setSearchUser(e.target.value)}
            />

            {loadingAdvertisers ? (
              <div className="shrink-0 py-6 text-center text-xs text-gray-500 dark:text-gray-400">
                Loading advertisers...
              </div>
            ) : (
              <div className="min-h-[120px] flex-1 space-y-1 overflow-y-auto pr-1">
                {visibleAdvertisers.map((user) => {
                  const already =
                    selectedPack?.assignedUsers?.some((a) => a.id === user.id) ??
                    false;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => {
                        if (!already) void handleAssignUser(user);
                      }}
                      disabled={already}
                      className={`flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left text-xs transition ${
                        already
                          ? "cursor-default opacity-60 dark:bg-gray-800/40"
                          : "hover:bg-gray-50 dark:hover:bg-gray-800"
                      }`}
                    >
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-[11px] font-semibold text-brand-500">
                        {user.firstName.charAt(0)}
                        {user.lastName.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-800 dark:text-white/90">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="mt-0.5 truncate text-[11px] text-gray-500 dark:text-gray-400">
                          {user.email}
                        </p>
                        {user.companyName && (
                          <p className="mt-0.5 truncate text-[11px] text-gray-400 dark:text-gray-500">
                            {user.companyName}
                          </p>
                        )}
                      </div>
                      {already ? (
                        <span className="shrink-0 rounded-full bg-success-50 px-2 py-0.5 text-[10px] font-medium text-success-600 dark:bg-success-500/10 dark:text-success-300">
                          Assigned
                        </span>
                      ) : (
                        <span className="shrink-0 text-[10px] font-medium text-brand-500">
                          + Add
                        </span>
                      )}
                    </button>
                  );
                })}

                {visibleAdvertisers.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500">
                    No advertisers found
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add pack modal */}
      {showAddModal && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                New Pack
              </h4>
              <button
                type="button"
                onClick={() => {
                  setShowAddModal(false);
                  setNewPackErrors({});
                  setNewPickedFileName("");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <XIcon />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Package name
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 ${
                    newPackErrors.packageName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
                      : "border-gray-200 focus:border-brand-300 focus:ring-brand-300 dark:border-gray-700"
                  }`}
                  placeholder="e.g. Gold Pack"
                  value={newPack.packageName}
                  onChange={(e) => {
                    setNewPack({ ...newPack, packageName: e.target.value });
                    setNewPackErrors((er) => ({
                      ...er,
                      packageName: undefined,
                    }));
                  }}
                />
                {newPackErrors.packageName ? (
                  <p className="mt-1 text-[11px] text-red-500">
                    {newPackErrors.packageName}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Duration (days)
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 ${
                    newPackErrors.duration
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
                      : "border-gray-200 focus:border-brand-300 focus:ring-brand-300 dark:border-gray-700"
                  }`}
                  placeholder="e.g. 60"
                  value={newPack.duration}
                  onChange={(e) => {
                    setNewPack({ ...newPack, duration: e.target.value });
                    setNewPackErrors((er) => ({ ...er, duration: undefined }));
                  }}
                />
                {newPackErrors.duration ? (
                  <p className="mt-1 text-[11px] text-red-500">
                    {newPackErrors.duration}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Total video plays
                </label>
                <input
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 ${
                    newPackErrors.totalVideoPlays
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
                      : "border-gray-200 focus:border-brand-300 focus:ring-brand-300 dark:border-gray-700"
                  }`}
                  placeholder="e.g. 300"
                  value={newPack.totalVideoPlays}
                  onChange={(e) => {
                    setNewPack({
                      ...newPack,
                      totalVideoPlays: e.target.value,
                    });
                    setNewPackErrors((er) => ({
                      ...er,
                      totalVideoPlays: undefined,
                    }));
                  }}
                />
                {newPackErrors.totalVideoPlays ? (
                  <p className="mt-1 text-[11px] text-red-500">
                    {newPackErrors.totalVideoPlays}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  className="min-h-[70px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
                  placeholder="Short description of the pack..."
                  value={newPack.description}
                  onChange={(e) =>
                    setNewPack({ ...newPack, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Cover image
                </label>
                <CoverImageField
                  inputId="new-pack-cover-file"
                  imageUrl={newPack.imageUrl}
                  uploading={uploadingNewImage}
                  pickedFileName={newPickedFileName}
                  onFile={async (f) => {
                    setNewPickedFileName(f.name);
                    setUploadingNewImage(true);
                    try {
                      const url = await uploadPackImage(f);
                      setNewPack((p) => ({ ...p, imageUrl: url }));
                    } catch (err) {
                      console.error(err);
                      setNewPickedFileName("");
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Image upload failed",
                      );
                    } finally {
                      setUploadingNewImage(false);
                    }
                  }}
                  onRemove={() => {
                    setNewPack((p) => ({ ...p, imageUrl: "" }));
                    setNewPickedFileName("");
                  }}
                />
              </div>
            </div>

            <Button
              size="sm"
              onClick={handleCreatePack}
              startIcon={<PlusIcon />}
              className="mt-4 w-full justify-center"
              disabled={creating || uploadingNewImage}
            >
              {creating ? "Creating..." : "Create pack"}
            </Button>
          </div>
        </div>
      )}

      {/* Edit pack modal */}
      {editPack && editForm && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
                  Edit pack
                </h4>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditPack(null);
                  setEditForm(null);
                  setEditPackErrors({});
                  setEditPickedFileName("");
                }}
                className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              >
                <XIcon />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Package name
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 ${
                    editPackErrors.packageName
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
                      : "border-gray-200 focus:border-brand-300 focus:ring-brand-300 dark:border-gray-700"
                  }`}
                  value={editForm.packageName}
                  onChange={(e) => {
                    setEditForm({ ...editForm, packageName: e.target.value });
                    setEditPackErrors((er) => ({
                      ...er,
                      packageName: undefined,
                    }));
                  }}
                />
                {editPackErrors.packageName ? (
                  <p className="mt-1 text-[11px] text-red-500">
                    {editPackErrors.packageName}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Duration (days)
                </label>
                <input
                  className={`h-10 w-full rounded-lg border bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 ${
                    editPackErrors.duration
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
                      : "border-gray-200 focus:border-brand-300 focus:ring-brand-300 dark:border-gray-700"
                  }`}
                  value={editForm.duration}
                  onChange={(e) => {
                    setEditForm({ ...editForm, duration: e.target.value });
                    setEditPackErrors((er) => ({ ...er, duration: undefined }));
                  }}
                />
                {editPackErrors.duration ? (
                  <p className="mt-1 text-[11px] text-red-500">
                    {editPackErrors.duration}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Total video plays
                </label>
                <input
                  type="number"
                  min={0}
                  className={`h-10 w-full rounded-lg border bg-gray-50 px-3 text-xs text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-1 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500 ${
                    editPackErrors.totalVideoPlays
                      ? "border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500"
                      : "border-gray-200 focus:border-brand-300 focus:ring-brand-300 dark:border-gray-700"
                  }`}
                  value={editForm.totalVideoPlays}
                  onChange={(e) => {
                    setEditForm({
                      ...editForm,
                      totalVideoPlays: e.target.value,
                    });
                    setEditPackErrors((er) => ({
                      ...er,
                      totalVideoPlays: undefined,
                    }));
                  }}
                />
                {editPackErrors.totalVideoPlays ? (
                  <p className="mt-1 text-[11px] text-red-500">
                    {editPackErrors.totalVideoPlays}
                  </p>
                ) : null}
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Description
                </label>
                <textarea
                  className="min-h-[70px] w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700 placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring-1 focus:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:placeholder:text-gray-500"
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm({ ...editForm, description: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-medium text-gray-500 dark:text-gray-400">
                  Cover image
                </label>
                <CoverImageField
                  inputId="edit-pack-cover-file"
                  imageUrl={editForm.imageUrl}
                  uploading={uploadingEditImage}
                  pickedFileName={editPickedFileName}
                  onFile={async (f) => {
                    setEditPickedFileName(f.name);
                    setUploadingEditImage(true);
                    try {
                      const url = await uploadPackImage(f);
                      setEditForm((prev) =>
                        prev ? { ...prev, imageUrl: url } : prev,
                      );
                    } catch (err) {
                      console.error(err);
                      setEditPickedFileName("");
                      setError(
                        err instanceof Error
                          ? err.message
                          : "Image upload failed",
                      );
                    } finally {
                      setUploadingEditImage(false);
                    }
                  }}
                  onRemove={() => {
                    setEditForm((prev) =>
                      prev ? { ...prev, imageUrl: "" } : prev,
                    );
                    setEditPickedFileName("");
                  }}
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setEditPack(null);
                  setEditForm(null);
                  setEditPackErrors({});
                  setEditPickedFileName("");
                }}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                disabled={uploadingEditImage}
                onClick={async () => {
                  if (!editForm || !editPack) return;
                  const v = validatePackForm(editForm);
                  setEditPackErrors(v);
                  if (Object.keys(v).length > 0) {
                    return;
                  }
                  const durationNumber = parseInt(editForm.duration, 10);
                  const totalPlaysNumber = parseInt(
                    editForm.totalVideoPlays,
                    10,
                  );
                  try {
                    const updated = await apiUpdatePack(editPack.id, {
                      packageName: editForm.packageName,
                      duration: durationNumber,
                      totalVideoPlays: totalPlaysNumber,
                      description: editForm.description,
                      imageUrl: editForm.imageUrl.trim() || null,
                    });
                    setPacks((prev) =>
                      prev.map((p) =>
                        p.id === editPack.id
                          ? {
                              ...p,
                              ...updated,
                            }
                          : p,
                      ),
                    );
                    setEditPack(null);
                    setEditForm(null);
                    setEditPackErrors({});
                    setEditPickedFileName("");
                    setSuccessMsg("Pack updated successfully.");
                    setTimeout(() => setSuccessMsg(""), 3000);
                  } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("Failed to update pack", error);
                  }
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete pack confirm modal — full viewport overlay (same as Add Advertiser) */}
      {deleteTarget && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
              <TrashIcon />
            </div>
            <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Delete this pack?
            </h4>
            <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-red-500">
                &quot;{deleteTarget.packageName}&quot;
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={async () => {
                  if (!deleteTarget) return;
                  try {
                    await apiDeletePack(deleteTarget.id);
                    setPacks((prev) =>
                      prev.filter((p) => p.id !== deleteTarget.id),
                    );
                    setDeleteTarget(null);
                    setSuccessMsg("Pack deleted successfully.");
                    setTimeout(() => setSuccessMsg(""), 3000);
                  } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error("Failed to delete pack", error);
                  }
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

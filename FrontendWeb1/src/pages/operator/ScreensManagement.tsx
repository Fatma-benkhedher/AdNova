import axios from "axios";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Prompt from "../../components/common/Prompt";
import Button from "../../components/ui/button/Button";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import ScreenLocationMap from "../../components/operator/ScreenLocationMap";
import { PlusIcon } from "../../icons";
import {
  createScreen,
  deleteScreen,
  fetchScreens,
  updateScreen,
} from "../../services/screensService";

type ScreenRow = {
  id: string;
  name: string;
  robot: string;
  locationAddress: string;
  latitude: number | null;
  longitude: number | null;
  userId: number | null;
  addedBy: string | null;
};

const ROBOTS = ["Robot-A1", "Robot-B2", "Robot-C3", "Robot-D4", "Robot-E5"] as const;

function operatorUserIdFromStorage(): number | undefined {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return undefined;
    const u = JSON.parse(raw) as { id?: number };
    return typeof u?.id === "number" ? u.id : undefined;
  } catch {
    return undefined;
  }
}

function ScreenIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="2" y="3" width="20" height="15" rx="2" />
      <path d="M8 21h8M12 18v3" />
    </svg>
  );
}

/** Same as Packs (Blank) card actions */
const EditIcon = () => (
  <svg
    width="14"
    height="14"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
    aria-hidden
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
    aria-hidden
  >
    <polyline points="3,6 5,6 21,6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" />
    <path d="M14 11v6" />
    <path d="M9 6V4h6v2" />
  </svg>
);

function RobotGlyph({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden
    >
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="9" cy="16" r="1" />
      <circle cx="15" cy="16" r="1" />
      <path d="M9 11V8a3 3 0 016 0v3" />
      <path d="M12 3v2" />
    </svg>
  );
}

export default function ScreensManagement() {
  const [screens, setScreens] = useState<ScreenRow[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ScreenRow | null>(null);
  const [newName, setNewName] = useState("");
  const [newRobot, setNewRobot] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [newLat, setNewLat] = useState<number | null>(null);
  const [newLng, setNewLng] = useState<number | null>(null);
  const [nameError, setNameError] = useState(false);
  const [robotError, setRobotError] = useState(false);
  const [addressError, setAddressError] = useState(false);
  const [locating, setLocating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScreenRow | null>(null);
  const [toast, setToast] = useState("");
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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setListLoading(true);
        const data = await fetchScreens();
        if (cancelled) return;
        setScreens(
          data.map((s) => ({
            id: s.id,
            name: s.name,
            robot: s.robot,
            locationAddress: s.address,
            latitude: s.latitude ?? null,
            longitude: s.longitude ?? null,
            userId: s.userId ?? null,
            addedBy: s.userDisplayName ?? null,
          })),
        );
      } catch {
        if (!cancelled) {
          setToast("Failed to load screens.");
          setTimeout(() => setToast(""), 3200);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectedScreen = useMemo(
    () => screens.find((s) => s.id === selectedId) ?? null,
    [screens, selectedId],
  );

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditTarget(null);
    setNewName("");
    setNewRobot("");
    setNewAddress("");
    setNewLat(null);
    setNewLng(null);
    setNameError(false);
    setRobotError(false);
    setAddressError(false);
    setLocating(false);
  }, []);

  const openModal = useCallback(() => {
    setModalOpen(true);
    setEditTarget(null);
    setNewName("");
    setNewRobot("");
    setNewAddress("");
    setNewLat(null);
    setNewLng(null);
    setNameError(false);
    setRobotError(false);
    setAddressError(false);
  }, []);

  const openEditModal = useCallback((row: ScreenRow) => {
    setModalOpen(true);
    setEditTarget(row);
    setNewName(row.name);
    setNewRobot(row.robot);
    setNewAddress(row.locationAddress || "");
    setNewLat(row.latitude);
    setNewLng(row.longitude);
    setNameError(false);
    setRobotError(false);
    setAddressError(false);
  }, []);

  useEffect(() => {
    if (!modalOpen) return;
    const t = window.setTimeout(() => {
      document.getElementById("screen-add-name")?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [modalOpen]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (deleteTarget) setDeleteTarget(null);
      else if (modalOpen) closeModal();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen, deleteTarget, closeModal]);

  const resolveAddress = useCallback(async (): Promise<{ lat: number; lng: number } | null> => {
    const address = newAddress.trim();
    if (!address) {
      setAddressError(true);
      return null;
    }
    setAddressError(false);
    setLocating(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(address)}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      });
      const data = (await response.json()) as Array<{ lat: string; lon: string }>;
      if (!Array.isArray(data) || data.length === 0) {
        setAddressError(true);
        setToast("Address not found on map.");
        setTimeout(() => setToast(""), 2800);
        return null;
      }
      const lat = Number(data[0].lat);
      const lng = Number(data[0].lon);
      setNewLat(lat);
      setNewLng(lng);
      return { lat, lng };
    } catch {
      setToast("Failed to locate address.");
      setTimeout(() => setToast(""), 2800);
      return null;
    } finally {
      setLocating(false);
    }
  }, [newAddress]);

  const saveScreen = useCallback(async () => {
    const name = newName.trim();
    const robot = newRobot.trim();
    const locationAddress = newAddress.trim();
    let ok = true;
    if (!name) {
      setNameError(true);
      ok = false;
    } else {
      setNameError(false);
    }
    if (!robot) {
      setRobotError(true);
      ok = false;
    } else {
      setRobotError(false);
    }
    if (!locationAddress) {
      setAddressError(true);
      ok = false;
    } else {
      setAddressError(false);
    }
    if (!ok) return;

    const lat = newLat;
    const lng = newLng;
    const uid = operatorUserIdFromStorage();

    try {
      if (editTarget) {
        const updated = await updateScreen(editTarget.id, {
          name,
          robot,
          address: locationAddress,
          latitude: lat,
          longitude: lng,
          userId: uid,
        });
        setScreens((prev) =>
          prev.map((s) =>
            s.id === editTarget.id
              ? {
                  id: updated.id,
                  name: updated.name,
                  robot: updated.robot,
                  locationAddress: updated.address,
                  latitude: updated.latitude ?? null,
                  longitude: updated.longitude ?? null,
                  userId: updated.userId ?? null,
                  addedBy: updated.userDisplayName ?? null,
                }
              : s,
          ),
        );
        setSelectedId(updated.id);
        closeModal();
        setToast(`Screen "${name}" updated.`);
        setTimeout(() => setToast(""), 2800);
        return;
      }

      const created = await createScreen({
        name,
        robot,
        address: locationAddress,
        latitude: lat,
        longitude: lng,
        userId: uid,
      });
      const row: ScreenRow = {
        id: created.id,
        name: created.name,
        robot: created.robot,
        locationAddress: created.address,
        latitude: created.latitude ?? null,
        longitude: created.longitude ?? null,
        userId: created.userId ?? null,
        addedBy: created.userDisplayName ?? null,
      };
      setScreens((prev) => [...prev, row]);
      setSelectedId(created.id);
      closeModal();
      setToast(`Screen "${name}" added successfully.`);
      setTimeout(() => setToast(""), 3200);
    } catch (e) {
      let msg = "Could not save screen. Check that the backend is running.";
      if (
        axios.isAxiosError(e) &&
        e.response?.data &&
        typeof e.response.data === "object" &&
        "detail" in e.response.data
      ) {
        const d = (e.response.data as { detail?: string }).detail;
        if (d) msg = d.length > 220 ? `${d.slice(0, 220)}…` : d;
      }
      setToast(msg);
      setTimeout(() => setToast(""), 5000);
    }
  }, [newName, newRobot, newAddress, newLat, newLng, closeModal, editTarget]);

  const removeScreen = useCallback(async (row: ScreenRow) => {
    try {
      await deleteScreen(row.id);
      setScreens((prev) => prev.filter((s) => s.id !== row.id));
      setSelectedId((cur) => (cur === row.id ? null : cur));
      setDeleteTarget(null);
      setToast(`"${row.name}" removed.`);
      setTimeout(() => setToast(""), 2800);
    } catch {
      setToast("Could not delete screen.");
      setTimeout(() => setToast(""), 3200);
    }
  }, []);

  if (!isOperator) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <PageMeta
        title="Screens | Circuit Crew"
        description="Manage displays and link each screen to a robot."
      />
      <PageBreadcrumb pageTitle="🖥️ Screens" />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-gray-800 dark:text-white/90 sm:text-2xl">
            Screens Management
          </h3>
          <p className="mt-1 max-w-xl text-xs text-gray-500 dark:text-gray-400 sm:text-sm">
            Link each screen to a robot. Click a row to highlight it.
          </p>
        </div>
        <Button
          size="sm"
          onClick={openModal}
          startIcon={<PlusIcon className="h-4 w-4 text-white" />}
          endIcon={<ScreenIcon className="h-4 w-4 text-white" />}
          className="shrink-0 shadow-theme-xs"
        >
          Add Screen
        </Button>
      </div>

      {selectedScreen && (
        <div className="mb-5 flex flex-wrap items-center gap-4 rounded-3xl border border-orange-200/80 bg-gradient-to-r from-orange-50 via-amber-50/90 to-orange-50/40 px-5 py-4 shadow-theme-sm dark:border-orange-500/25 dark:from-orange-950/50 dark:via-amber-950/30 dark:to-orange-950/20">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/35 ring-4 ring-white/60 dark:ring-orange-400/20">
            <ScreenIcon className="h-8 w-8 text-white" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-orange-600/90 dark:text-orange-300/90">
              Selected screen
            </p>
            <p className="mt-0.5 text-lg font-semibold text-gray-900 dark:text-white">
              {selectedScreen.name}
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Robot:{" "}
              <span className="font-medium text-orange-700 dark:text-orange-300">
                {selectedScreen.robot}
              </span>
              <span className="text-gray-400 dark:text-gray-500"> · Status: —</span>
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Location: {selectedScreen.locationAddress || "—"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSelectedId(null)}
            className="shrink-0 rounded-xl border border-orange-200/80 bg-white/80 px-3 py-2 text-xs font-medium text-orange-800 transition hover:bg-white dark:border-orange-500/30 dark:bg-gray-900/60 dark:text-orange-200 dark:hover:bg-gray-900"
          >
            Clear selection
          </button>
        </div>
      )}

      <div className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-theme-sm dark:border-gray-800 dark:bg-dark-card">
        <div className="h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500" />
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-orange-100 bg-orange-50/80 dark:border-orange-500/15 dark:bg-orange-500/10">
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                  Name
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                  Robot
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                  Added by
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                  Status
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                  Location
                </th>
                <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-orange-800 dark:text-orange-200">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {listLoading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    Loading screens…
                  </td>
                </tr>
              ) : screens.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-10 text-center text-sm text-gray-500 dark:text-gray-400"
                  >
                    No screens yet. Click &quot;Add Screen&quot; to create one.
                  </td>
                </tr>
              ) : null}
              {!listLoading &&
                screens.map((row) => {
                const selected = row.id === selectedId;
                return (
                  <tr
                    key={row.id}
                    role="button"
                    tabIndex={0}
                    onClick={() =>
                      setSelectedId((id) => (id === row.id ? null : row.id))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedId((id) => (id === row.id ? null : row.id));
                      }
                    }}
                    className={`cursor-pointer border-b border-gray-100 transition dark:border-gray-800 ${
                      selected
                        ? "bg-gradient-to-r from-orange-50/95 to-amber-50/50 ring-2 ring-inset ring-orange-400/50 dark:from-orange-950/40 dark:to-amber-950/20 dark:ring-orange-500/40"
                        : "hover:bg-gray-50/80 dark:hover:bg-white/[0.04]"
                    }`}
                  >
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium transition ${
                          selected
                            ? "bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md shadow-orange-500/25"
                            : "bg-sky-50 text-sky-900 dark:bg-sky-500/15 dark:text-sky-200"
                        }`}
                      >
                        <ScreenIcon
                          className={
                            selected
                              ? "h-4 w-4 shrink-0 text-white"
                              : "h-4 w-4 shrink-0 text-sky-600 dark:text-sky-300"
                          }
                        />
                        {row.name}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="inline-flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-1.5 text-sm font-medium text-amber-900 dark:bg-amber-500/15 dark:text-amber-200">
                        <RobotGlyph className="text-amber-700 dark:text-amber-400" />
                        {row.robot}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {row.addedBy || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-gray-400 dark:text-gray-500">—</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-xs text-gray-600 dark:text-gray-300">
                        {row.locationAddress || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div
                        className="flex items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-100 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-gray-800"
                          aria-label="Edit screen"
                        >
                          <EditIcon />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
                          aria-label="Delete screen"
                        >
                          <TrashIcon />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 z-999999 flex items-center justify-center bg-slate-900/45 px-4 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="screen-modal-title"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="w-full max-w-2xl rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-lg dark:border-gray-700 dark:bg-gray-900">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-md">
                  <ScreenIcon className="h-6 w-6 text-white" />
                </div>
                <h2
                  id="screen-modal-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                >
                  {editTarget ? "Edit screen" : "Add screen"}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-200"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <p className="mb-5 text-sm text-gray-500 dark:text-gray-400">
              Enter a detailed address (e.g. Ksar Hellal, Monastir) — it is always saved. Use
              &quot;Locate on map&quot; only if you want coordinates and an interactive map; you can
              pan, zoom, and drag the marker to adjust.
            </p>

            <div className="space-y-4">
              <div>
                <Label>Screen name</Label>
                <Input
                  id="screen-add-name"
                  type="text"
                  placeholder="e.g. screen4"
                  value={newName}
                  error={nameError}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    setNameError(false);
                  }}
                />
                <p className="mt-1 text-xs text-gray-400">
                  Shown in the table
                </p>
              </div>
              <div>
                <Label>Linked robot</Label>
                <select
                  value={newRobot}
                  onChange={(e) => {
                    setNewRobot(e.target.value);
                    setRobotError(false);
                  }}
                  className={`h-11 w-full rounded-xl border bg-white px-3 text-sm text-gray-800 shadow-theme-xs focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 ${
                    robotError ? "border-error-500 ring-1 ring-error-500" : "border-gray-300"
                  }`}
                >
                  <option value="">— Select a robot —</option>
                  {ROBOTS.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Location address</Label>
                <Input
                  type="text"
                  placeholder="e.g. Ksar Hellal, Monastir"
                  value={newAddress}
                  error={addressError}
                  onChange={(e) => {
                    setNewAddress(e.target.value);
                    setAddressError(false);
                    setNewLat(null);
                    setNewLng(null);
                  }}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => void resolveAddress()}
                    disabled={locating}
                  >
                    {locating ? "Locating..." : "Locate on map"}
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700">
                {newLat != null && newLng != null ? (
                  <ScreenLocationMap
                    lat={newLat}
                    lng={newLng}
                    onMarkerDragEnd={(la, ln) => {
                      setNewLat(la);
                      setNewLng(ln);
                    }}
                  />
                ) : (
                  <div className="flex h-64 items-center justify-center bg-gray-50 px-4 text-center text-xs text-gray-500 dark:bg-gray-900/40 dark:text-gray-400">
                    Optional: click &quot;Locate on map&quot; to set coordinates. You can save with
                    address only — coordinates stay empty in the database until you locate or drag a
                    marker.
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2 border-t border-gray-100 pt-5 dark:border-gray-800">
              <Button variant="outline" size="sm" onClick={closeModal}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void saveScreen()}
                startIcon={<PlusIcon className="h-4 w-4 text-white" />}
              >
                {editTarget ? "Save" : "Add"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="fixed inset-0 z-999999 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.target === e.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
              <TrashIcon />
            </div>
            <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Delete this screen?
            </h4>
            <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">
              You are about to permanently remove{" "}
              <span className="font-semibold text-red-500">
                &quot;{deleteTarget.name}&quot;
              </span>
              . This cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setDeleteTarget(null)}>
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void removeScreen(deleteTarget)}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      <Prompt
        visible={!!toast}
        message={toast}
        variant="success"
        onClose={() => setToast("")}
      />
    </>
  );
}

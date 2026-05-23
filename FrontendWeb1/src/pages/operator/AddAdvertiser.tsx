import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Navigate } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import Prompt from "../../components/common/Prompt";
import Button from "../../components/ui/button/Button";
import { EyeCloseIcon, EyeIcon, PlusIcon } from "../../icons";
import resetIcon from "../../icons/reset.png";
import Label from "../../components/form/Label";
import Input from "../../components/form/input/InputField";
import {
  deleteAdvertiser as deleteAdvertiserApi,
  fetchAdvertisers,
  type Advertiser,
} from "../../services/advertisers";
import { api } from "../../services/api";
import { fetchPacks, type Pack } from "../../services/packs";

type MessageType = "success" | "error" | "info" | null;

/** Same trash affordance as pack cards (Blank / Packs). */
const PackStyleTrashIcon = () => (
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

export default function AddAdvertiser() {
  const [advertisers, setAdvertisers] = useState<Advertiser[]>([]);
  const [loadingAdvertisers, setLoadingAdvertisers] = useState(false);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [picture, setPicture] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<MessageType>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Advertiser | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [packId, setPackId] = useState<number | "">("");
  const confettiRef = useRef<HTMLDivElement | null>(null);
  const role = "advertiser";

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
    const loadAdvertisers = async () => {
      setLoadingAdvertisers(true);
      try {
        const data = await fetchAdvertisers();
        setAdvertisers(data);
      } catch (error) {
        console.error("Failed to load advertisers", error);
      } finally {
        setLoadingAdvertisers(false);
      }
    };

    void loadAdvertisers();
    void fetchPacks().then(setPacks).catch(() => setPacks([]));
  }, []);

  const resetForm = () => {
    setFirstName("");
    setLastName("");
    setEmail("");
    setCompanyName("");
    setPassword("");
    setPicture(null);
    setPackId("");
  };

  const spawnConfetti = (count = 16) => {
    const container = confettiRef.current || document.body;
    for (let i = 0; i < count; i++) {
      const img = document.createElement("img");
      img.src = "/images/logo/maker.logo.png";
      img.className = "confetti-piece";
      const size = Math.floor(Math.random() * 24) + 16;
      img.style.width = `${size}px`;
      img.style.left = `${Math.random() * 100}vw`;
      img.style.top = "-10vh";
      img.style.pointerEvents = "none";
      img.style.position = "fixed";
      img.style.zIndex = "60";
      img.style.opacity = "0.95";
      const duration = (Math.random() * 1.8 + 1.6).toFixed(2);
      img.style.animation = `confettiFall ${duration}s linear forwards`;
      img.style.transform = `rotate(${Math.floor(Math.random() * 360)}deg)`;
      img.addEventListener("animationend", () => img.remove());
      container.appendChild(img);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage("");
    setMessageType(null);

    try {
      const response = await api.post("/auth/register", {
        firstName,
        lastName,
        email,
        companyName,
        password,
        role,
        packId: packId === "" ? null : packId,
      });

      const createdAdvertiser = response.data?.advertiser ?? {
        id: Date.now(),
        firstName,
        lastName,
        email,
        companyName,
        role,
        imageUrl: picture ? URL.createObjectURL(picture) : undefined,
      };

      setAdvertisers((prev) => [createdAdvertiser as Advertiser, ...prev]);
      setMessage(response.data?.message || "Advertiser account created successfully.");
      setMessageType("success");
      spawnConfetti(20);
      resetForm();
    } catch (error: any) {
      if (error?.response?.data) {
        setMessage(
          typeof error.response.data === "string"
            ? error.response.data
            : "Advertiser creation failed.",
        );
      } else {
        setMessage("Something went wrong. Please try again.");
      }
      setMessageType("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const confirmDeleteAdvertiser = async () => {
    if (!deleteTarget) return;
    const advertiser = deleteTarget;
    setDeletingId(advertiser.id);
    setMessage("");
    setMessageType(null);
    try {
      await deleteAdvertiserApi(advertiser.id);
      setAdvertisers((prev) => prev.filter((a) => a.id !== advertiser.id));
      setDeleteTarget(null);
      setMessage("Advertiser removed.");
      setMessageType("success");
    } catch (error: unknown) {
      const err = error as { response?: { data?: unknown; status?: number } };
      const data = err.response?.data;
      const text =
        typeof data === "string"
          ? data
          : err.response?.status === 404
            ? "Advertiser not found."
            : "Delete failed. Please try again.";
      setMessage(text);
      setMessageType("error");
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOperator) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <>
      <PageMeta title="Add Advertiser | Circuit Crew" description="Create and manage advertiser accounts." />
      <style>{`
        @keyframes confettiFall {
          0% { transform: translateY(-10vh) rotate(0deg); opacity: 1; }
          100% { transform: translateY(110vh) rotate(720deg); opacity: 0.85; }
        }
        .confetti-piece { will-change: transform, opacity; }
      `}</style>
      <div ref={confettiRef} className="pointer-events-none" />

      <PageBreadcrumb
        pageTitle="👥 Add Advertiser"
        headingClassName="text-2xl font-semibold text-gray-800 dark:text-white/90 md:text-3xl"
      />
      <p className="-mt-2 mb-6 max-w-2xl text-sm text-gray-500 dark:text-gray-400">
        Create an advertiser and view the list of existing accounts.
      </p>

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-dark-card">
            <div className="mb-6 flex items-center justify-between gap-4 rounded-3xl bg-orange-50 px-5 py-4 text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em]">
                  New advertiser
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  Add form
                </h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <Label>
                    First Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. John"
                    required
                  />
                </div>
                <div>
                  <Label>
                    Last Name <span className="text-error-500">*</span>
                  </Label>
                  <Input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="e.g. Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <Label>
                  Email Address <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john.doe@agency.com"
                  required
                />
              </div>

              <div>
                <Label>
                  Company Name <span className="text-error-500">*</span>
                </Label>
                <Input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Agency Inc."
                  required
                />
              </div>

              <div>
                <Label>
                  Role <span className="text-error-500">*</span>
                </Label>
                <Input type="text" value="Advertiser" disabled />
              </div>

              <div>
                <Label>Pack</Label>
                <select
                  value={packId}
                  onChange={(e) => setPackId(e.target.value ? Number(e.target.value) : "")}
                  className="h-11 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-theme-xs focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                >
                  <option value="">No pack</option>
                  {packs.map((pack) => (
                    <option key={pack.id} value={pack.id}>
                      {pack.packageName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <Label>
                  Picture <span className="text-gray-400">(optional)</span>
                </Label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setPicture(e.target.files?.[0] ?? null)}
                  className="h-11 w-full rounded-2xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-600 shadow-theme-xs focus:border-orange-500 focus:outline-none dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                />
              </div>

              <div>
                <Label>
                  Password <span className="text-error-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    ) : (
                      <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 border-t border-gray-100 pt-4 dark:border-white/10">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  All required fields are mandatory.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-gray-200 bg-white text-gray-600 shadow-theme-xs transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:border-orange-500/40 dark:hover:bg-orange-500/10 dark:hover:text-orange-200"
                    aria-label="Reset form"
                  >
                    <img
                      src={resetIcon}
                      alt=""
                      className="h-6 w-6 object-contain opacity-90 dark:opacity-85"
                    />
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-orange-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    <PlusIcon className="h-5 w-5" />
                    {isSubmitting ? "Adding..." : "Create"}
                  </button>
                </div>
              </div>
            </form>
          </div>

          <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-dark-card">
            <div className="mb-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-orange-500">
                  Advertiser list
                </p>
                <h2 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white">
                  My advertisers
                </h2>
                <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                  Quick view of associated advertiser accounts.
                </p>
              </div>
              <span className="inline-flex rounded-2xl bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 dark:bg-orange-500/10 dark:text-orange-200">
                {advertisers.length} advertisers
              </span>
            </div>

            {loadingAdvertisers ? (
              <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                Loading advertisers...
              </div>
            ) : advertisers.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                No advertisers found.
              </div>
            ) : (
              <div className="space-y-4">
                {advertisers
                  .sort((a, b) => (a.firstName || '').localeCompare(b.firstName || ''))
                  .map((advertiser) => (
                  <div key={advertiser.id} className="rounded-3xl border border-gray-200 bg-orange-50/40 p-4 transition hover:border-orange-300 hover:bg-orange-50 dark:border-gray-700 dark:bg-gray-900/60">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-200">
                          {advertiser.firstName?.[0] ?? "A"}
                          {advertiser.lastName?.[0] ?? "D"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {advertiser.firstName} {advertiser.lastName}
                          </p>
                          <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                            {advertiser.email}
                          </p>
                          {advertiser.companyName && (
                            <p className="truncate text-sm text-gray-600 dark:text-gray-300">
                              {advertiser.companyName}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
                          {advertiser.role}
                        </span>
                        <button
                          type="button"
                          disabled={deletingId === advertiser.id}
                          onClick={() => setDeleteTarget(advertiser)}
                          className="flex h-8 w-8 items-center justify-center rounded-lg border border-red-200 text-red-500 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-red-800/60 dark:text-red-400 dark:hover:bg-red-950/40"
                          aria-label="Delete advertiser"
                        >
                          <PackStyleTrashIcon />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-999999 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-lg dark:border-gray-800 dark:bg-gray-900">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
              <PackStyleTrashIcon />
            </div>
            <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-white/90">
              Delete this advertiser?
            </h4>
            <p className="mb-5 text-xs text-gray-500 dark:text-gray-400">
              You are about to permanently delete{" "}
              <span className="font-semibold text-red-500">
                &quot;
                {`${deleteTarget.firstName ?? ""} ${deleteTarget.lastName ?? ""}`.trim() ||
                  deleteTarget.email}
                &quot;
              </span>
              . This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setDeleteTarget(null)}
                disabled={deletingId === deleteTarget.id}
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={() => void confirmDeleteAdvertiser()}
                disabled={deletingId === deleteTarget.id}
              >
                {deletingId === deleteTarget.id ? "Deleting…" : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Prompt
        visible={!!message}
        message={message}
        variant={messageType || (message ? "info" : "info")}
        onClose={() => {
          setMessage("");
          setMessageType(null);
        }}
      />
    </>
  );
}

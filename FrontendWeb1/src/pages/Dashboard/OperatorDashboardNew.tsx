import { useMemo } from "react";
import { Link } from "react-router";
import PageBreadcrumb from "../../components/common/PageBreadCrumb";
import PageMeta from "../../components/common/PageMeta";
import {
  ArrowRightIcon,
  ChartBarIcon,
  ChatBubbleLeftRightIcon,
  ComputerDesktopIcon,
  CubeIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";

type SessionUser = {
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
};

function readUser(): SessionUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

const quickLinks = [
  {
    to: "/operator/add-advertiser",
    label: "Add advertiser",
    desc: "Create and manage advertiser accounts",
    icon: UserPlusIcon,
  },
  {
    to: "/packs",
    label: "Packs",
    desc: "Configure packs and assignments",
    icon: CubeIcon,
  },
  {
    to: "/operator/screens",
    label: "Screens",
    desc: "Link displays to robots",
    icon: ComputerDesktopIcon,
  },
  {
    to: "/messages",
    label: "Messages",
    desc: "Support and contact requests",
    icon: ChatBubbleLeftRightIcon,
  },
] as const;

export default function OperatorDashboardNew() {
  const user = useMemo(() => readUser(), []);
  const greeting =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() ||
    user?.email?.split("@")[0] ||
    "Operator";

  return (
    <>
      <PageMeta
        title="Dashboard | Circuit Crew"
        description="Operator overview — connect analytics to Supabase when ready."
      />
      <PageBreadcrumb pageTitle="📊 Dashboard" />

      <div className="mb-8 rounded-3xl border border-orange-100/80 bg-gradient-to-br from-orange-50 via-white to-amber-50/60 p-6 shadow-theme-sm dark:border-orange-500/20 dark:from-orange-950/40 dark:via-gray-900 dark:to-amber-950/20 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600/90 dark:text-orange-300/90">
          Welcome back
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white md:text-3xl">
          {greeting}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 dark:text-gray-400">
          This dashboard is ready to receive live metrics from your database (Supabase). KPIs and
          charts stay empty until your API or Edge Functions feed them.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Total views", hint: "Ad plays & impressions" },
          { label: "Active ads", hint: "Published / scheduled" },
          { label: "Screens", hint: "Registered displays" },
          { label: "Advertisers", hint: "Accounts" },
        ].map((k) => (
          <div
            key={k.label}
            className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white p-5 shadow-theme-xs dark:border-gray-800 dark:bg-dark-card"
          >
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-orange-400 via-amber-500 to-orange-500" />
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
              {k.label}
            </p>
            <p className="mt-2 text-3xl font-bold tabular-nums text-gray-300 dark:text-gray-600">
              —
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{k.hint}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="h-full rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-dark-card">
            <div className="mb-4 flex items-center gap-2">
              <ChartBarIcon className="h-5 w-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Analytics overview
              </h2>
            </div>
            <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 px-6 py-10 text-center dark:border-gray-700 dark:bg-gray-900/40">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No chart data yet
              </p>
              <p className="mt-2 max-w-md text-xs text-gray-500 dark:text-gray-400">
                Wire this panel to Supabase (e.g. aggregated <code className="rounded bg-gray-200/80 px-1 py-0.5 text-[11px] dark:bg-gray-800">ad_statistics</code>{" "}
                or materialized views). The UI is prepared for Recharts or ApexCharts once endpoints
                exist.
              </p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="h-full rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-dark-card">
            <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              Quick actions
            </h2>
            <ul className="space-y-2">
              {quickLinks.map(({ to, label, desc, icon: Icon }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-orange-50/30 px-4 py-3 transition hover:border-orange-200 hover:bg-orange-50/60 dark:border-gray-800 dark:bg-orange-500/5 dark:hover:border-orange-500/30 dark:hover:bg-orange-500/10"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-orange-400 to-amber-500 text-white shadow-sm">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1 text-sm font-semibold text-gray-900 dark:text-white">
                        {label}
                        <ArrowRightIcon className="h-3.5 w-3.5 text-orange-500 opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" />
                      </span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{desc}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-theme-sm dark:border-gray-800 dark:bg-dark-card">
        <h2 className="mb-3 text-lg font-semibold text-gray-900 dark:text-white">
          Recent activity
        </h2>
        <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/50 px-5 py-8 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900/30 dark:text-gray-400">
          No events to show. Activity will populate from your backend or Supabase realtime
          subscriptions.
        </div>
      </div>
    </>
  );
}

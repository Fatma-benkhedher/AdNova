import Badge from "../ui/badge/Badge";
import { TableCell, TableRow } from "../ui/table";
import { ArrowRightIcon, PencilIcon, TrashBinIcon } from "../../icons";
import { useNavigate } from "react-router";

export type AdvertisementStatus = "pending" | "approved" | "rejected";

export type AdvertisementListItem = {
  id: string | number;
  thumbnailUrl: string | null;
  name: string;
  status: AdvertisementStatus;
  submittedAt: string;
  updatedAt: string;
};

type Props = {
  advertisement: AdvertisementListItem;
};

function formatDateTime(value: string) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

function statusBadgeColor(status: AdvertisementStatus) {
  switch (status) {
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "rejected":
      return "error";
  }
}

function statusLabel(status: AdvertisementStatus) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function AdvertisementsTableRow({ advertisement }: Props) {
  const navigate = useNavigate();

  return (
    <TableRow key={advertisement.id}>
      <TableCell className="px-5 py-4 sm:px-6 text-start">
        <div className="flex items-center gap-4">
          <div className="w-32 aspect-video overflow-hidden rounded-lg bg-gray-100 dark:bg-white/[0.06]">
            {advertisement.thumbnailUrl ? (
              <img
                src={advertisement.thumbnailUrl}
                alt={advertisement.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full" />
            )}
          </div>
          <span className="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {advertisement.name}
          </span>
        </div>
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        <Badge size="sm" color={statusBadgeColor(advertisement.status)}>
          {statusLabel(advertisement.status)}
        </Badge>
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {formatDateTime(advertisement.submittedAt)}
      </TableCell>

      <TableCell className="px-4 py-3 text-gray-500 text-start text-theme-sm dark:text-gray-400">
        {formatDateTime(advertisement.updatedAt)}
      </TableCell>

      <TableCell className="px-5 py-3 text-start">
        <div className="flex items-center gap-2">
          {/* MODIFIED BUTTON → goes to Edit Advertisement page */}
          <button
            type="button"
            onClick={() => {
              navigate(`/advertiser/advertisements/${advertisement.id}/edit`);
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            aria-label="Edit Advertisement"
            title="Edit Advertisement"
          >
            <PencilIcon className="size-4" />
          </button>

          <button
            type="button"
            onClick={() => {
              // dummy action (delete)
            }}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white p-2 text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
            aria-label="Delete"
            title="Delete"
          >
            <TrashBinIcon className="size-4" />
          </button>
        </div>
      </TableCell>

      <TableCell className="px-5 py-3 text-start">
        <button
  type="button"
  onClick={() => navigate(`/advertiser/advertisements/${advertisement.id}/analytics`)}
  className="inline-flex items-center gap-2 rounded-lg bg-gray-100 px-5 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-300 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
>
  View Analytics
  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
</button>
      </TableCell>
    </TableRow>
  );
}
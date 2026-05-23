import { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Modal } from "../ui/modal";
import { PlusIcon } from "../../icons";

// Define the TypeScript interface for the table rows
interface Product {
  id: number;
  name: string;
  variants: string;
  category: string;
  duration: string;
  image: string;
  viewers: string;
  likes: string;
  ended: string;
}

// Define the table data using the interface
const tableData: Product[] = [
  {
    id: 1,
    name: "Mall Morning Campaign",
    variants: "8 Advertisements",
    category: "Mixed Brands",
    duration: "25 min",
    viewers: "28",
    likes: "1",
    image: "/images/product/product-01.jpg",
    ended: "2min ago",
  },
  {
    id: 2,
    name: "Food Court Specials",
    variants: "5 Advertisements",
    category: "Food & Beverage",
    duration: "15 min",
    viewers: "18",
    likes: "4",
    image: "/images/product/product-02.jpg",
    ended: "9min ago",
  },
  {
    id: 3,
    name: "Fashion Week Promo",
    variants: "6 Advertisements",
    category: "Fashion",
    duration: "20 min",
    viewers: "58",
    likes: "9",
    image: "/images/product/product-03.jpg",
    ended: "20min ago",
  },
  {
    id: 4,
    name: "Electronics Mega Deals",
    variants: "4 Advertisements",
    category: "Electronics",
    duration: "18 min",
    viewers: "30",
    likes: "10",
    image: "/images/product/product-04.jpg",
    ended: "38min ago",
  },
  {
    id: 5,
    name: "Weekend Family Offers",
    variants: "7 Advertisements",
    category: "Entertainment",
    duration: "30 min",
    viewers: "65",
    likes: "24",
    image: "/images/product/product-05.jpg",
    ended: "46min ago",
  },
];

export default function Recentplaylist() {
  const screenOptions = useMemo(
    () => [
      { id: "screen-01", label: "Screen 01 - Lobby" },
      { id: "screen-02", label: "Screen 02 - Entrance" },
      { id: "screen-03", label: "Screen 03 - Food Court" },
      { id: "screen-04", label: "Screen 04 - Office" },
    ],
    [],
  );

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(tableData[0]?.id ?? 1);
  const [selectedScreen, setSelectedScreen] = useState(screenOptions[0]?.id ?? "screen-01");
  const [assignmentMessage, setAssignmentMessage] = useState("");

  const handleAssignScreen = () => {
    const playlist = tableData.find((item) => item.id === selectedPlaylistId);
    const screen = screenOptions.find((item) => item.id === selectedScreen);
    setAssignmentMessage(
      `La playlist “${playlist?.name}” a été affectée à ${screen?.label}.`,
    );
    setIsAssignModalOpen(false);
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white px-4 pb-3 pt-4 shadow-theme-sm dark:border-gray-800 dark:bg-white/[0.03] sm:px-6">
      <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.22em] text-brand-600 dark:text-brand-300">
            Opérateur · Playlist
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-gray-900 dark:text-white/90">
            Recent playlists
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Affectez rapidement une playlist à un écran avec un seul clic.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAssignModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-full border border-brand-500 bg-brand-50 px-4 py-2 text-sm font-semibold text-brand-700 transition hover:bg-brand-100 dark:border-brand-400 dark:bg-brand-500/10 dark:text-brand-200"
        >
          <PlusIcon className="h-4 w-4" />
          Add screen
        </button>
      </div>

      {assignmentMessage && (
        <div className="mb-4 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-400/30 dark:bg-green-900/10 dark:text-green-200">
          {assignmentMessage}
        </div>
      )}

      <div className="max-w-full overflow-x-auto">
        <Table>
          {/* Table Header */}
          <TableHeader className="border-gray-100 dark:border-gray-800 border-y">
            <TableRow>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Playlist
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Ended
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Category
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Duration
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Viewers
              </TableCell>
              <TableCell
                isHeader
                className="py-3 font-medium text-gray-500 text-start text-theme-xs dark:text-gray-400"
              >
                Likes
              </TableCell>
            </TableRow>
          </TableHeader>

          {/* Table Body */}

          <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
            {tableData.map((product) => (
              <TableRow key={product.id} className="">
                <TableCell className="py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-[50px] w-[50px] overflow-hidden rounded-md">
                      <img
                        src={product.image}
                        className="h-[50px] w-[50px]"
                        alt={product.name}
                      />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {product.name}
                      </p>
                      <span className="text-gray-500 text-theme-xs dark:text-gray-400">
                        {product.variants}
                      </span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {product.ended}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {product.category}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {product.duration}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {product.viewers}
                </TableCell>
                <TableCell className="py-3 text-gray-500 text-theme-sm dark:text-gray-400">
                  {product.likes}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Modal isOpen={isAssignModalOpen} onClose={() => setIsAssignModalOpen(false)} className="max-w-lg p-0">
        <div className="rounded-[32px] bg-white px-6 pb-6 pt-8 shadow-theme-lg dark:bg-gray-950 sm:px-8">
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
                Add screen
              </p>
              <h4 className="mt-3 text-xl font-semibold text-gray-900 dark:text-white">
                Affecter une playlist à un écran
              </h4>
            </div>
          </div>

          <div className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Playlist
              </label>
              <select
                value={selectedPlaylistId}
                onChange={(e) => setSelectedPlaylistId(Number(e.target.value))}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {tableData.map((playlist) => (
                  <option key={playlist.id} value={playlist.id}>
                    {playlist.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200">
                Screen cible
              </label>
              <select
                value={selectedScreen}
                onChange={(e) => setSelectedScreen(e.target.value)}
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100"
              >
                {screenOptions.map((screen) => (
                  <option key={screen.id} value={screen.id}>
                    {screen.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() => setIsAssignModalOpen(false)}
              className="rounded-2xl border border-gray-200 px-4 py-3 text-sm font-semibold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5"
            >
              Annuler
            </button>
            <button
              type="button"
              onClick={handleAssignScreen}
              className="inline-flex items-center justify-center rounded-2xl bg-brand-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-600"
            >
              Confirmer l’affectation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

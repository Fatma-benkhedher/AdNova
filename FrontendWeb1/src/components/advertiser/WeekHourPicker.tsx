import { useEffect, useMemo, useRef, useState } from "react";

export type WeekHourSelection = {
  // ISO date for start of week (Monday) in local time, e.g. 2026-02-16
  weekStartDate: string;
  // 7x24 grid; selected[dayIndex][hour] => boolean
  selected: boolean[][];
};

type Props = {
  weekStartDate: string;
  value: boolean[][];
  onChange: (next: boolean[][]) => void;
};

const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function cloneGrid(grid: boolean[][]) {
  return grid.map((row) => row.slice());
}

function createEmptyGrid() {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false));
}

function addDays(yyyyMmDd: string, dayDelta: number) {
  const [y, m, d] = yyyyMmDd.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setDate(dt.getDate() + dayDelta);
  const yy = dt.getFullYear();
  const mm = String(dt.getMonth() + 1).padStart(2, "0");
  const dd = String(dt.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

export default function WeekHourPicker({ weekStartDate, value, onChange }: Props) {
  const grid = useMemo(() => {
    if (value.length !== 7) return createEmptyGrid();
    if (value.some((r) => r.length !== 24)) return createEmptyGrid();
    return value;
  }, [value]);

  const [isDragging, setIsDragging] = useState(false);
  const dragModeRef = useRef<"select" | "deselect">("select");

  const dayDates = useMemo(
    () => days.map((_, idx) => addDays(weekStartDate, idx)),
    [weekStartDate]
  );

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener("mouseup", handleMouseUp);
    return () => window.removeEventListener("mouseup", handleMouseUp);
  }, []);

  const applyCell = (dayIndex: number, hour: number) => {
    const di = clamp(dayIndex, 0, 6);
    const h = clamp(hour, 0, 23);
    const next = cloneGrid(grid);
    next[di][h] = dragModeRef.current === "select";
    onChange(next);
  };

  const onCellMouseDown = (dayIndex: number, hour: number) => {
    const current = !!grid[dayIndex]?.[hour];
    dragModeRef.current = current ? "deselect" : "select";
    setIsDragging(true);
    applyCell(dayIndex, hour);
  };

  const onCellMouseEnter = (dayIndex: number, hour: number) => {
    if (!isDragging) return;
    applyCell(dayIndex, hour);
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/[0.05] dark:bg-white/[0.03]">
      <div className="flex flex-col gap-1 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-sm font-medium text-gray-800 dark:text-white/90">
            Weekly hour selection
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Click and drag to highlight hours. Click again on a selected hour to remove.
          </div>
        </div>
      </div>

      <div className="max-w-full overflow-x-auto">
        <div className="min-w-[980px]">
          <div className="grid" style={{ gridTemplateColumns: "80px repeat(7, 1fr)" }}>
            <div />
            {days.map((d, idx) => (
              <div
                key={d}
                className="px-2 pb-2 text-xs font-medium text-gray-500 dark:text-gray-400"
              >
                <div>{d}</div>
                <div className="text-[11px] text-gray-400 dark:text-gray-500">
                  {dayDates[idx]}
                </div>
              </div>
            ))}

            {Array.from({ length: 24 }).map((_, hour) => (
              <>
                <div
                  key={`label-${hour}`}
                  className="pr-3 py-1 text-xs text-gray-500 dark:text-gray-400 flex items-center justify-end"
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
                {Array.from({ length: 7 }).map((__, dayIndex) => {
                  const selected = !!grid[dayIndex]?.[hour];
                  return (
                    <div
                      key={`${dayIndex}-${hour}`}
                      onMouseDown={() => onCellMouseDown(dayIndex, hour)}
                      onMouseEnter={() => onCellMouseEnter(dayIndex, hour)}
                      className={`h-7 border border-gray-100 dark:border-white/[0.05] cursor-pointer select-none transition-colors ${
                        selected
                          ? "bg-brand-500/20"
                          : "bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                      }`}
                      title={`${days[dayIndex]} ${String(hour).padStart(2, "0")}:00`}
                    />
                  );
                })}
              </>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

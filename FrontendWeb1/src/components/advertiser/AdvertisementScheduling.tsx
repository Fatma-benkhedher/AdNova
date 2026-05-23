import WeekHourPicker from "./WeekHourPicker";

export type AdvertisementSchedulingValue = {
  startDate: string; // YYYY-MM-DD
  numberOfWeeks: number;
  weekStartDate: string; // YYYY-MM-DD (Monday)
  hoursGrid: boolean[][]; // 7x24
};

type Props = {
  value: AdvertisementSchedulingValue;
  onChange: (next: AdvertisementSchedulingValue) => void;
};

function createEmptyGrid() {
  return Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => false));
}

function toYyyyMmDdLocal(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function getMondayOfWeek(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const day = dt.getDay(); // 0 Sun .. 6 Sat
  const diffToMonday = (day + 6) % 7;
  dt.setDate(dt.getDate() - diffToMonday);
  return toYyyyMmDdLocal(dt);
}

export function createDefaultSchedulingValue(): AdvertisementSchedulingValue {
  const today = new Date();
  const startDate = toYyyyMmDdLocal(today);
  const weekStartDate = getMondayOfWeek(startDate);
  return {
    startDate,
    numberOfWeeks: 1,
    weekStartDate,
    hoursGrid: createEmptyGrid(),
  };
}

export default function AdvertisementScheduling({ value, onChange }: Props) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Starting date
          </label>
          <input
            type="date"
            value={value.startDate}
            onChange={(e) => {
              const startDate = e.target.value;
              onChange({
                ...value,
                startDate,
                weekStartDate: startDate
                  ? getMondayOfWeek(startDate)
                  : value.weekStartDate,
              });
            }}
            className="dark:bg-dark-900 h-11 w-full appearance-none rounded-lg border border-gray-300 bg-transparent bg-none px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
            Number of weeks
          </label>
          <input
            type="number"
            min={1}
            max={52}
            value={value.numberOfWeeks}
            onChange={(e) => {
              const n = Number(e.target.value);
              onChange({
                ...value,
                numberOfWeeks: Number.isFinite(n) ? n : value.numberOfWeeks,
              });
            }}
            className="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-none focus:ring focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>
      </div>

      <WeekHourPicker
        weekStartDate={value.weekStartDate}
        value={value.hoursGrid}
        onChange={(hoursGrid) => onChange({ ...value, hoursGrid })}
      />
    </div>
  );
}

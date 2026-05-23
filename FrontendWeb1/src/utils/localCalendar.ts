/** Local timezone helpers — avoid `toISOString()` for slots (UTC). */

export function pad(n: number): string {
  return n.toString().padStart(2, "0");
}

/** YYYY-MM-DD (local). */
export function localDateISO(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** HH:mm:ss (local). */
export function localTimeISO(d: Date): string {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** `<input type="datetime-local" />` value (local). */
export function toDatetimeLocalValue(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Next 2-minute boundary, local → datetime-local string. */
export function normalizeToTwoMinuteSlot(source: Date | string): string {
  const date =
    typeof source === "string"
      ? new Date(source)
      : new Date(source.getTime());
  const rem = date.getMinutes() % 2;
  if (rem !== 0) date.setMinutes(date.getMinutes() + (2 - rem));
  date.setSeconds(0);
  date.setMilliseconds(0);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** Display API `createdAt` (backend `LocalDateTime` as `"yyyy-MM-ddTHH:mm:ss"`). */
export function formatScheduledAt(iso?: string | null, locale: string = "en-US"): string {
  if (!iso) return "";
  const normalized = iso.includes("T") ? iso : iso.replace(" ", "T");
  const d = new Date(normalized);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(d);
}

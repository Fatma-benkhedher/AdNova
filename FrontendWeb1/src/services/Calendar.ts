// src/services/CalendarService.ts
// src/services/CalendarService.ts
import { api } from "./api";
import { localDateISO } from "../utils/localCalendar";

export type CalendarEntry = {
  id: number;
  adId: number;
  name: string;
  userId?: number;
  screenId?: string; // ✅ ADD THIS
  day: string;  // YYYY-MM-DD
  time: string; // HH:mm
  status: "scheduled" | "airing" | "aired";
  /** When you saved this schedule (API: server local time). */
  createdAt?: string | null;
};

export async function fetchCalendar(): Promise<CalendarEntry[]> {
  const response = await api.get<CalendarEntry[]>("/calendar");
  return response.data;
}

/** Scheduled entries for one day (playlist source). */
export async function fetchCalendarByDay(day: string): Promise<CalendarEntry[]> {
  const response = await api.get<CalendarEntry[]>("/calendar/by-day", { params: { day } });
  return response.data;
}
export type CreateCalendarPayload = {
  name: string;
  adId: number;
  userId?: number;
  screenId?: string; // ✅ ADD THIS
  time: string;
  day: string;
  status?: "scheduled" | "airing" | "aired";
};

export type UpdateCalendarPayload = Partial<CreateCalendarPayload>;



// Fetch a single entry by ID
export async function fetchCalendarById(id: number): Promise<CalendarEntry> {
  const response = await api.get<CalendarEntry>(`/calendar/${id}`);
  return response.data;
}

// Fetch entries for a specific user
export async function fetchUserCalendar(userId: number): Promise<CalendarEntry[]> {
  const response = await api.get<CalendarEntry[]>(`/calendar/user/${userId}`);
  return response.data;
}

// Create a new calendar entry
export async function createCalendar(payload: CreateCalendarPayload): Promise<CalendarEntry> {
  const response = await api.post<CalendarEntry>("/calendar", payload);
  return response.data;
}

// Update an existing calendar entry
export async function updateCalendar(id: number, payload: UpdateCalendarPayload): Promise<CalendarEntry> {
  const response = await api.put<CalendarEntry>(`/calendar/${id}`, payload);
  return response.data;
}

// Delete a calendar entry
export async function deleteCalendar(id: number): Promise<void> {
  await api.delete(`/calendar/${id}`);
}

import { Pack } from "./packs";

/**
 * Check if user can schedule a new ad today based on their pack
 */
export async function canScheduleAdToday(userId: number, userPack: Pack | null): Promise<boolean>  {
  if (!userPack) return false;

  const today = localDateISO(new Date());
  const calendarEntries = await fetchUserCalendar(userId);

  const todaysAds = calendarEntries.filter((entry) => entry.day === today);
  return todaysAds.length < userPack.totalVideoPlays;
}
export async function fetchCalendarByScreen(screenId: string): Promise<CalendarEntry[]> {
  const response = await api.get<CalendarEntry[]>("/calendar/by-screen", {
    params: { screenId }
  });
  return response.data;
}
/**
 * Schedule a new ad, checking daily limit first
 */
export async function scheduleAd(
  userId: number,
  payload: CreateCalendarPayload,
  userPack: Pack | null
) {
  const allowed = await canScheduleAdToday(userId, userPack);
  if (!allowed) {
    throw new Error("Daily ad limit reached. Cannot schedule more ads today.");
  }

  return createCalendar(payload);
}
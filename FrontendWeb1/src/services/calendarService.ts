import axios from 'axios';
import { localDateISO, localTimeISO } from '../utils/localCalendar';

// service wrapper for calendar-related API calls
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  screenId?: string;
  extendedProps?: Record<string, any>;
}

// Legacy helper used by some components in workspace
export interface CalendarEntry {
  id: string | number;
  day: string;
  time: string;
  name?: string;
  videoName?: string;
  screenId?: string;
  status?: "scheduled" | "airing" | "aired";
  [key: string]: any;
}

export interface Screen {
  id: string;
  name?: string;
  address: string;
  [key: string]: any;
}

export interface CreateCalendarPayload {
  name: string;
  adId?: number;
  userId?: number;
  screenId: string; // ✅ REQUIRED
  time: string;
  day: string;
  status?: "scheduled" | "airing" | "aired";
}

export interface UpdateCalendarPayload extends Partial<CreateCalendarPayload> {}

// ✅ NEW: Fetch all screens/addresses
export async function fetchScreens(): Promise<Screen[]> {
  try {
    const response = await axios.get<Screen[]>('/api/screens');
    return response.data || [];
  } catch (error) {
    console.error('Failed to fetch screens:', error);
    return [];
  }
}

// ✅ NEW: Fetch a single screen by ID
export async function fetchScreenById(screenId: string): Promise<Screen | null> {
  try {
    const response = await axios.get<Screen>(`/api/screens/${screenId}`);
    return response.data || null;
  } catch (error) {
    console.error(`Failed to fetch screen ${screenId}:`, error);
    return null;
  }
}

// ✅ UPDATED: Fetch calendar for a specific screen
export async function fetchCalendarByScreen(screenId: string): Promise<CalendarEntry[]> {
  try {
    const response = await axios.get<CalendarEntry[]>('/api/calendar/by-screen', {
      params: { screenId }
    });
    return response.data || [];
  } catch (error) {
    console.error(`Failed to fetch calendar for screen ${screenId}:`, error);
    return [];
  }
}

export async function fetchCalendar(screenId?: string): Promise<CalendarEntry[]> {
  try {
    const events = await getCalendarEvents(undefined, screenId);
    return events.map((e) => {
      const start = e.start ? new Date(e.start) : null;
      return {
        id: e.id as string,
        day: start ? localDateISO(start) : "",
        time: start ? localTimeISO(start) : "",
        screenId: e.screenId, // ✅ Include screenId
        ...e.extendedProps,
      } as CalendarEntry;
    });
  } catch (error) {
    console.error('Failed to fetch calendar:', error);
    return [];
  }
}

export async function getCalendarEvents(
  campaignId?: string,
  screenId?: string
): Promise<CalendarEvent[]> {
  try {
    let url = '/api/calendar';
    const params: any = {};

    if (campaignId && campaignId !== 'all') {
      params.campaign = campaignId;
    }

    // ✅ ADD SCREEN FILTER
    if (screenId) {
      params.screenId = screenId;
    }

    const res = await axios.get<CalendarEvent[]>(url, { params });
    return res.data || [];
  } catch (error) {
    console.error('Failed to fetch calendar events', error);
    return [];
  }
}

// Fetch a single entry by ID
export async function fetchCalendarById(id: number | string): Promise<CalendarEntry | null> {
  try {
    const response = await axios.get<CalendarEntry>(`/api/calendar/${id}`);
    return response.data || null;
  } catch (error) {
    console.error(`Failed to fetch calendar entry ${id}:`, error);
    return null;
  }
}

// Fetch entries for a specific user
export async function fetchUserCalendar(userId: number): Promise<CalendarEntry[]> {
  try {
    const response = await axios.get<CalendarEntry[]>(`/api/calendar/user/${userId}`);
    return response.data || [];
  } catch (error) {
    console.error(`Failed to fetch calendar for user ${userId}:`, error);
    return [];
  }
}

// Create a new calendar entry
export async function createCalendar(payload: CreateCalendarPayload): Promise<CalendarEntry> {
  try {
    const response = await axios.post<CalendarEntry>("/api/calendar", payload);
    return response.data;
  } catch (error) {
    console.error('Failed to create calendar entry:', error);
    throw error;
  }
}

// Update an existing calendar entry
export async function updateCalendar(
  id: number | string,
  payload: UpdateCalendarPayload
): Promise<CalendarEntry> {
  try {
    const response = await axios.put<CalendarEntry>(`/api/calendar/${id}`, payload);
    return response.data;
  } catch (error) {
    console.error(`Failed to update calendar entry ${id}:`, error);
    throw error;
  }
}

// Delete a calendar entry
export async function deleteCalendar(id: number | string): Promise<void> {
  try {
    await axios.delete(`/api/calendar/${id}`);
  } catch (error) {
    console.error(`Failed to delete calendar entry ${id}:`, error);
    throw error;
  }
}

// ✅ NEW: Check if user can schedule a new ad today based on their pack
export interface Pack {
  totalVideoPlays: number;
  [key: string]: any;
}

export async function canScheduleAdToday(userId: number, userPack: Pack): Promise<boolean> {
  if (!userPack) return false;

  try {
    const today = localDateISO(new Date());
    const calendarEntries = await fetchUserCalendar(userId);
    const todaysAds = calendarEntries.filter((entry) => entry.day === today);
    return todaysAds.length < userPack.totalVideoPlays;
  } catch (error) {
    console.error('Failed to check daily ad limit:', error);
    return false;
  }
}

/**
 * Schedule a new ad, checking daily limit first
 */
export async function scheduleAd(
  userId: number,
  payload: CreateCalendarPayload,
  userPack: Pack | null
) {
  if (!userPack) {
    throw new Error("You need to purchase a pack before scheduling ads.");
  }

  const allowed = await canScheduleAdToday(userId, userPack);
  if (!allowed) {
    throw new Error("Daily ad limit reached. Cannot schedule more ads today.");
  }

  return createCalendar(payload);
} 

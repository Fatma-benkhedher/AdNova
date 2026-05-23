import { api } from "./api";

export type PlaylistItem = {
  calendarId: number | null;
  day: string;
  time: string;
  calendarStatus: string;
  actionType: "run" | "stop";
  defaultInserted: boolean;
  adId: number | null;
  adName: string | null;
  adVideoUrl: string | null;
  adThumbnailUrl: string | null;
};

export type PlaylistRow = {
  id: number;
  name: string;
  status: string;
  startDate: string;
  endDate: string;
  screenId: string;
  screenName: string;
  screenAddress: string;
  calendarEntries: PlaylistItem[];
};

export async function fetchTodayPlaylists(day?: string, screenId?: string): Promise<PlaylistRow[]> {
  const params: Record<string, string> = {};
  if (day) params.day = day;
  if (screenId) params.screenId = screenId;
  const response = await api.get<PlaylistRow[]>("/playlist-finale/today", {
    params: Object.keys(params).length ? params : undefined,
  });
  return response.data;
}

export async function setPlaylistItemAction(
  playlistId: number,
  calendarId: number,
  actionType: "run" | "stop",
): Promise<void> {
  await api.patch(`/playlist-finale/${playlistId}/calendar/${calendarId}/action`, null, {
    params: { actionType },
  });
}

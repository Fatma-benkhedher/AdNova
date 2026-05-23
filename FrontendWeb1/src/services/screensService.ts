import { api } from "./api";

export type ScreenDto = {
  id: string;
  name: string;
  robot: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  userId: number | null;
  userDisplayName: string | null;
};

export type ScreenInput = {
  name: string;
  robot: string;
  address: string;
  latitude?: number | null;
  longitude?: number | null;
  /** Operator / user linked to this screen */
  userId?: number | null;
};

export async function fetchScreens(): Promise<ScreenDto[]> {
  const res = await api.get<ScreenDto[]>("/screens");
  return res.data;
}

export async function createScreen(body: ScreenInput): Promise<ScreenDto> {
  const res = await api.post<ScreenDto>("/screens", body);
  return res.data;
}

export async function updateScreen(
  id: string,
  body: ScreenInput,
): Promise<ScreenDto> {
  const res = await api.put<ScreenDto>(`/screens/${id}`, body);
  return res.data;
}

export async function deleteScreen(id: string): Promise<void> {
  await api.delete(`/screens/${id}`);
}

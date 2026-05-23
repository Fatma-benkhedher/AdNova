import { api } from "./api";
import type { Advertiser } from "./advertisers";

export type Pack = {
  id: number;
  packageName: string;
  duration: number;
  totalVideoPlays: number;
  description: string;
  imageUrl?: string | null;
  advertisers?: Advertiser[];
};

export type CreatePackPayload = {
  packageName: string;
  duration: number;
  totalVideoPlays: number;
  description: string;
  imageUrl?: string | null;
};

export type UpdatePackPayload = CreatePackPayload;

export async function fetchPacks(): Promise<Pack[]> {
  const response = await api.get<Pack[]>("/packs");
  return response.data;
}

export async function createPack(payload: CreatePackPayload): Promise<Pack> {
  const response = await api.post<Pack>("/packs", payload);
  return response.data;
}

export async function updatePack(id: number, payload: UpdatePackPayload): Promise<Pack> {
  const response = await api.put<Pack>(`/packs/${id}`, payload);
  return response.data;
}

export async function deletePack(id: number): Promise<void> {
  await api.delete(`/packs/${id}`);
}

export async function assignUserToPack(
  packId: number,
  userId: number,
): Promise<Pack> {
  const response = await api.post<Pack>(`/packs/${packId}/assign/${userId}`);
  return response.data;
}

export async function fetchPackByUser(userId: number): Promise<Pack | null> {
  const response = await api.get<Pack | null>(`/packs/user/${userId}`);
  return response.data;
}

/**
 * Upload pack cover to Supabase via backend (bucket `pictures`, path `adbot/...`).
 */
export async function uploadPackImage(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const base = api.defaults.baseURL ?? "";
  const token =
    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
  const res = await fetch(`${base}/packs/upload-image`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { error?: string };
      if (j.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { imageUrl: string };
  return data.imageUrl;
}

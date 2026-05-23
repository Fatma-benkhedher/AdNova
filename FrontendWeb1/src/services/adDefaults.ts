import { api } from "./api";

export type AdDefaultRow = {
  id: number;
  imageUrl: string | null;
  videoUrl: string | null;
  userId: number | null;
  userDisplayName: string | null;
};

export async function fetchCurrentAdDefault(): Promise<AdDefaultRow | null> {
  const res = await api.get<AdDefaultRow>("/ad-defaults/current", {
    validateStatus: (s) => s === 200 || s === 204,
  });
  if (res.status === 204) return null;
  return res.data;
}

export async function saveAdDefaultMultipart(formData: FormData): Promise<AdDefaultRow> {
  const res = await api.post<AdDefaultRow>("/ad-defaults", formData);
  return res.data;
}

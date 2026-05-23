import { api } from "./api";

export type Advertiser = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  companyName?: string;
  imageUrl?: string;
};

export async function fetchAdvertisers(): Promise<Advertiser[]> {
  const response = await api.get<Advertiser[]>("/auth/advertisers");
  return response.data;
}

export async function deleteAdvertiser(id: number): Promise<void> {
  await api.delete(`/auth/advertisers/${id}`);
}


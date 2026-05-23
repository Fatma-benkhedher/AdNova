// src/services/AdvertisementsList.ts
import { api } from "./api";

export type Advertisement = {
  startDate: any;
  endDate: any;
  description: any;
  videoName: any;
  title: string;
  id: number;
  name: string;
  thumbnailUrl: string | null;
  videoUrl?: string | null;
  startDateTime?: string;
  durationMinutes?: number;
  status: "pending" | "Approved" | "rejected";
  submittedAt: string;
  updatedAt: string;
  userId?: number;
  likeCount?: number;
  dislikeCount?: number;
  loveCount?: number;
};

export type UpdateAdvertisementPayload = {
  name?: string;
  thumbnailUrl?: string;
  status?: "pending" | "approved" | "rejected";
  startDateTime?: string;
  durationMinutes?: number;
};

// Fetch all advertisements
export async function fetchAdvertisements(): Promise<Advertisement[]> {
  const response = await api.get<Advertisement[]>("/advertisements");
  return response.data;
}

// Fetch advertisements for a specific user
export async function fetchUserAdvertisements(userId: number): Promise<Advertisement[]> {
  const response = await api.get<Advertisement[]>(`/advertisements/user/${userId}`);
  return response.data;
}

// Fetch single advertisement by ID
export async function fetchAdvertisementById(id: number): Promise<Advertisement> {
  const response = await api.get<Advertisement>(`/advertisements/${id}`);
  return response.data;
}


// Create a new advertisement
export async function createAdvertisement(
  userId: number,
  name: string,
  video: File,
  thumbnail?: File | null          // ← Change to File | null
): Promise<Advertisement> {
  
  const formData = new FormData();
  formData.append("name", name);
  formData.append("video", video);
  
  // Only append thumbnail if it actually exists
  if (thumbnail) {
    formData.append("thumbnail", thumbnail);   // ← Must be the File object, not .name
  }

  const response = await api.post<Advertisement>(
    `/advertisements/user/${userId}`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
  return response.data;
}
// Update an existing advertisement
export async function updateAdvertisement(
  id: number,
  payload: UpdateAdvertisementPayload
): Promise<Advertisement> {
  const response = await api.put<Advertisement>(`/advertisements/${id}`, payload);
  return response.data;
}

// Delete an advertisement
export async function deleteAdvertisement(id: number): Promise<void> {
  await api.delete(`/advertisements/${id}`);
}

// Assign a user to an advertisement
export async function assignUserToAdvertisement(
  adId: number,
  userId: number
): Promise<Advertisement> {
  const response = await api.post<Advertisement>(
    `/advertisements/${adId}/assign/${userId}`
  );
  return response.data;
}
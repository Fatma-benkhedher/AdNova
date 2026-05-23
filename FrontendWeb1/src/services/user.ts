import { api } from "./api";

type StoredUser = {
  id: number;
  [key: string]: any;
};

export type ProfileUpdatePayload = {
  // Champs de base
  firstName?: string;
  lastName?: string;
  email?: string;

  // Champs secondaires
  phone?: string;
  countryCode?: string;
  postalCode?: string;
  city?: string;
   companyName?: string;
  imageUrl?: string;
};

function getStoredUser(): StoredUser {
  if (typeof window === "undefined") {
    throw new Error("Cette fonction doit être appelée dans le navigateur");
  }

  const stored = localStorage.getItem("user");
  if (!stored) {
    throw new Error("Utilisateur non connecté");
  }

  const currentUser: StoredUser = JSON.parse(stored);
  if (!currentUser.id) {
    throw new Error("Identifiant utilisateur manquant");
  }

  return currentUser;
}

function broadcastUserUpdate(user: StoredUser) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("user-updated", {
        detail: user,
      }),
    );
  }
}

export async function updateProfile(payload: ProfileUpdatePayload) {
  const currentUser = getStoredUser();

  const response = await api.put(`/auth/profile/${currentUser.id}`, payload);

  const updatedUser = response.data as StoredUser;
  localStorage.setItem("user", JSON.stringify(updatedUser));
  broadcastUserUpdate(updatedUser);

  return updatedUser;
}

export async function fetchCurrentUserProfile() {
  const currentUser = getStoredUser();
  const response = await api.get(`/auth/profile/${currentUser.id}`);
  const freshUser = response.data as StoredUser;
  localStorage.setItem("user", JSON.stringify(freshUser));
  broadcastUserUpdate(freshUser);
  return freshUser;
}

export async function uploadProfileImage(file: File) {
  const currentUser = getStoredUser();

  const formData = new FormData();
  formData.append("file", file);

  const response = await api.post(
    `/auth/profile/${currentUser.id}/image`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  const updatedUser = response.data as StoredUser;
  localStorage.setItem("user", JSON.stringify(updatedUser));
  broadcastUserUpdate(updatedUser);

  return updatedUser;
}

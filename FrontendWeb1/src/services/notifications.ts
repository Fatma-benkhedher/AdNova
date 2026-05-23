import { api } from "./api";

export type Notification = {
  id: number;
  message: { id: number; subject?: string; requestType?: string; content?: string; createdAt?: string; user?: { id: number; firstName: string; lastName: string; email: string } };
  fromUser: { id: number; firstName: string; lastName: string; email: string };
  type: string;
  createdAt: string;
  readAt: string | null;
};

export async function fetchNotifications(userId?: number, role?: string | null): Promise<Notification[]> {
  const params = userId != null ? { userId, role: role ?? undefined } : {};
  const response = await api.get<Notification[]>("/notifications", { params });
  return response.data ?? [];
}

export async function markNotificationRead(id: number): Promise<Notification> {
  const response = await api.patch<Notification>(`/notifications/${id}/read`);
  return response.data;
}

import { api } from "./api";

export type CreateMessagePayload = {
  requestType: string;
  subject: string;
  message: string;
  userId: number;
};

export type Message = {
  id: number;
  requestType: string;
  subject: string;
  content: string;
  createdAt?: string;
  user?: { id: number; firstName: string; lastName: string; email: string };
};

export type MessageReply = {
  id: number;
  content: string;
  createdAt: string;
  responder?: { id: number; firstName: string; lastName: string; email: string; role?: string | null };
};

export async function createMessage(payload: CreateMessagePayload) {
  const response = await api.post("/messages", payload);
  return response.data;
}

export async function fetchMessages(userId?: number): Promise<Message[]> {
  const params = userId != null ? { userId } : {};
  const response = await api.get<Message[]>("/messages", { params });
  const data = response.data;
  if (Array.isArray(data)) return data;
  if (data && typeof data === "object" && Array.isArray((data as { content?: unknown }).content)) return (data as { content: Message[] }).content;
  return [];
}

export async function fetchMessage(id: number): Promise<Message | null> {
  try {
    const response = await api.get<Message>(`/messages/${id}`);
    return response.data;
  } catch {
    return null;
  }
}

export async function fetchReplies(messageId: number): Promise<MessageReply[]> {
  const response = await api.get<MessageReply[]>(`/messages/${messageId}/replies`);
  return response.data;
}

export async function postReply(messageId: number, content: string, responderId: number): Promise<MessageReply> {
  const response = await api.post(`/messages/${messageId}/replies`, { content, responderId });
  return response.data;
}


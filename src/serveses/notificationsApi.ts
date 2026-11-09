import apiClient from "./apiClient";

export interface AppNotification {
  id: string;
  actorName: string;
  actorPhoto?: string;
  actionText: string;
  createdAtText: string;
  postPreview?: string;
  isRead: boolean;
}

interface RawNotification {
  _id?: string;
  id?: string;
  content?: string;
  createdAt?: string;
  isRead?: boolean;
  user?: {
    name?: string;
    photo?: string;
  };
  fromUser?: {
    name?: string;
    photo?: string;
  };
  actor?: {
    name?: string;
    photo?: string;
  };
  post?: {
    body?: string;
  };
}

function toRelativeTime(value?: string): string {
  if (!value) return "";
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const min = Math.max(1, Math.floor(diffMs / 60000));
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

function normalizeNotification(item: RawNotification): AppNotification | null {
  const id = item._id || item.id;
  if (!id) return null;

  const actor = item.actor || item.fromUser || item.user;
  const actionText = item.content?.trim() || "interacted with your activity";
  return {
    id,
    actorName: actor?.name || "Unknown user",
    actorPhoto: actor?.photo,
    actionText,
    createdAtText: toRelativeTime(item.createdAt),
    postPreview: item.post?.body,
    isRead: item.isRead === true,
  };
}

export async function getNotifications(page = 1, limit = 30): Promise<AppNotification[]> {
  const { data } = await apiClient.get("/notifications", { params: { page, limit } });
  const list = data?.data?.notifications ?? data?.notifications ?? data?.data ?? [];
  if (!Array.isArray(list)) return [];
  return list
    .map((item: RawNotification) => normalizeNotification(item))
    .filter((item): item is AppNotification => item !== null);
}

export async function getUnreadNotificationsCount(): Promise<number> {
  const { data } = await apiClient.get("/notifications/unread-count");
  const count = data?.data?.count ?? data?.count ?? 0;
  return Number.isFinite(count) ? Number(count) : 0;
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const attempts: Array<() => Promise<unknown>> = [
    () => apiClient.post("/notifications/mark-all-read"),
    () => apiClient.patch("/notifications/mark-all-read"),
    () => apiClient.put("/notifications/mark-all-read"),
    () => apiClient.post("/notifications/read-all"),
    () => apiClient.patch("/notifications/read-all"),
    () => apiClient.put("/notifications/read-all"),
    () => apiClient.post("/notifications/mark-read", { markAll: true }),
    () => apiClient.patch("/notifications/mark-read", { markAll: true }),
  ];

  let lastErrorMessage = "Mark all as read endpoint is not available";

  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      const response = (error as { response?: { status?: number; data?: { message?: string } } }).response;
      const status = response?.status;
      const serverMessage = response?.data?.message;
      if (typeof serverMessage === "string" && serverMessage.trim()) {
        lastErrorMessage = serverMessage;
      }
      if (status === 404 || status === 405) {
        continue;
      }
      throw error;
    }
  }

  throw new Error(lastErrorMessage);
}

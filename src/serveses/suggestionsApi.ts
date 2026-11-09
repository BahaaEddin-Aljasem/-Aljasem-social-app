import axios from "axios";
import apiClient from "./apiClient";

export interface SuggestedFriend {
  id: string;
  name: string;
  username: string;
  followers: number;
  mutual: number;
  photo?: string;
}

interface UnknownFriend {
  _id?: string;
  id?: string;
  name?: string;
  username?: string;
  photo?: string;
  followersCount?: number;
  mutualFriendsCount?: number;
  followers?: unknown[];
  mutualFriends?: unknown[];
}

function normalizeFriend(item: UnknownFriend): SuggestedFriend | null {
  const id = item._id || item.id;
  const name = item.name?.trim();
  const rawUsername = item.username?.trim() || "";

  if (!id || !name) return null;

  const followers = Number.isFinite(item.followersCount)
    ? Number(item.followersCount)
    : Array.isArray(item.followers)
      ? item.followers.length
      : 0;

  const mutual = Number.isFinite(item.mutualFriendsCount)
    ? Number(item.mutualFriendsCount)
    : Array.isArray(item.mutualFriends)
      ? item.mutualFriends.length
      : 0;

  return {
    id,
    name,
    username: rawUsername ? `@${rawUsername.replace(/^@+/, "")}` : "@user",
    followers,
    mutual,
    photo: item.photo || undefined,
  };
}

export async function getSuggestedFriends(page = 1, limit = 20): Promise<SuggestedFriend[]> {
  const { data } = await apiClient.get("/users/suggestions", {
    params: { page, limit },
  });
  const list = data?.data?.users ?? data?.data?.suggestions ?? data?.users ?? data?.suggestions ?? [];
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((item: UnknownFriend) => normalizeFriend(item))
    .filter((item): item is SuggestedFriend => item !== null);
}

export async function followSuggestedFriend(userId: string): Promise<void> {
  const attempts: Array<() => Promise<unknown>> = [
    () => apiClient.put(`/users/${userId}/follow`),
    () => apiClient.post(`/users/follow/${userId}`),
    () => apiClient.post("/users/follow", { userId }),
    () => apiClient.post("/users/toggle-follow", { userId }),
    () => apiClient.patch(`/users/follow/${userId}`),
  ];

  let lastErrorMessage = "Follow endpoint is not available";

  for (const attempt of attempts) {
    try {
      await attempt();
      return;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        const serverMessage =
          (error.response?.data as { message?: string } | undefined)?.message ||
          error.message ||
          "Follow request failed";
        lastErrorMessage = serverMessage;

        if (status === 404 || status === 405) {
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error(lastErrorMessage);
}

import type { ProfileUser } from "../tyeps/profile";
import apiClient, { AUTH_TOKEN_KEY } from "./apiClient";

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

function extractPhotoUrl(payload: unknown, key: "photo" | "coverPhoto"): string {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const userFromData = asRecord(data?.user);
  const userFromRoot = asRecord(root?.user);

  const candidate =
    userFromData?.[key] ??
    userFromRoot?.[key] ??
    data?.[key] ??
    root?.[key];

  return typeof candidate === "string" ? candidate : "";
}

function extractToken(payload: unknown): string {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const candidate = data?.token ?? root?.token;
  return typeof candidate === "string" ? candidate : "";
}

export async function getProfileData(): Promise<ProfileUser> {
  const { data } = await apiClient.get("/users/profile-data");
  const rawUser = data?.data?.user ?? data?.user;
  if (!rawUser) {
    throw new Error("Profile data not found");
  }

  const followersCount = Number.isFinite(rawUser.followersCount)
    ? Number(rawUser.followersCount)
    : Array.isArray(rawUser.followers)
      ? rawUser.followers.length
      : 0;

  const followingCount = Number.isFinite(rawUser.followingCount)
    ? Number(rawUser.followingCount)
    : Array.isArray(rawUser.following)
      ? rawUser.following.length
      : 0;

  const bookmarksCount = Number.isFinite(rawUser.bookmarksCount)
    ? Number(rawUser.bookmarksCount)
    : Array.isArray(rawUser.bookmarks)
      ? rawUser.bookmarks.length
      : 0;

  return {
    ...rawUser,
    followersCount,
    followingCount,
    bookmarksCount,
  } as ProfileUser;
}

export async function uploadProfilePhoto(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("photo", file);
  const { data } = await apiClient.put("/users/upload-photo", formData);

  const photo = extractPhotoUrl(data, "photo");

  if (typeof photo !== "string" || !photo.trim()) {
    throw new Error("Profile photo upload response is invalid");
  }

  return photo;
}

interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmNewPassword: string;
}

export async function changePassword(payload: ChangePasswordPayload): Promise<void> {
  const body = {
    currentPassword: payload.currentPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmNewPassword,
  };

  const { data } = await apiClient.patch("/users/change-password", body);
  const token = extractToken(data);

  if (typeof token === "string" && token.trim()) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

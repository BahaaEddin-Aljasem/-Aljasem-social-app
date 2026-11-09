export interface LocalProfileSettings {
  photo?: string;
  cover?: string;
}

const PROFILE_SETTINGS_KEY = "route-posts-profile-settings";

export function getLocalProfileSettings(): LocalProfileSettings {
  const raw = localStorage.getItem(PROFILE_SETTINGS_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as LocalProfileSettings;
    return {
      photo: typeof parsed.photo === "string" ? parsed.photo : undefined,
      cover: typeof parsed.cover === "string" ? parsed.cover : undefined,
    };
  } catch {
    return {};
  }
}

export function saveLocalProfileSettings(next: LocalProfileSettings) {
  localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event("route-profile-updated"));
}

export function getLocalIdentity() {
  const username = localStorage.getItem("route-posts-username") || "bahaaeddin";
  const userId = localStorage.getItem("route-posts-user-id") || `local-${username.toLowerCase()}`;
  return { username, userId };
}

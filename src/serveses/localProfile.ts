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
  try {
    localStorage.setItem(PROFILE_SETTINGS_KEY, JSON.stringify(next));
  } catch {
    throw new Error("Image is too large to save locally. Try a smaller image.");
  }
  window.dispatchEvent(new Event("route-profile-updated"));
}

export function fileToResizedDataUrl(file: File, maxWidth: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(reader.error);
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Invalid image"));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.naturalWidth);
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.naturalWidth * scale);
        canvas.height = Math.round(img.naturalHeight * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas unavailable"));
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export function getLocalIdentity() {
  const username = localStorage.getItem("route-posts-username") || "bahaaeddin";
  const userId = localStorage.getItem("route-posts-user-id") || `local-${username.toLowerCase()}`;
  return { username, userId };
}

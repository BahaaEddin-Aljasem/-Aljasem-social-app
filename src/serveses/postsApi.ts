import apiClient from "./apiClient";
import type { PostType } from "../tyeps/post";
import { baseUrl } from "../const/environment";

const LOCAL_POSTS_KEY = "route_local_posts";

const readLocalPosts = (): PostType[] => {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_POSTS_KEY) || "[]") as PostType[];
  } catch {
    return [];
  }
};

const saveLocalPosts = (posts: PostType[]) => {
  localStorage.setItem(LOCAL_POSTS_KEY, JSON.stringify(posts));
};

const updateLocalPostBody = (postId: string, body: string) => {
  const current = readLocalPosts();
  const updated = current.map((post) => (post._id === postId ? { ...post, body } : post));
  saveLocalPosts(updated);
};

const removeLocalPost = (postId: string) => {
  const current = readLocalPosts();
  saveLocalPosts(current.filter((post) => post._id !== postId));
};

const updateLocalPostPrivacy = (postId: string, privacy: "public" | "followers" | "private") => {
  const current = readLocalPosts();
  const updated = current.map((post) => (post._id === postId ? { ...post, privacy } : post));
  saveLocalPosts(updated);
};

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

const toAbsoluteMediaUrl = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (trimmed.startsWith("data:") || trimmed.startsWith("blob:")) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.startsWith("//")) return `https:${trimmed}`;
  if (trimmed.startsWith("/")) return `${baseUrl}${trimmed}`;
  return `${baseUrl}/${trimmed}`;
};

const firstString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return undefined;
};

const readAttachmentUrl = (value: unknown): string | undefined => {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const record = asRecord(item);
      const candidate = firstString(
        record?.url,
        record?.path,
        record?.secure_url,
        record?.src,
      );
      if (candidate) return candidate;
    }
    return undefined;
  }
  const record = asRecord(value);
  return firstString(record?.url, record?.path, record?.secure_url, record?.src);
};

const normalizePosts = (payload: unknown): PostType[] => {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const source =
    root?.posts ??
    data?.posts ??
    data ??
    root?.bookmarks ??
    payload ??
    [];

  const asArray = Array.isArray(source) ? source : [];

  return asArray.map((item) => {
    const maybeItem = asRecord(item);
    const raw = asRecord(maybeItem?.post ?? item);
    if (!raw) return (maybeItem?.post ?? item) as PostType;

    const media = asRecord(raw.media);
    const attachmentsUrl = readAttachmentUrl(raw.attachments);
    const mediaUrl = readAttachmentUrl(media);

    const imageCandidate = firstString(
      raw.image,
      raw.photo,
      raw.thumbnail,
      media?.image,
      attachmentsUrl,
      mediaUrl
    );

    const videoCandidate = firstString(
      raw.video,
      raw.videoUrl,
      raw.video_url,
      media?.video,
      media?.videoUrl,
      media?.video_url,
      raw.file
    );
    const mediaType = firstString(raw.mediaType, raw.type, raw.mimeType, media?.type)?.toLowerCase() || "";
    const isVideoByType = mediaType.includes("video");

    const image = isVideoByType ? undefined : toAbsoluteMediaUrl(imageCandidate);
    const video = toAbsoluteMediaUrl(videoCandidate || (isVideoByType ? imageCandidate : undefined));
    const privacyRaw = firstString(raw.privacy, raw.visibility, raw.audience);
    const privacy =
      privacyRaw === "private" || privacyRaw === "followers" || privacyRaw === "public"
        ? privacyRaw
        : undefined;

    const merged: PostType = {
      ...(raw as unknown as PostType),
      image,
      video,
      ...(privacy ? { privacy } : {}),
    };
    return merged;
  });
};

export const getPosts = async (): Promise<PostType[]> => {
  const localPosts = readLocalPosts();
  try {
    const response = await apiClient.get("/posts/feed", {
      params: { only: "following", limit: 20, page: 1 },
    });
    return [...localPosts, ...normalizePosts(response.data)];
  } catch {
    try {
      const fallback = await apiClient.get("/posts", {
        params: { limit: 20, page: 1 },
      });
      return [...localPosts, ...normalizePosts(fallback.data)];
    } catch {
      return localPosts;
    }
  }
};

export const getMyPosts = async (): Promise<PostType[]> => {
  const response = await apiClient.get("/posts/feed", {
    params: { only: "me", limit: 20, page: 1 },
  });
  return normalizePosts(response.data);
};

export const getBookmarkedPosts = async (): Promise<PostType[]> => {
  const response = await apiClient.get("/users/bookmarks", {
    params: { page: 1, limit: 20 },
  });
  return normalizePosts(response.data);
};

const dataUrlToFile = async (dataUrl: string): Promise<File> => {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const extension = blob.type.split("/")[1] || "png";
  return new File([blob], `upload.${extension}`, { type: blob.type });
};

type CreatePostInput =
  | string
  | {
      body: string;
      imageDataUrl?: string;
      imageFile?: File;
      mediaDataUrl?: string;
      mediaFile?: File;
      mediaType?: "image" | "video";
      privacy?: "public" | "private" | "followers";
    };

export const createPost = async (input: CreatePostInput): Promise<PostType> => {
  const payload = typeof input === "string" ? { body: input } : input;
  const text = payload.body.trim();
  const selectedDataUrl = payload.mediaDataUrl || payload.imageDataUrl;
  const selectedFile = payload.mediaFile || payload.imageFile;
  const selectedType: "image" | "video" =
    payload.mediaType ||
    (selectedFile?.type.startsWith("video/") || selectedDataUrl?.startsWith("data:video/")
      ? "video"
      : "image");

  const uploadFile = selectedFile || (selectedDataUrl ? await dataUrlToFile(selectedDataUrl) : null);
  const uploadKeys = selectedType === "video" ? ["video", "media", "file", "image"] : ["image", "media", "file"];

  for (const uploadKey of uploadKeys) {
    const formData = new FormData();
    formData.append("body", text);
    formData.append("privacy", payload.privacy || "public");
    if (uploadFile) {
      formData.append(uploadKey, uploadFile);
    }

    try {
      const response = await apiClient.post("/posts", formData);
      const created =
        response?.data?.post ?? response?.data?.data?.post ?? response?.data?.data ?? response?.data;
      if (created?._id) return normalizePosts([created])[0];
    } catch {
      // Try the next upload key format.
    }
  }

  const localUsername = localStorage.getItem("route_username") || "You";
  const localName = localStorage.getItem("route_name") || localUsername;
  const localUserId = localStorage.getItem("route_user_id") || "local-user";

  const newPost: PostType = {
    _id: `local-${Date.now()}`,
    body: text,
    image: selectedType === "image" ? selectedDataUrl || undefined : undefined,
    video: selectedType === "video" ? selectedDataUrl || undefined : undefined,
    privacy: payload.privacy || "public",
    user: {
      _id: localUserId,
      name: localName,
      username: localUsername,
      photo: localStorage.getItem("route_profile_avatar") || "https://ui-avatars.com/api/?name=You&background=EEF4FF&color=1B4FCC",
    },
    createdAt: new Date().toISOString(),
    likesCount: 0,
    commentsCount: 0,
    sharesCount: 0,
  };

  const existing = readLocalPosts();
  saveLocalPosts([newPost, ...existing]);
  return newPost;
};

export const togglePostLike = async (postId: string) => {
  try {
    return await apiClient.put(`/posts/${postId}/like`);
  } catch {
    return apiClient.post(`/posts/${postId}/like`);
  }
};

export const togglePostBookmark = async (postId: string) => {
  return apiClient.put(`/posts/${postId}/bookmark`);
};

export type PostComment = {
  _id?: string;
  content: string;
  createdAt?: string;
  user?: {
    _id?: string;
    name?: string;
    username?: string;
    photo?: string;
  };
};

const normalizeComments = (payload: unknown): PostComment[] => {
  const root = asRecord(payload);
  const data = asRecord(root?.data);
  const raw = root?.comments ?? data?.comments ?? data ?? payload ?? [];
  const list = Array.isArray(raw) ? raw : [];
  return list.map((item) => {
    const record = asRecord(item);
    const userRecord = asRecord(record?.user);
    return {
    _id: typeof record?._id === "string" ? record._id : undefined,
    content:
      (typeof record?.content === "string" && record.content) ||
      (typeof record?.body === "string" && record.body) ||
      (typeof record?.text === "string" && record.text) ||
      "",
    createdAt: typeof record?.createdAt === "string" ? record.createdAt : undefined,
    user: userRecord
      ? {
          _id: typeof userRecord._id === "string" ? userRecord._id : undefined,
          name: typeof userRecord.name === "string" ? userRecord.name : undefined,
          username: typeof userRecord.username === "string" ? userRecord.username : undefined,
          photo: typeof userRecord.photo === "string" ? userRecord.photo : undefined,
        }
      : undefined,
  };
  });
};

export const getPostComments = async (
  postId: string,
  page = 1,
  limit = 10
): Promise<PostComment[]> => {
  const response = await apiClient.get(`/posts/${postId}/comments`, {
    params: { page, limit },
  });
  return normalizeComments(response.data);
};

export const addPostComment = async (
  postId: string,
  content: string
): Promise<PostComment> => {
  const response = await apiClient.post(`/posts/${postId}/comments`, { content });
  const created =
    response?.data?.comment ??
    response?.data?.data?.comment ??
    response?.data?.data ??
    response?.data;

  if (created) {
    const normalized = normalizeComments([created]);
    if (normalized.length) return normalized[0];
  }

  return {
    content,
    createdAt: new Date().toISOString(),
  };
};

export const sharePost = async (postId: string, message = "") => {
  return apiClient.post(`/posts/${postId}/share`, { body: message });
};

export const updatePostBody = async (postId: string, body: string) => {
  const text = body.trim();
  try {
    const response = await apiClient.put(`/posts/${postId}`, { body: text });
    return response.data;
  } catch {
    try {
      const response = await apiClient.patch(`/posts/${postId}`, { body: text });
      return response.data;
    } catch {
      updateLocalPostBody(postId, text);
      return null;
    }
  }
};

export const deletePost = async (postId: string) => {
  try {
    await apiClient.delete(`/posts/${postId}`);
    removeLocalPost(postId);
    return true;
  } catch {
    removeLocalPost(postId);
    return false;
  }
};

export const updatePostPrivacy = async (
  postId: string,
  privacy: "public" | "followers" | "private"
) => {
  const valuesToTry =
    privacy === "followers" ? ["followers", "friends", "private"] : [privacy];
  const payloadKeys = ["privacy", "visibility", "audience"] as const;
  const methods = ["put", "patch"] as const;
  const paths = [`/posts/${postId}`, `/posts/${postId}/privacy`];

  for (const value of valuesToTry) {
    for (const key of payloadKeys) {
      for (const path of paths) {
        for (const method of methods) {
          try {
            const payload = { [key]: value } as Record<string, string>;
            const response =
              method === "put"
                ? await apiClient.put(path, payload)
                : await apiClient.patch(path, payload);
            updateLocalPostPrivacy(postId, privacy);
            return { synced: true, data: response.data };
          } catch {
            // Try next endpoint/payload variant.
          }
        }
      }
    }
  }

  updateLocalPostPrivacy(postId, privacy);
  return { synced: false };
};

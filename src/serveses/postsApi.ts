import apiClient from "./apiClient";
import type { PostType } from "../tyeps/post";

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

const asRecord = (value: unknown): Record<string, unknown> | null =>
  typeof value === "object" && value !== null ? (value as Record<string, unknown>) : null;

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
    return (maybeItem?.post ?? item) as PostType;
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
      privacy?: "public" | "private";
    };

export const createPost = async (input: CreatePostInput): Promise<PostType> => {
  const payload = typeof input === "string" ? { body: input } : input;
  const text = payload.body.trim();

  const formData = new FormData();
  formData.append("body", text);
  formData.append("privacy", payload.privacy || "public");

  if (payload.imageFile) {
    formData.append("image", payload.imageFile);
  } else if (payload.imageDataUrl) {
    const file = await dataUrlToFile(payload.imageDataUrl);
    formData.append("image", file);
  }

  try {
    const response = await apiClient.post("/posts", formData);
    const created =
      response?.data?.post ?? response?.data?.data?.post ?? response?.data?.data ?? response?.data;
    if (created?._id) return created as PostType;
  } catch {
    // Keep local fallback for temporary API upload failures.
  }

  const localUsername = localStorage.getItem("route_username") || "You";
  const localName = localStorage.getItem("route_name") || localUsername;
  const localUserId = localStorage.getItem("route_user_id") || "local-user";

  const newPost: PostType = {
    _id: `local-${Date.now()}`,
    body: text,
    image: payload.imageDataUrl || undefined,
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

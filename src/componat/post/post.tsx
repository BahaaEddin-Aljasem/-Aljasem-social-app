import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import type { PostType } from "../../tyeps/post";
import {
  addPostComment,
  deletePost,
  getPostComments,
  sharePost,
  togglePostLike,
  togglePostBookmark,
  updatePostBody,
  updatePostPrivacy,
  type PostComment,
} from "../../serveses/postsApi";

interface LocalComment {
  id: string;
  author: string;
  text: string;
  createdAt: string;
  photo?: string;
}

interface StoredInteraction {
  liked: boolean;
  likesDelta: number;
  sharesDelta: number;
  comments: LocalComment[];
}

function storageKey(postId: string) {
  return `route-posts-post-interaction:${postId}`;
}

function hiddenPostKey(postId: string) {
  return `route-posts-hidden-post:${postId}`;
}

function savedPostKey(postId: string) {
  return `route-posts-saved-post:${postId}`;
}

function privacyKey(postId: string) {
  return `route-posts-post-privacy:${postId}`;
}

function loadStoredInteraction(postId: string): StoredInteraction {
  const raw = localStorage.getItem(storageKey(postId));
  if (!raw) {
    return { liked: false, likesDelta: 0, sharesDelta: 0, comments: [] };
  }
  try {
    const parsed = JSON.parse(raw) as Partial<StoredInteraction>;
    return {
      liked: parsed.liked === true,
      likesDelta: Number.isFinite(parsed.likesDelta) ? Number(parsed.likesDelta) : 0,
      sharesDelta: Number.isFinite(parsed.sharesDelta) ? Number(parsed.sharesDelta) : 0,
      comments: Array.isArray(parsed.comments)
        ? parsed.comments.filter((c): c is LocalComment => !!c && typeof c.text === "string" && typeof c.id === "string")
        : [],
    };
  } catch {
    return { liked: false, likesDelta: 0, sharesDelta: 0, comments: [] };
  }
}

function toLocalComment(c: PostComment): LocalComment {
  return {
    id: c._id || `${Date.now()}-${Math.random()}`,
    author: c.user?.name || c.user?.username || "User",
    text: c.content,
    createdAt: c.createdAt || new Date().toISOString(),
    photo: c.user?.photo,
  };
}

function formatRelativeTime(dateString: string): string {
  const created = new Date(dateString).getTime();
  const diff = Math.max(0, Date.now() - created);
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const month = 30 * day;
  if (diff < minute) return "now";
  if (diff < hour) return `${Math.floor(diff / minute)}m`;
  if (diff < day) return `${Math.floor(diff / hour)}h`;
  if (diff < month) return `${Math.floor(diff / day)}d`;
  return `${Math.floor(diff / month)}mo`;
}

function LikeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <path d="M10 11V5.8c0-1.2.8-2.2 2-2.5l.3-.1L13 3l.9 1.9c.2.4.3.8.3 1.2V11h5c1.2 0 2.1 1 2 2.2l-.8 5.3c-.2 1.1-1.1 1.9-2.2 1.9H10z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M4 11h4v9H4z" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <path d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v7A2.5 2.5 0 0 1 16.5 16H10l-4 3v-3H7.5A2.5 2.5 0 0 1 5 13.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <path d="M8 12V6m0 0 2.5 2.5M8 6 5.5 8.5M12 9h3.5A2.5 2.5 0 0 1 18 11.5v4A2.5 2.5 0 0 1 15.5 18h-7A2.5 2.5 0 0 1 6 15.5V15" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type PrivacyValue = "public" | "followers" | "private";

function PrivacyIcon({ privacy }: { privacy: PrivacyValue }) {
  if (privacy === "followers") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8 1a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM4.5 18a4.5 4.5 0 0 1 9 0M13.5 18a3.5 3.5 0 0 1 7 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
      </svg>
    );
  }
  if (privacy === "private") {
    return (
      <svg viewBox="0 0 24 24" className="size-4" fill="none">
        <path d="M7.5 11V8.8a4.5 4.5 0 1 1 9 0V11M6.5 11h11a1.5 1.5 0 0 1 1.5 1.5v6A1.5 1.5 0 0 1 17.5 20h-11A1.5 1.5 0 0 1 5 18.5v-6A1.5 1.5 0 0 1 6.5 11Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16M4 12h16" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export default function Post({ post }: { post: PostType }) {
  const isLocalPost = post._id.startsWith("local-");
  const menuRef = useRef<HTMLDivElement | null>(null);
  const privacyMenuRef = useRef<HTMLSpanElement | null>(null);
  const [interaction, setInteraction] = useState<StoredInteraction>(() => loadStoredInteraction(post._id));
  const [postBody, setPostBody] = useState(() => localStorage.getItem(`route-posts-edited-body:${post._id}`) ?? post.body ?? "");
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState((post.commentsCount ?? 0) > 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [apiCommentsLoaded, setApiCommentsLoaded] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [sendingLike, setSendingLike] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(false);
  const [editInput, setEditInput] = useState(postBody);
  const [hiddenPost, setHiddenPost] = useState(() => localStorage.getItem(hiddenPostKey(post._id)) === "1");
  const [savedPost, setSavedPost] = useState(() => localStorage.getItem(savedPostKey(post._id)) === "1");
  const [savingPost, setSavingPost] = useState(false);
  const [updatingPost, setUpdatingPost] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [privacyMenuOpen, setPrivacyMenuOpen] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);
  const [privacy, setPrivacy] = useState<PrivacyValue>(() => {
    const stored = localStorage.getItem(privacyKey(post._id));
    if (stored === "public" || stored === "followers" || stored === "private") return stored;
    if (post.privacy === "public" || post.privacy === "followers" || post.privacy === "private") return post.privacy;
    return "public";
  });

  const baseLikes = post.likesCount ?? 0;
  const baseComments = post.commentsCount ?? 0;
  const baseShares = post.sharesCount ?? 0;

  const likesCount = Math.max(0, baseLikes + interaction.likesDelta);
  const commentsCount = Math.max(baseComments, interaction.comments.length);
  const sharesCount = Math.max(0, baseShares + interaction.sharesDelta);
  const topComment = interaction.comments[0];

  const currentUser = useMemo(() => localStorage.getItem("route-posts-username") || "You", []);
  const currentPhoto = useMemo(() => localStorage.getItem("route_profile_avatar") || undefined, []);
  const canEditOrDelete = useMemo(() => {
    const postUserId = post.user?._id || "";
    const localUserId = localStorage.getItem("route-posts-user-id") || "";
    const localUsername = (localStorage.getItem("route-posts-username") || "").trim().toLowerCase();
    const postUsername = (post.user?.username || "").trim().toLowerCase();
    const postName = (post.user?.name || "").trim().toLowerCase();
    if (isLocalPost) return true;
    if (!!postUserId && !!localUserId && postUserId === localUserId) return true;
    if (localUsername && (localUsername === postUsername || localUsername === postName)) return true;
    return false;
  }, [isLocalPost, post.user]);

  const persist = useCallback(
    (next: StoredInteraction | ((prev: StoredInteraction) => StoredInteraction)) => {
      setInteraction((prev) => {
        const resolved = typeof next === "function" ? next(prev) : next;
        localStorage.setItem(storageKey(post._id), JSON.stringify(resolved));
        return resolved;
      });
    },
    [post._id]
  );

  useEffect(() => {
    if (!showComments || isLocalPost || apiCommentsLoaded) return;
    let active = true;

    const run = async () => {
      try {
        setLoadingComments(true);
        const comments = await getPostComments(post._id, 1, 20);
        if (!active) return;
        persist((prev) => ({
          ...prev,
          comments: comments.map(toLocalComment),
        }));
        setApiCommentsLoaded(true);
      } catch {
        // Keep UI usable even if comments API fails for one post.
      } finally {
        if (active) setLoadingComments(false);
      }
    };

    void run();
    return () => {
      active = false;
    };
  }, [showComments, isLocalPost, apiCommentsLoaded, post._id, persist]);

  useEffect(() => {
    if (!previewImage) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setPreviewImage(null);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [previewImage]);

  useEffect(() => {
    if (!menuOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [menuOpen]);

  useEffect(() => {
    if (!privacyMenuOpen) return;
    const onMouseDown = (event: MouseEvent) => {
      if (!privacyMenuRef.current?.contains(event.target as Node)) {
        setPrivacyMenuOpen(false);
      }
    };
    window.addEventListener("mousedown", onMouseDown);
    return () => window.removeEventListener("mousedown", onMouseDown);
  }, [privacyMenuOpen]);

  async function handleLike() {
    if (sendingLike) return;
    const previous = interaction;
    const next = {
      ...interaction,
      liked: !interaction.liked,
      likesDelta: interaction.likesDelta + (interaction.liked ? -1 : 1),
    };
    persist(next);

    if (isLocalPost) return;

    try {
      setSendingLike(true);
      await togglePostLike(post._id);
    } catch {
      persist(previous);
      toast.error("Failed to like post");
    } finally {
      setSendingLike(false);
    }
  }

  async function handleShare() {
    if (sharing) return;
    const postUrl = `${window.location.origin}${window.location.pathname}#post-${post._id}`;

    try {
      setSharing(true);
      if (!isLocalPost) {
        await sharePost(post._id);
      }

      if (navigator.share) {
        await navigator.share({ title: "Social", text: post.body || "Check this post", url: postUrl });
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(postUrl);
      }

      persist({ ...interaction, sharesDelta: interaction.sharesDelta + 1 });
    } catch {
      toast.error("Failed to share post");
    } finally {
      setSharing(false);
    }
  }

  async function handleAddComment(e: React.FormEvent) {
    e.preventDefault();
    if (sendingComment) return;
    const text = commentInput.trim();
    if (!text) return;

    const optimistic: LocalComment = {
      id: `${Date.now()}`,
      author: currentUser,
      text,
      createdAt: new Date().toISOString(),
      photo: currentPhoto,
    };

    const previous = interaction;
    const nextComments = [optimistic, ...interaction.comments];
    persist({ ...interaction, comments: nextComments });
    setCommentInput("");
    setShowComments(true);

    if (isLocalPost) return;

    try {
      setSendingComment(true);
      const saved = await addPostComment(post._id, text);
      const savedLocal = toLocalComment(saved);
      persist({
        ...previous,
        comments: [savedLocal, ...previous.comments],
      });
    } catch {
      persist(previous);
      toast.error("Failed to add comment");
    } finally {
      setSendingComment(false);
    }
  }

  async function handleToggleSavePost() {
    if (savingPost) return;
    const nextSaved = !savedPost;
    setSavedPost(nextSaved);
    localStorage.setItem(savedPostKey(post._id), nextSaved ? "1" : "0");
    setMenuOpen(false);

    try {
      setSavingPost(true);
      if (!isLocalPost) {
        await togglePostBookmark(post._id);
      }
      toast.success(nextSaved ? "Post saved" : "Post removed from saved");
    } catch {
      toast.error("Saved locally. API bookmark is unavailable right now.");
    } finally {
      setSavingPost(false);
    }
  }

  async function handleSaveEdit() {
    if (updatingPost) return;
    const nextBody = editInput.trim();
    if (!nextBody) {
      toast.error("Post text cannot be empty");
      return;
    }

    const previousBody = postBody;
    setPostBody(nextBody);
    localStorage.setItem(`route-posts-edited-body:${post._id}`, nextBody);

    try {
      setUpdatingPost(true);
      await updatePostBody(post._id, nextBody);
      toast.success("Post updated");
      setEditingPost(false);
    } catch {
      setPostBody(previousBody);
      localStorage.setItem(`route-posts-edited-body:${post._id}`, previousBody);
      toast.error("Failed to update post");
    } finally {
      setUpdatingPost(false);
    }
  }

  async function handleChangePrivacy(nextPrivacy: PrivacyValue) {
    if (updatingPrivacy || nextPrivacy === privacy) {
      setPrivacyMenuOpen(false);
      return;
    }
    if (!canEditOrDelete) {
      toast.error("You can only update privacy for your own post");
      setPrivacyMenuOpen(false);
      return;
    }

    const previousPrivacy = privacy;
    setPrivacy(nextPrivacy);
    localStorage.setItem(privacyKey(post._id), nextPrivacy);
    setPrivacyMenuOpen(false);

    if (isLocalPost) {
      toast.success("Privacy updated");
      return;
    }

    try {
      setUpdatingPrivacy(true);
      const result = await updatePostPrivacy(post._id, nextPrivacy);
      if (result.synced) {
        toast.success("Privacy updated");
      } else {
        toast.info("Privacy updated locally");
      }
    } catch {
      setPrivacy(previousPrivacy);
      localStorage.setItem(privacyKey(post._id), previousPrivacy);
      toast.error("Failed to update privacy");
    } finally {
      setUpdatingPrivacy(false);
    }
  }

  async function handleDeletePost() {
    if (deletingPost) return;

    const previousHidden = hiddenPost;
    setHiddenPost(true);
    localStorage.setItem(hiddenPostKey(post._id), "1");
    setMenuOpen(false);
    setShowDeleteConfirm(false);

    try {
      setDeletingPost(true);
      await deletePost(post._id);
      toast.success("Post deleted");
    } catch {
      setHiddenPost(previousHidden);
      localStorage.setItem(hiddenPostKey(post._id), previousHidden ? "1" : "0");
      toast.error("Failed to delete post");
    } finally {
      setDeletingPost(false);
    }
  }

  if (hiddenPost) return null;

  return (
    <>
      <article id={`post-${post._id}`} className="overflow-hidden rounded-[14px] border border-[#dbe6f5] bg-white shadow-[0_2px_10px_rgba(15,23,42,0.06)]">
      <header className="flex items-start justify-between p-4 pb-3">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center overflow-hidden rounded-full bg-[#00298d] font-bold text-white">
            {post.user.photo ? (
              <img src={post.user.photo} alt={post.user.name} className="size-full object-cover" />
            ) : (
              post.user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <h3 className="text-[18px] leading-none font-bold text-[#0f172a]">{post.user.name}</h3>
            <p className="mt-1 text-[14px] text-[#1f3b6d]">
              @{post.user.username || post.user.name.toLowerCase().replace(/\s+/g, "")}
              <span className="px-1.5 text-[#94a3b8]">·</span>
              <span>{formatRelativeTime(post.createdAt)}</span>
              <span className="px-1.5 text-[#94a3b8]">·</span>
              <span className="relative inline-flex" ref={privacyMenuRef}>
                <button
                  type="button"
                  onClick={() => {
                    setMenuOpen(false);
                    setPrivacyMenuOpen((v) => !v);
                  }}
                  className="inline-flex items-center gap-1 text-[#0f2d6b] hover:text-[#0b1f4d]"
                >
                  <PrivacyIcon privacy={privacy} />
                  {privacy === "public" ? "Public" : privacy === "followers" ? "Followers" : "Only me"}
                  <svg
                    viewBox="0 0 24 24"
                    className={`size-3.5 transition-transform ${privacyMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                  >
                    <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                {privacyMenuOpen && (
                  <div className="absolute top-7 left-0 z-20 min-w-34.5 overflow-hidden rounded-2xl border border-[#dbe6f5] bg-white py-1.5 shadow-[0_10px_24px_rgba(15,23,42,0.14)]">
                    <button
                      type="button"
                      disabled={updatingPrivacy}
                      onClick={() => void handleChangePrivacy("public")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f5f8ff] disabled:opacity-60"
                    >
                      <PrivacyIcon privacy="public" />
                      Public
                    </button>
                    <button
                      type="button"
                      disabled={updatingPrivacy}
                      onClick={() => void handleChangePrivacy("followers")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f5f8ff] disabled:opacity-60"
                    >
                      <PrivacyIcon privacy="followers" />
                      Followers
                    </button>
                    <button
                      type="button"
                      disabled={updatingPrivacy}
                      onClick={() => void handleChangePrivacy("private")}
                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[#334155] hover:bg-[#f5f8ff] disabled:opacity-60"
                    >
                      <PrivacyIcon privacy="private" />
                      Only me
                    </button>
                  </div>
                )}
              </span>
            </p>
          </div>
        </div>
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            onClick={() => {
              setPrivacyMenuOpen(false);
              setMenuOpen((v) => !v);
            }}
            className="rounded-full p-1.5 text-slate-500 hover:bg-[#f1f5ff]"
          >
            <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
              <circle cx="6" cy="12" r="1.6" />
              <circle cx="12" cy="12" r="1.6" />
              <circle cx="18" cy="12" r="1.6" />
            </svg>
          </button>
          {menuOpen && (
            <div className="absolute top-9 right-0 z-20 min-w-37.5 overflow-hidden rounded-2xl border border-[#dbe6f5] bg-white py-1.5 shadow-[0_10px_30px_rgba(15,23,42,0.12)]">
              <button
                type="button"
                onClick={handleToggleSavePost}
                disabled={savingPost}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#1e3a8a] hover:bg-[#f5f8ff] disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none">
                  <path d="M7 4.5h10A1.5 1.5 0 0 1 18.5 6v14l-6.5-3-6.5 3V6A1.5 1.5 0 0 1 7 4.5z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                </svg>
                <span>{savedPost ? "Unsave post" : "Save post"}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canEditOrDelete) {
                    toast.error("You can only edit your own post");
                    return;
                  }
                  setMenuOpen(false);
                  setEditInput(postBody);
                  setEditingPost(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-medium text-[#1e3a8a] hover:bg-[#f5f8ff]"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none">
                  <path d="m4 16 9.9-9.9a2.1 2.1 0 1 1 3 3L7 19H4z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                  <path d="M13 7l4 4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                </svg>
                <span>Edit post</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!canEditOrDelete) {
                    toast.error("You can only delete your own post");
                    return;
                  }
                  setMenuOpen(false);
                  setShowDeleteConfirm(true);
                }}
                className="flex w-full items-center gap-2 bg-[#fff5f7] px-3 py-2 text-left text-sm font-medium text-[#e11d48] hover:bg-[#ffeaf0]"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none">
                  <path d="M5 7h14M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7m-8 0 .7 11a2 2 0 0 0 2 1.9h4.6a2 2 0 0 0 2-1.9L17 7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>{deletingPost ? "Deleting..." : "Delete post"}</span>
              </button>
            </div>
          )}
        </div>
      </header>

      {postBody && <p className="px-4 pb-3 text-[16px] leading-7 text-[#0f172a]">{postBody}</p>}

      {post.image && (
        <div className="border-t border-b border-[#dbe6f5]">
          <button
            type="button"
            onClick={() => {
              if (post.image) setPreviewImage(post.image);
            }}
            className="block w-full cursor-zoom-in"
            aria-label="Open image preview"
          >
            <img src={post.image} alt="" className="h-auto w-full object-cover" />
          </button>
        </div>
      )}

      <footer className="px-4 py-3">
        <div className="flex items-center justify-between border-b border-[#dbe6f5] pb-2 text-sm">
          <div className="flex items-center gap-1.5 text-[#1d4ed8]">
            <span className="grid size-6 place-items-center rounded-full bg-[#1d4ed8] text-white">
              <LikeIcon />
            </span>
            <span className="text-[14px] text-[#1f3b6d]">{likesCount} likes</span>
          </div>
          <div className="flex items-center gap-4 text-[14px] text-[#475569]">
            <span>{sharesCount} shares</span>
            <span>{commentsCount} comments</span>
            <button type="button" className="text-[14px] font-semibold text-[#1d4ed8] hover:underline">
              View details
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 border-b border-[#dbe6f5] py-2.5 text-[#1f3b6d]">
          <button
            type="button"
            onClick={handleLike}
            disabled={sendingLike}
            className={`inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[15px] font-semibold hover:bg-[#f5f8ff] ${interaction.liked ? "text-[#1d4ed8]" : ""}`}
          >
            <LikeIcon />
            {sendingLike ? "..." : "Like"}
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[15px] font-semibold hover:bg-[#f5f8ff]"
          >
            <CommentIcon />
            Comment
          </button>
          <button
            type="button"
            onClick={handleShare}
            disabled={sharing}
            className="inline-flex items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-[15px] font-semibold hover:bg-[#f5f8ff]"
          >
            <ShareIcon />
            {sharing ? "..." : "Share"}
          </button>
        </div>

        {showComments && (
          <div className="mt-3 rounded-2xl border border-[#dbe6f5] bg-[#f8fbff] p-3">
            <p className="text-[11px] font-black tracking-wide text-[#64748b] uppercase">Top Comment</p>

            {loadingComments ? (
              <p className="mt-2 text-xs text-slate-500">Loading comments...</p>
            ) : topComment ? (
              <div className="mt-2 flex items-start gap-2 rounded-xl bg-white p-2.5">
                {topComment.photo ? (
                  <img src={topComment.photo} alt={topComment.author} className="size-8 rounded-full object-cover" />
                ) : (
                  <div className="grid size-8 place-items-center rounded-full bg-[#dbe3f1] text-[11px] font-bold text-slate-700">
                    {topComment.author.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-[13px] font-bold text-[#0f172a]">{topComment.author}</p>
                  <p className="text-[14px] text-[#0f172a]">{topComment.text}</p>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-slate-500">No comments yet.</p>
            )}

            <form onSubmit={handleAddComment} className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Write a comment..."
                className="h-10 w-full rounded-lg border border-[#dbe3f1] bg-white px-3 text-sm text-slate-800 outline-none focus:border-[#2563eb]"
              />
              <button
                type="submit"
                disabled={sendingComment}
                className="rounded-lg bg-[#1877f2] px-3 py-2 text-xs font-bold text-white disabled:opacity-60"
              >
                Send
              </button>
            </form>

            {commentsCount > 0 && (
              <button type="button" className="mt-2 text-sm font-bold text-[#1d4ed8] hover:underline">
                View all comments
              </button>
            )}
          </div>
        )}
      </footer>
      </article>

      {previewImage && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreviewImage(null)}
          role="presentation"
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/15 px-3 py-1.5 text-sm font-bold text-white hover:bg-white/25"
            onClick={() => setPreviewImage(null)}
          >
            Close
          </button>
          <img
            src={previewImage}
            alt="Post preview"
            className="max-h-[92vh] w-auto max-w-full rounded-md object-contain"
            onClick={(event) => event.stopPropagation()}
          />
        </div>
      )}

      {editingPost && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingPost(false)} role="presentation">
          <div
            className="w-full max-w-lg rounded-2xl bg-white p-4 shadow-[0_12px_30px_rgba(0,0,0,0.2)]"
            onClick={(event) => event.stopPropagation()}
          >
            <p className="text-lg font-bold text-[#0f172a]">Edit post</p>
            <textarea
              value={editInput}
              onChange={(event) => setEditInput(event.target.value)}
              className="mt-3 h-32 w-full resize-none rounded-xl border border-[#dbe6f5] px-3 py-2 text-sm outline-none focus:border-[#2563eb]"
            />
            <div className="mt-3 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setEditingPost(false)}
                className="rounded-lg border border-[#dbe6f5] px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleSaveEdit()}
                disabled={updatingPost}
                className="rounded-lg bg-[#1877f2] px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {updatingPost ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteConfirm && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center bg-black/45 p-4"
          onClick={() => setShowDeleteConfirm(false)}
          role="presentation"
        >
          <div
            className="w-full max-w-[540px] overflow-hidden rounded-2xl bg-white shadow-[0_18px_45px_rgba(15,23,42,0.25)]"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-[#dbe6f5] px-5 py-4">
              <p className="text-[30px] font-bold text-[#0f172a]">Confirm action</p>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-full p-1 text-[#64748b] hover:bg-[#f1f5ff]"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="size-5" fill="none">
                  <path d="m6 6 12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </button>
            </div>

            <div className="flex items-start gap-3 border-b border-[#dbe6f5] px-5 py-4">
              <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-[#ffe8ee] text-[#ff2851]">
                <svg viewBox="0 0 24 24" className="size-5" fill="none">
                  <path d="M12 4.7 20 19H4z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                  <path d="M12 9.5v4.5M12 16.8h.01" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                </svg>
              </span>
              <div>
                <p className="text-2xl font-bold text-[#0f172a]">Delete this post?</p>
                <p className="mt-1 text-base text-[#51627f]">This post will be permanently removed from your profile and feed.</p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 px-5 py-3.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="rounded-xl border border-[#c9d7ef] bg-white px-5 py-2.5 text-lg font-semibold text-[#34435d] hover:bg-[#f8fbff]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDeletePost()}
                disabled={deletingPost}
                className="rounded-xl bg-[#ff0f3f] px-5 py-2.5 text-lg font-bold text-white hover:bg-[#eb0b38] disabled:opacity-60"
              >
                {deletingPost ? "Deleting..." : "Delete post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

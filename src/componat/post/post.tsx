import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import type { PostType } from "../../tyeps/post";
import {
  addPostComment,
  getPostComments,
  sharePost,
  togglePostLike,
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

export default function Post({ post }: { post: PostType }) {
  const isLocalPost = post._id.startsWith("local-");
  const [interaction, setInteraction] = useState<StoredInteraction>(() => loadStoredInteraction(post._id));
  const [commentInput, setCommentInput] = useState("");
  const [showComments, setShowComments] = useState((post.commentsCount ?? 0) > 0);
  const [loadingComments, setLoadingComments] = useState(false);
  const [apiCommentsLoaded, setApiCommentsLoaded] = useState(false);
  const [sendingComment, setSendingComment] = useState(false);
  const [sendingLike, setSendingLike] = useState(false);
  const [sharing, setSharing] = useState(false);

  const baseLikes = post.likesCount ?? 0;
  const baseComments = post.commentsCount ?? 0;
  const baseShares = post.sharesCount ?? 0;

  const likesCount = Math.max(0, baseLikes + interaction.likesDelta);
  const commentsCount = Math.max(baseComments, interaction.comments.length);
  const sharesCount = Math.max(0, baseShares + interaction.sharesDelta);
  const topComment = interaction.comments[0];

  const currentUser = useMemo(() => localStorage.getItem("route-posts-username") || "You", []);
  const currentPhoto = useMemo(() => localStorage.getItem("route_profile_avatar") || undefined, []);

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

  return (
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
              <span className="inline-flex items-center gap-1 text-[#0f2d6b]">
                <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                  <circle cx="12" cy="12" r="8" stroke="#0f2d6b" strokeWidth="1.6" />
                  <path d="M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16M4 12h16" stroke="#0f2d6b" strokeWidth="1.6" />
                </svg>
                Public
              </span>
            </p>
          </div>
        </div>
        <button type="button" className="rounded-full p-1.5 text-slate-500 hover:bg-[#f1f5ff]">
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor">
            <circle cx="6" cy="12" r="1.6" />
            <circle cx="12" cy="12" r="1.6" />
            <circle cx="18" cy="12" r="1.6" />
          </svg>
        </button>
      </header>

      {post.body && <p className="px-4 pb-3 text-[16px] leading-7 text-[#0f172a]">{post.body}</p>}

      {post.image && (
        <div className="border-t border-b border-[#dbe6f5]">
          <img src={post.image} alt="" className="h-auto w-full object-cover" />
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
  );
}

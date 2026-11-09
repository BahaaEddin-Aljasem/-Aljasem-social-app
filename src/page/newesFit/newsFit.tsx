import { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import Post from "../../componat/post/post";
import Sidebar from "../../componat/sidbar/sidbar";
import Suggestions from "../../componat/sidbar/Suggestions";
import { createPost, getPosts } from "../../serveses/postsApi";
import { getLocalProfileSettings } from "../../serveses/localProfile";
import type { PostType } from "../../tyeps/post";

function ImageIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="2.5" stroke="#00A66E" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1.5" fill="#00A66E" />
      <path d="M6.5 16.5 11 12l2.8 2.8 2.7-2.3L19.5 16.5" stroke="#00A66E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function FeelingIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#F59E0B" strokeWidth="1.8" />
      <circle cx="9" cy="10" r="1" fill="#F59E0B" />
      <circle cx="15" cy="10" r="1" fill="#F59E0B" />
      <path d="M8.5 14.5c1 .9 2.1 1.4 3.5 1.4s2.5-.5 3.5-1.4" stroke="#F59E0B" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function GlobeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <circle cx="12" cy="12" r="8" stroke="#64748B" strokeWidth="1.7" />
      <path d="M12 4a12 12 0 0 1 0 16M12 4a12 12 0 0 0 0 16M4 12h16" stroke="#64748B" strokeWidth="1.7" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <path d="M4 12 20 4l-5.3 16-2.7-6L4 12Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type PrivacyOption = "Public" | "Followers" | "Only me";
type MediaType = "image" | "video" | null;

export default function NewFitness() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [body, setBody] = useState("");
  const [mediaDataUrl, setMediaDataUrl] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaType, setMediaType] = useState<MediaType>(null);
  const [privacy, setPrivacy] = useState<PrivacyOption>("Public");
  const [submitting, setSubmitting] = useState(false);
  const displayName = localStorage.getItem("route-posts-username") || "bahaaeddin";
  const profilePhoto = getLocalProfileSettings().photo;

  const load = useCallback(async () => {
    try {
      setPosts(await getPosts());
    } catch {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!body.trim() && !mediaDataUrl) return;
    setSubmitting(true);
    try {
      const createdPost = await createPost({
        body: body.trim(),
        mediaDataUrl: mediaDataUrl || undefined,
        mediaFile: mediaFile || undefined,
        mediaType: mediaType || undefined,
        privacy: privacy === "Only me" ? "private" : privacy === "Followers" ? "followers" : "public",
      });
      setBody("");
      setMediaDataUrl("");
      setMediaFile(null);
      setMediaType(null);
      const localOnly = createdPost._id.startsWith("local-");
      if (localOnly) {
        setPosts((prev) => [createdPost, ...prev]);
        toast.info("Posted locally. Server upload failed, so this post is visible in your current session.");
      } else {
        toast.success("Post created");
        await load();
      }
    } catch {
      toast.error("Failed to create post");
    } finally {
      setSubmitting(false);
    }
  }

  function handleMediaChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMediaFile(file);
    setMediaType(file.type.startsWith("video/") ? "video" : "image");
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      setMediaDataUrl(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[200px_minmax(0,1fr)_260px] xl:grid-cols-[210px_minmax(0,1fr)_280px]">
      <div className="order-1 self-start lg:sticky lg:top-20">
        <Sidebar />
      </div>
      <div className="order-2 self-start lg:order-3 lg:sticky lg:top-20">
        <Suggestions />
      </div>
      <section className="order-3 mx-auto w-full max-w-[680px] space-y-3 lg:order-2">
        <form onSubmit={submit} className="rounded-2xl border border-[#dbe3f1] bg-white p-3 shadow-sm">
          <div className="mb-3 flex items-center gap-3">
            {profilePhoto ? (
              <img src={profilePhoto} alt={displayName} className="size-10 rounded-full object-cover" />
            ) : (
              <div className="grid size-10 place-items-center rounded-full bg-[#0f4bcf] font-bold text-white">{displayName.charAt(0).toUpperCase()}</div>
            )}
            <div>
              <p className="text-sm font-semibold text-slate-900">{displayName}</p>
              <label className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-[#eef3fb] px-2 py-0.5 text-xs text-slate-700">
                <GlobeIcon />
                <select
                  value={privacy}
                  onChange={(e) => setPrivacy(e.target.value as PrivacyOption)}
                  className="bg-transparent pr-3 outline-none"
                  aria-label="Post privacy"
                >
                  <option value="Public">Public</option>
                  <option value="Followers">Followers</option>
                  <option value="Only me">Only me</option>
                </select>
              </label>
            </div>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="What's on your mind, bahaaeddin?"
            aria-label="Post content"
            className="w-full resize-none rounded-xl border border-[#dbe3f1] bg-[#f8faff] p-3 text-sm outline-none transition focus:border-[#2563eb]"
            rows={4}
          />
          {mediaDataUrl && (
            <div className="mt-2 overflow-hidden rounded-xl border border-[#dbe3f1]">
              {mediaType === "video" ? (
                <video src={mediaDataUrl} className="max-h-96 w-full bg-black object-contain" controls playsInline />
              ) : (
                <img src={mediaDataUrl} alt="Media preview" className="max-h-96 w-full object-cover" />
              )}
            </div>
          )}
          <div className="mt-3 flex items-center justify-between border-t border-[#edf1f7] pt-2">
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <label className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2 py-1 hover:bg-[#f1f5ff]">
                <ImageIcon />
                <span className="text-sm text-slate-600">Photo/video</span>
                <input type="file" accept="image/*,video/*" onChange={handleMediaChange} className="hidden" />
              </label>
              <button type="button" className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 hover:bg-[#f1f5ff]">
                <FeelingIcon />
                <span className="text-sm text-slate-600">Feeling/activity</span>
              </button>
            </div>
            <button
              type="submit"
              disabled={submitting || (!body.trim() && !mediaDataUrl)}
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#5b9df7] px-5 py-1.5 text-sm font-semibold text-white transition hover:bg-[#3f87ed] disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post"}
              <SendIcon />
            </button>
          </div>
        </form>
        {loading && <p className="text-center text-slate-500">Loading...</p>}
        {!loading && posts.length === 0 && (
          <div className="rounded-2xl border border-[#dbe3f1] bg-white px-4 py-10 text-center text-sm text-slate-500 shadow-sm">
            No posts yet. Be the first one to publish.
          </div>
        )}
        {posts.map((p) => (
          <Post key={p._id} post={p} />
        ))}
      </section>
    </div>
  );
}
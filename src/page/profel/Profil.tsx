import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import Post from "../../componat/post/post";
import { getLocalIdentity, getLocalProfileSettings, saveLocalProfileSettings } from "../../serveses/localProfile";
import { getProfileData, uploadCoverPhoto, uploadProfilePhoto } from "../../serveses/profileApi";
import { getBookmarkedPosts, getMyPosts } from "../../serveses/postsApi";
import type { PostType } from "../../tyeps/post";
import type { ProfileUser } from "../../tyeps/profile";

type ProfileTab = "posts" | "saved";

export default function Profile() {
  const [profile, setProfile] = useState<ProfileUser | null>(null);
  const [myPosts, setMyPosts] = useState<PostType[]>([]);
  const [savedPosts, setSavedPosts] = useState<PostType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: ProfileTab = searchParams.get("tab") === "saved" ? "saved" : "posts";
  const [photo, setPhoto] = useState(getLocalProfileSettings().photo ?? "");
  const [cover, setCover] = useState(getLocalProfileSettings().cover ?? "");
  const identity = getLocalIdentity();

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      try {
        const [user, ownPosts, bookmarks] = await Promise.all([
          getProfileData(),
          getMyPosts(),
          getBookmarkedPosts(),
        ]);
        if (!active) return;
        setProfile(user);
        if (user.photo) setPhoto(user.photo);
        if (user.coverPhoto) setCover(user.coverPhoto);
        setMyPosts(ownPosts);
        setSavedPosts(bookmarks);
      } catch {
        if (!active) return;
        setProfile({
          _id: identity.userId,
          name: identity.username,
          username: identity.username,
        });
        setMyPosts([]);
        setSavedPosts([]);
      } finally {
        if (active) setLoading(false);
      }
    }
    void loadProfile();
    return () => {
      active = false;
    };
  }, [identity.userId, identity.username]);

  const initial = (profile?.name || identity.username).charAt(0).toUpperCase();
  const username = profile?.username?.trim() || identity.username;
  const email = profile?.email ?? `${identity.username}@gmail.com`;

  async function updateImage(type: "photo" | "cover", file?: File) {
    if (!file) return;
    try {
      if (type === "photo") {
        const uploadedPhoto = await uploadProfilePhoto(file);
        setPhoto(uploadedPhoto);
        saveLocalProfileSettings({ ...getLocalProfileSettings(), photo: uploadedPhoto });
      } else {
        const uploadedCover = await uploadCoverPhoto(file);
        if (uploadedCover) {
          setCover(uploadedCover);
          saveLocalProfileSettings({ ...getLocalProfileSettings(), cover: uploadedCover });
        }
      }
      const refreshed = await getProfileData();
      setProfile(refreshed);
      toast.success(type === "photo" ? "Profile photo updated" : "Cover updated");
    } catch {
      toast.error(type === "photo" ? "Failed to upload profile photo" : "Failed to upload cover photo");
    }
  }

  const followersCount = profile?.followersCount ?? 0;
  const followingCount = profile?.followingCount ?? 0;
  const bookmarksCount = profile?.bookmarksCount ?? savedPosts.length;

  return (
    <section className="space-y-4">
      <article className="overflow-hidden rounded-2xl border border-[#e6ebf3] bg-white shadow-sm">
        <div className="relative h-48 overflow-hidden bg-linear-to-r from-[#1f2d4d] via-[#27436f] to-[#5c97cf]">
          {cover && <img src={cover} alt="Cover" className="size-full object-cover" />}
          <label className="absolute right-3 top-3 cursor-pointer rounded-lg bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700">
            Add cover
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { void updateImage("cover", e.target.files?.[0]); }} />
          </label>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="relative -mt-16">
                <div className="grid size-24 place-items-center overflow-hidden rounded-full border-4 border-white bg-[#00298d] text-3xl font-bold text-white shadow">
                  {photo || profile?.photo ? (
                    <img src={photo || profile?.photo} alt={profile?.name} className="size-full object-cover" />
                  ) : (
                    initial
                  )}
                </div>
                <button
                  type="button"
                  className="absolute bottom-0 left-0 grid size-8 place-items-center rounded-full border border-[#e4ebf6] bg-white text-[#2563eb] shadow"
                >
                  <svg viewBox="0 0 24 24" className="size-4" fill="none">
                    <path d="M8 4H4v4M16 4h4v4M8 20H4v-4M20 16v4h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
                <label className="absolute bottom-0 right-0 grid size-8 cursor-pointer place-items-center rounded-full bg-[#1877f2] text-white shadow">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none">
                    <path d="M4.5 8.5A2.5 2.5 0 0 1 7 6h2l1.1-1.2c.3-.3.7-.5 1.1-.5h1.6c.4 0 .8.2 1.1.5L15 6h2a2.5 2.5 0 0 1 2.5 2.5V16A2.5 2.5 0 0 1 17 18.5H7A2.5 2.5 0 0 1 4.5 16z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
                    <circle cx="12" cy="12.2" r="3" stroke="currentColor" strokeWidth="1.7" />
                  </svg>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { void updateImage("photo", e.target.files?.[0]); }} />
                </label>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">{profile?.name ?? identity.username}</h1>
                <p className="text-sm text-slate-500">@{username}</p>
                <span className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#2563eb]">
                  <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
                    <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.7" />
                    <path d="M4.5 16.2c.5-2.1 2.2-3.3 4.5-3.3 1.1 0 2 .2 2.8.7" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                    <path d="M15.2 8.5h4.3M17.4 6.3v4.3" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                  Social member
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-2xl border border-[#e3e9f5] bg-white px-5 py-3">
                <p className="text-[11px] font-bold uppercase text-slate-400">Followers</p>
                <p className="text-[38px] font-bold leading-none text-slate-900">{followersCount}</p>
              </div>
              <div className="rounded-2xl border border-[#e3e9f5] bg-white px-5 py-3">
                <p className="text-[11px] font-bold uppercase text-slate-400">Following</p>
                <p className="text-[38px] font-bold leading-none text-slate-900">{followingCount}</p>
              </div>
              <div className="rounded-2xl border border-[#e3e9f5] bg-white px-5 py-3">
                <p className="text-[11px] font-bold uppercase text-slate-400">Bookmarks</p>
                <p className="text-[38px] font-bold leading-none text-slate-900">{bookmarksCount}</p>
              </div>
            </div>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#e6ebf3] bg-[#f9fbff] p-4">
              <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">About</h2>
              <p className="mt-2 text-sm text-slate-700">{email}</p>
              <p className="mt-1 text-sm text-slate-600">Active on Social</p>
            </div>
            <div className="rounded-xl border border-[#e6ebf3] bg-[#f9fbff] p-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">My posts</p>
                <p className="text-xl font-bold text-slate-900">{myPosts.length}</p>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-slate-500">Saved posts</p>
                <p className="text-xl font-bold text-slate-900">{savedPosts.length}</p>
              </div>
            </div>
          </div>
        </div>
      </article>

      <article className="rounded-2xl border border-[#e6ebf3] bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-2">
          <div className="rounded-xl bg-[#eef3fd] p-1">
            <button
              type="button"
              onClick={() => {
                setSearchParams({ tab: "posts" });
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === "posts" ? "bg-white text-[#00298d] shadow" : "text-slate-600 hover:text-[#00298d]"}`}
            >
              My Posts
            </button>
            <button
              type="button"
              onClick={() => {
                setSearchParams({ tab: "saved" });
              }}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === "saved" ? "bg-white text-[#00298d] shadow" : "text-slate-600 hover:text-[#00298d]"}`}
            >
              Saved
            </button>
          </div>
          <span className="text-sm font-semibold text-slate-500">{tab === "posts" ? myPosts.length : savedPosts.length}</span>
        </div>

        {loading && <p className="text-sm text-slate-500">Loading profile...</p>}
        {!loading && tab === "posts" && myPosts.length === 0 && <p className="text-sm text-slate-600">You have not posted yet.</p>}
        {!loading && tab === "saved" && savedPosts.length === 0 && <p className="text-sm text-slate-600">No saved posts yet.</p>}

        {!loading && tab === "posts" && myPosts.length > 0 && (
          <div className="space-y-4">
            {myPosts.map((post) => (
              <Post key={post._id} post={post} />
            ))}
          </div>
        )}
        {!loading && tab === "saved" && savedPosts.length > 0 && (
          <div className="space-y-4">
            {savedPosts.map((post) => (
              <Post key={post._id} post={post} />
            ))}
          </div>
        )}
      </article>
    </section>
  );
}

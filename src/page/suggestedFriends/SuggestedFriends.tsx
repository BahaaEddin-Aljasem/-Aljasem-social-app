import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { followSuggestedFriend, getSuggestedFriends, type SuggestedFriend } from "../../serveses/suggestionsApi";

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none">
      <path d="m14.5 6.5-5 5 5 5" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="none">
      <circle cx="11" cy="11" r="6.5" stroke="#94A3B8" strokeWidth="1.8" />
      <path d="m16 16 3.5 3.5" stroke="#94A3B8" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function FollowIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-3.5" fill="none">
      <circle cx="10" cy="9" r="3" stroke="#1f73ff" strokeWidth="1.7" />
      <path d="M4.7 18c0-2.6 2.1-4.1 5.3-4.1 1.5 0 2.6.3 3.5.9" stroke="#1f73ff" strokeWidth="1.7" strokeLinecap="round" />
      <path d="M16 10h5M18.5 7.5v5" stroke="#1f73ff" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

export default function SuggestedFriendsPage() {
  const navigate = useNavigate();
  const [friends, setFriends] = useState<SuggestedFriend[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const data = await getSuggestedFriends();
        if (!active) return;
        setFriends(data);
      } catch {
        if (!active) return;
        toast.error("Failed to load suggested friends");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return friends;
    return friends.filter((item) => item.name.toLowerCase().includes(term) || item.username.toLowerCase().includes(term));
  }, [friends, query]);

  async function handleFollow(friend: SuggestedFriend) {
    setFollowLoading((prev) => ({ ...prev, [friend.id]: true }));
    try {
      await followSuggestedFriend(friend.id);
      setFriends((prev) => prev.filter((item) => item.id !== friend.id));
      toast.success(`You followed ${friend.name}`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to follow user");
    } finally {
      setFollowLoading((prev) => ({ ...prev, [friend.id]: false }));
    }
  }

  return (
    <section className="space-y-3">
      <button
        type="button"
        onClick={() => navigate("/feed")}
        className="inline-flex items-center gap-1 rounded-lg border border-[#dbe5f3] bg-white px-3 py-1.5 text-sm font-semibold text-[#334155] hover:bg-[#f7faff]"
      >
        <BackIcon />
        Back to feed
      </button>

      <article className="rounded-2xl border border-[#dbe5f3] bg-white p-3.5 shadow-[0_1px_4px_rgba(15,23,42,0.08)]">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-[30px] font-bold leading-none text-[#1f2b45]">All Suggested Friends</h1>
          <span className="rounded-full bg-[#edf2fb] px-2 py-0.5 text-xs font-bold text-[#64748b]">{filtered.length}</span>
        </div>

        <label className="mb-3 flex items-center gap-2 rounded-xl border border-[#dbe5f3] bg-[#f8fbff] px-3 py-2.5">
          <SearchIcon />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name or username..."
            className="w-full bg-transparent text-[15px] text-slate-700 outline-none placeholder:text-[#9aa8bc]"
          />
        </label>

        {loading ? (
          <p className="px-2 py-5 text-sm text-slate-500">Loading suggestions...</p>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {filtered.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#dbe5f3] bg-white p-3">
                <div className="flex items-center gap-2.5">
                  {item.photo ? (
                    <img src={item.photo} alt={item.name} className="size-11 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-11 place-items-center rounded-full bg-[#e8f1ff] text-sm font-bold text-[#1f73ff]">
                      {item.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[15px] font-bold leading-tight text-[#1f2937]">{item.name}</p>
                    <p className="truncate text-[13px] leading-none text-[#70839e]">{item.username}</p>
                  </div>
                  <button
                    type="button"
                    disabled={followLoading[item.id]}
                    onClick={() => {
                      void handleFollow(item);
                    }}
                    className="inline-flex items-center gap-1 rounded-full bg-[#e8f1ff] px-3 py-1.5 text-[13px] font-bold text-[#1f73ff] disabled:opacity-60"
                  >
                    <FollowIcon />
                    {followLoading[item.id] ? "..." : "Follow"}
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-full bg-[#f1f5f9] px-2 py-0.5 text-xs font-semibold text-[#6b7e99]">{item.followers} followers</span>
                  <span className="rounded-full bg-[#e8f1ff] px-2 py-0.5 text-xs font-bold text-[#1f73ff]">{item.mutual} mutual</span>
                </div>
              </div>
            ))}
            {filtered.length === 0 && <p className="px-2 py-4 text-sm text-slate-500">No suggested friends found.</p>}
          </div>
        )}
      </article>
    </section>
  );
}

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getUnreadNotificationsCount } from "../../serveses/notificationsApi";

function FeedIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <rect x="4" y="5" width="16" height="14" rx="3" fill="#E8F1FF" stroke="#1F73FF" strokeWidth="1.6" />
      <path d="M8 9h8M8 12h8M8 15h5" stroke="#1F73FF" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PostIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <path d="M12 4v6m0 0 3-3m-3 3-3-3" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M20 14v4a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-4" stroke="#7C3AED" strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="6.5" cy="8.5" r="1.5" fill="#A78BFA" />
    </svg>
  );
}

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.4c0 .7-.2 1.4-.6 2L5.8 15a1 1 0 0 0 .8 1.5h10.8a1 1 0 0 0 .8-1.5l-1.1-1.6c-.4-.6-.6-1.3-.6-2V9A4.5 4.5 0 0 0 12 4.5Z" fill="#ECF3FF" stroke="#42638d" strokeWidth="1.6" />
      <path d="M10.2 18a1.8 1.8 0 0 0 3.6 0" stroke="#42638d" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none">
      <path d="M7 4h10a2 2 0 0 1 2 2v14l-7-4-7 4V6a2 2 0 0 1 2-2z" fill="#FFF7ED" stroke="#EA580C" strokeWidth="1.6" />
    </svg>
  );
}

const itemClass =
  "flex w-full items-center justify-center gap-2 rounded-xl px-3 py-2 text-[15px] font-semibold transition lg:justify-start lg:gap-3";

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const count = await getUnreadNotificationsCount();
        if (active) setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    };
    void load();

    const timer = window.setInterval(() => {
      void load();
    }, 20000);
    const handleUnreadEvent = (event: Event) => {
      const custom = event as CustomEvent<{ count?: number }>;
      const count = custom.detail?.count;
      if (typeof count === "number" && Number.isFinite(count)) {
        setUnreadCount(Math.max(0, count));
      }
    };
    window.addEventListener("route-unread-notifications", handleUnreadEvent);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("route-unread-notifications", handleUnreadEvent);
    };
  }, [location.pathname]);

  const isFeed = location.pathname === "/feed";
  const isMyPosts = location.pathname === "/profile" && new URLSearchParams(location.search).get("tab") !== "saved";
  const isSaved = location.pathname === "/profile" && new URLSearchParams(location.search).get("tab") === "saved";
  const isNotifications = location.pathname === "/notifications";

  return (
    <aside className="rounded-2xl border border-[#dfe6f2] bg-white p-3 shadow-[0_1px_4px_rgba(15,23,42,0.12)]">
      <ul className="grid grid-cols-2 gap-2 lg:grid-cols-1 lg:gap-1">
        <li>
          <button
            type="button"
            onClick={() => navigate("/feed")}
            className={`${itemClass} ${isFeed ? "bg-[#e7f2ff] text-[#1f73ff]" : "text-[#1f2f52] hover:bg-[#f6f9ff]"}`}
          >
            <FeedIcon />
            <span>Feed</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => navigate("/profile?tab=posts")}
            className={`${itemClass} ${isMyPosts ? "bg-[#f3edff] text-[#7c3aed]" : "text-[#1f2f52] hover:bg-[#f6f9ff]"}`}
          >
            <PostIcon />
            <span>My Posts</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => navigate("/notifications")}
            className={`${itemClass} ${isNotifications ? "bg-[#eef4ff] text-[#335178]" : "text-[#1f2f52] hover:bg-[#f6f9ff]"}`}
          >
            <span className="relative inline-flex">
              <NotificationIcon />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] leading-4 font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            <span className="hidden md:inline lg:hidden">Community</span>
            <span className="md:hidden lg:inline">Notifications</span>
          </button>
        </li>
        <li>
          <button
            type="button"
            onClick={() => navigate("/profile?tab=saved")}
            className={`${itemClass} ${isSaved ? "bg-[#fff7ed] text-[#c2410c]" : "text-[#1f2f52] hover:bg-[#f6f9ff]"}`}
          >
            <SaveIcon />
            <span>Saved</span>
          </button>
        </li>
      </ul>
    </aside>
  );
}

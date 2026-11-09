import { useEffect, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { getLocalProfileSettings } from "../../serveses/localProfile";
import { getUnreadNotificationsCount } from "../../serveses/notificationsApi";

function NotificationIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4.5" fill="none">
      <path d="M12 4.5a4.5 4.5 0 0 0-4.5 4.5v2.4c0 .7-.2 1.4-.6 2L5.8 15a1 1 0 0 0 .8 1.5h10.8a1 1 0 0 0 .8-1.5l-1.1-1.6c-.4-.6-.6-1.3-.6-2V9A4.5 4.5 0 0 0 12 4.5Z" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10.2 18a1.8 1.8 0 0 0 3.6 0" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const displayName = localStorage.getItem("route-posts-username") || "bahaaeddin";
  const [profilePhoto, setProfilePhoto] = useState(getLocalProfileSettings().photo);
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const syncProfile = () => setProfilePhoto(getLocalProfileSettings().photo);
    window.addEventListener("route-profile-updated", syncProfile);
    const closeMenu = () => setMenuOpen(false);
    window.addEventListener("click", closeMenu);
    return () => {
      window.removeEventListener("route-profile-updated", syncProfile);
      window.removeEventListener("click", closeMenu);
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadUnread = async () => {
      try {
        const count = await getUnreadNotificationsCount();
        if (active) setUnreadCount(count);
      } catch {
        if (active) setUnreadCount(0);
      }
    };

    void loadUnread();
    const timer = window.setInterval(() => {
      void loadUnread();
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

  const link = ({ isActive }: { isActive: boolean }) =>
    `rounded-full px-4 py-2 text-sm font-semibold transition ${isActive ? "bg-white text-[#2563eb] shadow-sm" : "text-slate-600 hover:text-[#2563eb]"}`;

  function logout() {
    localStorage.removeItem("route-posts-token");
    localStorage.removeItem("route-posts-username");
    localStorage.removeItem("route-posts-user-id");
    localStorage.removeItem("route_token");
    localStorage.removeItem("route_username");
    localStorage.removeItem("route_user_id");
    navigate("/auth/login", { replace: true });
  }

  function openProfile() {
    setMenuOpen(false);
    navigate("/profile");
  }

  function openSettings() {
    setMenuOpen(false);
    navigate("/settings");
  }

  return (
    <nav className="sticky top-0 z-20 border-b border-[#e7edf6] bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-3 py-2 md:px-4">
        <div className="mr-auto flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-lg bg-[#0f4bcf] text-[9px] font-bold text-white">ROUTE</div>
          <span className="text-2xl font-bold text-[#0f172a] md:text-[32px]">Social</span>
        </div>
        <div className="hidden rounded-2xl border border-[#e3e9f4] bg-[#f8faff] p-1 md:flex">
          <NavLink to="/feed" className={link}>Feed</NavLink>
          <NavLink to="/profile" className={link}>Profile</NavLink>
          <NavLink to="/notifications" className={`${link({ isActive: location.pathname === "/notifications" })} relative inline-flex items-center gap-1.5`}>
            <span className="relative inline-flex">
              <NotificationIcon />
              {unreadCount > 0 && (
                <span className="absolute -right-2 -top-2 inline-flex min-w-4 items-center justify-center rounded-full bg-[#ef4444] px-1 text-[10px] leading-4 font-bold text-white">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </span>
            Notifications
            {unreadCount > 0 && (
              <span className="sr-only">{unreadCount} unread notifications</span>
            )}
          </NavLink>
        </div>
        <div className="relative ml-auto" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-full border border-[#d8e2f3] bg-linear-to-r from-white to-[#f7faff] px-3 py-1.5 text-sm text-slate-700 shadow-sm transition hover:border-[#c7d6ef] hover:shadow"
          >
            {profilePhoto ? (
              <img src={profilePhoto} alt={displayName} className="size-7 rounded-full object-cover" />
            ) : (
              <span className="grid size-7 place-items-center rounded-full bg-[#0f4bcf] text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </span>
            )}
            <span>{displayName}</span>
            <svg viewBox="0 0 24 24" className={`size-4 text-slate-500 transition ${menuOpen ? "rotate-90" : ""}`} fill="none">
              <path d="M6 8h12M6 12h12M6 16h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-12 w-52 rounded-2xl border border-[#dbe5f5] bg-white p-2 shadow-[0_12px_30px_rgba(15,23,42,0.15)]">
              <button
                type="button"
                onClick={openProfile}
                className="group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] text-[#334155] transition hover:bg-[#f3f7ff]"
              >
                <span className="grid size-6 place-items-center text-[#64748b]">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none">
                    <circle cx="12" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M6.5 18c.8-2.5 2.8-3.8 5.5-3.8s4.7 1.3 5.5 3.8" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="font-medium">Profile</span>
              </button>
              <button
                type="button"
                onClick={openSettings}
                className="group flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[15px] text-[#334155] transition hover:bg-[#f3f7ff]"
              >
                <span className="grid size-6 place-items-center text-[#64748b]">
                  <svg viewBox="0 0 24 24" className="size-4" fill="none">
                    <path d="M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5Z" stroke="currentColor" strokeWidth="1.8" />
                    <path d="M19 12a7.3 7.3 0 0 0-.1-1.3l2-1.6-1.8-3.1-2.4.8a7 7 0 0 0-2.2-1.3L14 3h-4l-.5 2.5a7 7 0 0 0-2.2 1.3l-2.4-.8L3.1 9.1l2 1.6A7.3 7.3 0 0 0 5 12c0 .4 0 .9.1 1.3l-2 1.6 1.8 3.1 2.4-.8c.7.6 1.4 1 2.2 1.3L10 21h4l.5-2.5a7 7 0 0 0 2.2-1.3l2.4.8 1.8-3.1-2-1.6c.1-.4.1-.9.1-1.3Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="font-medium">Settings</span>
              </button>
              <div className="my-1 border-t border-[#edf2fb]" />
              <button
                type="button"
                onClick={logout}
                className="w-full rounded-xl bg-[#fff2f3] px-3 py-2.5 text-left text-[15px] font-semibold text-[#ef4444] transition hover:bg-[#ffe8eb]"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

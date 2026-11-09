import { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  getNotifications,
  getUnreadNotificationsCount,
  markAllNotificationsAsRead,
  type AppNotification,
} from "../../serveses/notificationsApi";

type NotificationTab = "all" | "unread";

export default function Notification() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [tab, setTab] = useState<NotificationTab>("all");
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const [items, unread] = await Promise.all([getNotifications(), getUnreadNotificationsCount()]);
        if (!active) return;
        setNotifications(items);
        setUnreadCount(unread);
      } catch {
        if (!active) return;
        toast.error("Failed to load notifications");
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    window.dispatchEvent(new CustomEvent("route-unread-notifications", { detail: { count: unreadCount } }));
  }, [unreadCount]);

  const visibleNotifications = useMemo(() => {
    if (tab === "unread") {
      return notifications.filter((item) => !item.isRead);
    }
    return notifications;
  }, [notifications, tab]);

  const notificationsWithUnreadNumber = useMemo(() => {
    return visibleNotifications.map((item, index) => ({
      item,
      unreadNumber: item.isRead
        ? null
        : visibleNotifications.slice(0, index + 1).filter((n) => !n.isRead).length,
    }));
  }, [visibleNotifications]);

  async function handleMarkAllRead() {
    setMarkingAllRead(true);
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
      setTab("all");
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to mark notifications as read");
    } finally {
      setMarkingAllRead(false);
    }
  }

  return (
    <section className="rounded-2xl border border-[#dfe6f1] bg-white shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1f7] p-5">
        <div>
          <h1 className="text-[38px] font-bold leading-none text-[#0f2348]">Notifications</h1>
          <p className="mt-2 text-sm text-slate-500">Realtime updates for likes, comments, shares, and follows.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            void handleMarkAllRead();
          }}
          disabled={loading || unreadCount === 0 || markingAllRead}
          className="rounded-xl border border-[#e2e8f3] px-4 py-2 text-sm font-semibold text-slate-500 enabled:hover:bg-[#f7f9fe] disabled:opacity-60"
        >
          {markingAllRead ? "Marking..." : "Mark all as read"}
        </button>
      </div>

      <div className="p-4">
        <div className="mb-5 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-full px-5 py-2 text-sm font-bold ${tab === "all" ? "bg-[#2c7af6] text-white" : "bg-[#eff2f7] text-slate-600"}`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setTab("unread")}
            className={`rounded-full px-5 py-2 text-sm font-bold ${tab === "unread" ? "bg-[#2c7af6] text-white" : "bg-[#eff2f7] text-slate-600"}`}
          >
            Unread {unreadCount > 0 ? `(${unreadCount})` : ""}
          </button>
        </div>

        {loading ? (
          <div className="rounded-xl border border-[#e3e9f4] bg-[#f9fbff] px-4 py-10 text-center text-[20px] font-medium text-[#5473a8]">
            Loading notifications...
          </div>
        ) : visibleNotifications.length === 0 ? (
          <div className="rounded-xl border border-[#e3e9f4] bg-[#f9fbff] px-4 py-10 text-center text-[28px] font-medium text-[#5473a8]">
            No notifications yet.
          </div>
        ) : (
          <div className="space-y-3">
            {notificationsWithUnreadNumber.map(({ item, unreadNumber }) => (
              <article key={item.id} className="rounded-xl border border-[#e3e9f4] bg-white p-4">
                <div className="flex items-start gap-3">
                  {unreadNumber !== null && (
                    <span className="mt-0.5 inline-flex size-6 items-center justify-center rounded-full bg-[#edf4ff] text-xs font-bold text-[#2c7af6]">
                      {unreadNumber}
                    </span>
                  )}
                  {item.actorPhoto ? (
                    <img src={item.actorPhoto} alt={item.actorName} className="size-10 rounded-full object-cover" />
                  ) : (
                    <div className="grid size-10 place-items-center rounded-full bg-[#e8f1ff] text-sm font-bold text-[#2c7af6]">
                      {item.actorName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-slate-700">
                      <span className="font-bold text-slate-900">{item.actorName}</span> {item.actionText}
                    </p>
                    {item.postPreview && <p className="mt-1 truncate text-sm text-slate-500">{item.postPreview}</p>}
                    <p className="mt-1 text-xs text-slate-400">{item.createdAtText}</p>
                  </div>
                  {!item.isRead && <span className="mt-1 size-2 rounded-full bg-[#2c7af6]" aria-label="Unread notification" />}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

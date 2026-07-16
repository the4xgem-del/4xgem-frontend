import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { useNotifications } from "@/features/notifications/notificationsApi";

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.round(hrs / 24)}d ago`;
}

const TYPE_EMOJI: Record<string, string> = { SIGNAL: "⚡", NEWS: "📰", BILLING: "💳", SYSTEM: "🔔" };

export function NotificationsBell() {
  const [open, setOpen] = useState(false);
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="relative p-2 rounded-xl border border-[#E5E7EB] text-[#6B7280] hover:bg-gray-50 transition-colors">
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E5E7EB] rounded-2xl shadow-xl z-20 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#F1F5F9]">
              <span className="font-semibold text-sm text-[#111827]">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={() => markAllRead()} className="text-xs text-[#2563EB] font-medium hover:underline flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm text-[#6B7280]">You're all caught up.</div>
              ) : (
                notifications.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => !n.readAt && markRead(n.id)}
                    className={`w-full text-left px-4 py-3 border-b border-[#F1F5F9] last:border-0 hover:bg-[#F8FAFC] transition-colors ${!n.readAt ? "bg-blue-50/40" : ""}`}
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-lg leading-none mt-0.5">{TYPE_EMOJI[n.type] ?? "🔔"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold text-[#111827]">{n.title}</div>
                        <div className="text-xs text-[#6B7280] mt-0.5 line-clamp-2">{n.body}</div>
                        <div className="text-[11px] text-[#9CA3AF] mt-1">{timeAgo(n.createdAt)}</div>
                      </div>
                      {!n.readAt && <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 flex-shrink-0" />}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

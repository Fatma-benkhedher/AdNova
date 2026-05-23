import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { fetchNotifications, markNotificationRead, type Notification } from "../../services/notifications";

/** Full date: weekday, day month at time */
function formatNotificationDate(createdAt: string) {
  const d = new Date(createdAt);
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" }) + " " + d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

const NOTIFICATION_AVATAR_COLORS = [
  "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", "#EC4899", "#06B6D4", "#84CC16",
];
function getAvatarColor(index: number) {
  return NOTIFICATION_AVATAR_COLORS[index % NOTIFICATION_AVATAR_COLORS.length];
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = localStorage.getItem("user");
      if (stored) {
        const u = JSON.parse(stored) as { id?: number; role?: string };
        setUserRole(u.role?.toLowerCase() ?? null);
        setUserId(u.id ?? null);
      } else {
        setUserRole(null);
        setUserId(null);
      }
    } catch {
      setUserRole(null);
      setUserId(null);
    }
  }, []);

  useEffect(() => {
    if (userId == null) {
      setNotifications([]);
      return;
    }
    setLoading(true);
    fetchNotifications(userId, userRole)
      .then((list) => {
        const isOperator = userRole === "operator";
        setNotifications(isOperator ? list : list.filter((n) => n.type === "reply"));
      })
      .catch(() => setNotifications([]))
      .finally(() => setLoading(false));
  }, [userId, userRole, isOpen]);

  const unreadCount = notifications.filter((n) => !n.readAt).length;
  const isOperator = userRole === "operator";
  const hasNotifications = notifications.length > 0;

  function toggleDropdown() {
    setIsOpen((o) => !o);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  async function handleNotificationClick(n: Notification) {
    const messageId = n.message?.id ?? (n as unknown as { messageId?: number }).messageId;
    if (!messageId) return;
    if (!n.readAt) {
      try {
        await markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x))
        );
      } catch {}
    }
    closeDropdown();
    navigate(`/messages?open=${messageId}`);
  }

  return (
    <div className="relative">
      <button
        className="relative flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full dropdown-toggle hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={toggleDropdown}
      >
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 z-10 flex h-2.5 w-2.5 items-center justify-center rounded-full bg-adbot-orange ring-2 ring-white dark:ring-dark-card">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-adbot-orange opacity-75" />
          </span>
        )}
        <svg
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-adbot-orange px-1.5 text-[11px] font-extrabold text-white shadow-md ring-2 ring-white dark:ring-dark-card">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>
      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="absolute -right-[240px] mt-[17px] flex h-[480px] w-[350px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark sm:w-[361px] lg:right-0"
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-700">
          <h5 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h5>
          <button
            onClick={toggleDropdown}
            className="text-gray-500 transition dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
          >
            <svg className="fill-current" width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M6.21967 7.28131C5.92678 6.98841 5.92678 6.51354 6.21967 6.22065C6.51256 5.92775 6.98744 5.92775 7.28033 6.22065L11.999 10.9393L16.7176 6.22078C17.0105 5.92789 17.4854 5.92788 17.7782 6.22078C18.0711 6.51367 18.0711 6.98855 17.7782 7.28144L13.0597 12L17.7782 16.7186C18.0711 17.0115 18.0711 17.4863 17.7782 17.7792C17.4854 18.0721 17.0105 18.0721 16.7176 17.7792L11.999 13.0607L7.28033 17.7794C6.98744 18.0722 6.51256 18.0722 6.21967 17.7794C5.92678 17.4865 5.92678 17.0116 6.21967 16.7187L10.9384 12L6.21967 7.28131Z" fill="currentColor" />
            </svg>
          </button>
        </div>
        <ul className="flex flex-col h-auto overflow-y-auto custom-scrollbar">
          {userId == null && (
            <li className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">
              Sign in to see notifications.
            </li>
          )}
          {userId != null && loading && (
            <li className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Loading...</li>
          )}
          {userId != null && !loading && notifications.length === 0 && (
            <li className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">No notifications yet.</li>
          )}
          {userId != null && !loading && notifications.map((n, index) => {
            const isReply = n.type === "reply";
            const subject = n.message?.subject ?? "New message";
            const title = isReply ? "Support replied to your request" : subject;
            const statusRead = !!n.readAt;
            const avatarColor = getAvatarColor(index);
            const initials = (n.fromUser?.firstName?.[0] ?? "") + (n.fromUser?.lastName?.[0] ?? "") || "?";
            return (
              <li key={n.id}>
                <DropdownItem
                  onItemClick={() => handleNotificationClick(n)}
                  className={`flex gap-3 rounded-lg border-b border-gray-100 p-3 px-4.5 py-3 hover:bg-gray-100 dark:border-gray-800 dark:hover:bg-white/5 ${!statusRead ? "bg-blue-50/50 dark:bg-blue-900/10" : ""}`}
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: avatarColor }}
                  >
                    {initials}
                  </span>
                  <span className="block min-w-0 flex-1">
                    <span className="mb-1 block font-medium text-gray-800 dark:text-white/90 text-theme-sm line-clamp-2">
                      {title}
                    </span>
                    {isReply && (
                      <span className="block text-theme-xs text-gray-500 dark:text-gray-400 line-clamp-1">
                        {subject}
                      </span>
                    )}
                    <span className="flex items-center gap-2 text-theme-xs text-gray-500 dark:text-gray-400 flex-wrap">
                      <span>{formatNotificationDate(n.createdAt)}</span>
                      <span className="h-1 w-1 shrink-0 rounded-full bg-gray-400" />
                      <span className="flex items-center gap-1.5">
                        <span
                          className={`w-2 h-2 shrink-0 rounded-full ${statusRead ? "bg-green-500" : "bg-amber-500"}`}
                          title={statusRead ? "Read" : "Unread"}
                        />
                        <span className={statusRead ? "text-gray-400" : "text-amber-600 dark:text-amber-400 font-medium"}>
                          {statusRead ? "Read" : "Unread"}
                        </span>
                      </span>
                    </span>
                  </span>
                </DropdownItem>
              </li>
            );
          })}
        </ul>
        {userId != null && (
          <a
            href="/messages"
            onClick={(e) => { e.preventDefault(); closeDropdown(); navigate("/messages"); }}
            className="mt-3 block rounded-lg border border-gray-300 bg-white px-4 py-2 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
          >
            View all in Message box
          </a>
        )}
      </Dropdown>
    </div>
  );
}

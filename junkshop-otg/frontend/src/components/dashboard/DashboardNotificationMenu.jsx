import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { notificationApi } from "../../services/api";
import { REFRESH_INTERVAL_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    dashboardIconButtonClass,
    notificationBadgeBaseClass,
    notificationBadgePositionClass,
} from "./dashboardTopbarUi";
import { getPickupRequestId } from "../../utils/notificationNavigation";

const VISIBLE_LIMIT = 5;

function getNotificationId(notification) {
    return notification._id || notification.id;
}

export default function DashboardNotificationMenu({ onNavigate, isNavigable }) {
    const notifRef = useRef(null);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [clearing, setClearing] = useState(false);

    const loadNotifications = useCallback(async () => {
        try {
            const { notifications: rows } = await notificationApi.list();
            setNotifications(rows || []);
        } catch {
            /* keep last list on poll failure */
        }
    }, []);

    useEffect(() => {
        loadNotifications();
    }, [loadNotifications]);

    useAutoRefresh(loadNotifications, { intervalMs: REFRESH_INTERVAL_MS });

    useEffect(() => {
        if (!showNotifs) return;
        const handlePointerDown = (event) => {
            if (notifRef.current && !notifRef.current.contains(event.target)) {
                setShowNotifs(false);
            }
        };
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [showNotifs]);

    const unreadCount = notifications.filter((n) => !n.read).length;
    const visibleNotifications = notifications.slice(0, VISIBLE_LIMIT);

    const markReadLocal = (id) => {
        setNotifications((prev) =>
            prev.map((item) =>
                getNotificationId(item) === id ? { ...item, read: true } : item
            )
        );
    };

    const handleClearAll = async () => {
        if (notifications.length === 0 || clearing) return;
        setClearing(true);
        try {
            await notificationApi.clearAll();
            setNotifications([]);
        } catch {
            /* ignore */
        } finally {
            setClearing(false);
        }
    };

    const handleNotificationClick = (notification) => {
        const id = getNotificationId(notification);
        if (!notification.read && id) {
            notificationApi.markRead(id).catch(() => {});
            markReadLocal(id);
        }
        setShowNotifs(false);
        onNavigate?.(notification);
    };

    return (
        <div className="relative" ref={notifRef}>
            <button
                type="button"
                onClick={() => setShowNotifs((open) => !open)}
                className={`relative ${dashboardIconButtonClass}`}
                aria-label="Notifications"
                aria-expanded={showNotifs}
            >
                <span className="relative inline-flex shrink-0">
                    <Bell size={20} className="text-emerald-900" />
                    {unreadCount > 0 && (
                        <span
                            className={`${notificationBadgeBaseClass} ${notificationBadgePositionClass} ${
                                unreadCount > 9 ? "h-[14px] min-w-[14px] px-[3px]" : "h-[14px] w-[14px]"
                            }`}
                        >
                            {unreadCount > 9 ? "9+" : unreadCount}
                        </span>
                    )}
                </span>
            </button>

            {showNotifs && (
                <div className="absolute right-0 top-full mt-2 w-[min(20rem,calc(100vw-2rem))] rounded-2xl border border-zinc-200 bg-white shadow-xl z-50 overflow-hidden">
                    <div className="px-3 py-2.5 border-b border-zinc-100 bg-[#f9f9f8]">
                        <p className="text-xs font-bold uppercase tracking-wide text-[#72796e]">
                            Notifications
                        </p>
                    </div>

                    <div className="scroll-y-clean max-h-72 p-2">
                        {visibleNotifications.length === 0 ? (
                            <p className="text-sm text-[#72796e] px-3 py-6 text-center">
                                No notifications
                            </p>
                        ) : (
                            visibleNotifications.map((notification) => {
                                const id = getNotificationId(notification);
                                const pickupId = getPickupRequestId(notification);
                                const isClickable = isNavigable
                                    ? isNavigable(notification)
                                    : Boolean(pickupId);

                                return (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => handleNotificationClick(notification)}
                                        disabled={!isClickable}
                                        className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1 transition-colors ${
                                            notification.read
                                                ? "text-[#72796e] hover:bg-zinc-50"
                                                : "bg-emerald-50 font-semibold text-[#191c1c] hover:bg-emerald-100/80"
                                        } ${isClickable ? "cursor-pointer hover:ring-1 hover:ring-emerald-200/80" : "cursor-default opacity-80"}`}
                                    >
                                        <p className="font-semibold text-xs">{notification.title}</p>
                                        <p className="text-xs mt-0.5 line-clamp-2 font-normal">
                                            {notification.message}
                                        </p>
                                    </button>
                                );
                            })
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="border-t border-zinc-100 p-2 bg-white">
                            <button
                                type="button"
                                onClick={handleClearAll}
                                disabled={clearing}
                                className="w-full py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                            >
                                {clearing ? "Clearing…" : "Clear all notifications"}
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export { getPickupRequestId };

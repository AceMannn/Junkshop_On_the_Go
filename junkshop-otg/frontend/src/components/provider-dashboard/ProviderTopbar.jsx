import { useCallback, useEffect, useRef, useState } from "react";
import { Bell, HelpCircle, LogOut, Settings, User } from "lucide-react";
import { notificationApi } from "../../services/api";
import { REFRESH_INTERVAL_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import { getUserInitials, getUserFullName } from "../../utils/userDisplay";
import logoImage from "../../assets/junkshop-logo.png";
import {
    dashboardAvatarClass,
    dashboardIconButtonClass,
    dashboardProfileNameClass,
    dashboardProfileTriggerClass,
    dashboardTopbarActionsClass,
    dashboardTopbarInnerClass,
    dashboardTopbarLogoClass,
    dashboardTopbarShellClass,
} from "../dashboard/dashboardTopbarUi";

export default function ProviderTopbar({
    user,
    showProfileMenu,
    setShowProfileMenu,
    onHelp,
    onNavigateSettings,
    onLogout,
}) {
    const menuRef = useRef(null);
    const notifRef = useRef(null);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const initials = getUserInitials(user);
    const fullName = getUserFullName(user) || user?.junkshopName || "Provider";
    const displayName = user?.junkshopName || user?.firstName || "Provider";

    useEffect(() => {
        if (!showProfileMenu) return;
        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };
        document.addEventListener("mousedown", handlePointerDown);
        return () => document.removeEventListener("mousedown", handlePointerDown);
    }, [showProfileMenu, setShowProfileMenu]);

    const loadNotifications = useCallback(async () => {
        try {
            const { notifications: rows } = await notificationApi.list();
            setNotifications(rows || []);
        } catch {
            /* keep last list */
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

    const runMenuAction = (action) => {
        setShowProfileMenu(false);
        action();
    };

    return (
        <header className={dashboardTopbarShellClass}>
            <div className={dashboardTopbarInnerClass}>
                <div className="flex items-center min-w-0 shrink-0">
                    <img
                        src={logoImage}
                        alt="JunkShop On-The-Go"
                        className={dashboardTopbarLogoClass}
                    />
                </div>

                <div className={dashboardTopbarActionsClass}>
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setShowNotifs((o) => !o)}
                            className={`relative ${dashboardIconButtonClass}`}
                            aria-label="Notifications"
                        >
                            <Bell size={20} className="text-emerald-900" />
                            {unreadCount > 0 && (
                                <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-500 text-[10px] font-bold text-white flex items-center justify-center">
                                    {unreadCount > 9 ? "9+" : unreadCount}
                                </span>
                            )}
                        </button>
                        {showNotifs && (
                            <div className="absolute right-0 top-full mt-2 w-72 max-h-80 overflow-y-auto rounded-2xl border border-zinc-200 bg-white shadow-xl z-50 p-2">
                                {notifications.length === 0 ? (
                                    <p className="text-sm text-[#72796e] px-3 py-4 text-center">No notifications</p>
                                ) : (
                                    notifications.map((n) => (
                                        <button
                                            key={n._id}
                                            type="button"
                                            onClick={() => {
                                                if (!n.read) notificationApi.markRead(n._id).catch(() => {});
                                                setNotifications((prev) =>
                                                    prev.map((x) =>
                                                        x._id === n._id ? { ...x, read: true } : x
                                                    )
                                                );
                                            }}
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1 ${n.read ? "text-[#72796e]" : "bg-emerald-50 font-semibold text-[#191c1c]"}`}
                                        >
                                            <p className="font-semibold text-xs">{n.title}</p>
                                            <p className="text-xs mt-0.5 line-clamp-2">{n.message}</p>
                                        </button>
                                    ))
                                )}
                            </div>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onHelp}
                        className={dashboardIconButtonClass}
                        aria-label="Help"
                    >
                        <HelpCircle size={20} className="text-emerald-900" />
                    </button>

                    <div className="relative flex items-center" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setShowProfileMenu((open) => !open)}
                            className={dashboardProfileTriggerClass}
                            aria-expanded={showProfileMenu}
                            aria-label={`Profile menu for ${displayName}`}
                        >
                            <span
                                className={`flex items-center justify-center bg-[#154212] text-xs font-bold text-white ${dashboardAvatarClass}`}
                                aria-hidden
                            >
                                {initials}
                            </span>
                            <span className={dashboardProfileNameClass}>
                                {displayName}
                            </span>
                        </button>

                        {showProfileMenu && (
                            <div className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                                <div className="px-3 py-2.5 border-b border-zinc-100 mb-1">
                                    <p className="text-sm font-bold text-[#191c1c] truncate">{fullName}</p>
                                    <p className="text-xs text-[#72796e] truncate">{user?.email}</p>
                                </div>
                                <button
                                    type="button"
                                    onClick={() => runMenuAction(onNavigateSettings)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]"
                                >
                                    <Settings size={18} className="text-[#4e6953]" />
                                    Settings
                                </button>
                                <button
                                    type="button"
                                    onClick={() => runMenuAction(onLogout)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                    <LogOut size={18} />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
}

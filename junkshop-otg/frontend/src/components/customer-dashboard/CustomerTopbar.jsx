import { useCallback, useEffect, useRef, useState } from "react";
import { notificationApi } from "../../services/api";
import { REFRESH_INTERVAL_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    Bell,
    HelpCircle,
    User,
    Settings,
    LogOut,
    UserX,
} from "lucide-react";
import { getUserInitials, getUserFullName } from "../../utils/userDisplay";
import logoImage from "../../assets/junkshop-logo.png";

function getDisplayName(user) {
    if (!user) return "User";
    return user.firstName || "User";
}

export default function CustomerTopbar({
    user,
    showProfileMenu,
    setShowProfileMenu,
    onHelp,
    onViewProfile,
    onAccountSettings,
    onLogout,
    onDeactivate,
}) {
    const menuRef = useRef(null);
    const notifRef = useRef(null);
    const [showNotifs, setShowNotifs] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const displayName = getDisplayName(user);
    const initials = getUserInitials(user);
    const fullName = getUserFullName(user) || displayName;

    useEffect(() => {
        if (!showProfileMenu) return;

        const handlePointerDown = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowProfileMenu(false);
            }
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") setShowProfileMenu(false);
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleEscape);
        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleEscape);
        };
    }, [showProfileMenu, setShowProfileMenu]);

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

    const runMenuAction = (action) => {
        setShowProfileMenu(false);
        action();
    };

    return (
        <header className="bg-white/90 backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b border-zinc-200 shadow-sm h-16 overflow-visible">
            <div className="h-full w-full px-4 sm:px-6 flex items-center justify-between gap-4">
                <div className="flex items-center min-w-0 shrink-0">
                    <img
                        src={logoImage}
                        alt="JunkShop On-The-Go"
                        className="h-10 sm:h-11 w-auto"
                    />
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <div className="relative" ref={notifRef}>
                        <button
                            type="button"
                            onClick={() => setShowNotifs((o) => !o)}
                            className="relative p-2 rounded-full hover:bg-zinc-100 transition-colors"
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
                                            className={`w-full text-left px-3 py-2.5 rounded-xl text-sm mb-1 ${n.read ? "text-[#72796e]" : "bg-emerald-50 font-semibold text-[#191c1c]"
                                                }`}
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
                        className="p-2 rounded-full hover:bg-zinc-100 transition-colors inline-flex"
                        aria-label="Help"
                    >
                        <HelpCircle size={20} className="text-emerald-900" />
                    </button>

                    <div className="relative flex items-center" ref={menuRef}>
                        <button
                            type="button"
                            onClick={() => setShowProfileMenu((open) => !open)}
                            className="flex h-10 items-center gap-2 rounded-full border border-zinc-200 bg-white pl-0.5 pr-2.5 sm:pr-3 hover:bg-zinc-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
                            aria-expanded={showProfileMenu}
                            aria-haspopup="menu"
                        >
                            {user?.avatar ? (
                                <img
                                    alt="Your profile"
                                    className="h-9 w-9 shrink-0 rounded-full object-cover ring-2 ring-white"
                                    src={user.avatar}
                                />
                            ) : (
                                <span
                                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#154212] text-xs font-bold text-white ring-2 ring-white"
                                    aria-hidden
                                >
                                    {initials}
                                </span>
                            )}
                            <span className="hidden sm:inline text-sm font-semibold text-[#191c1c] max-w-[5.5rem] truncate leading-none">
                                {displayName}
                            </span>
                        </button>

                        {showProfileMenu && (
                            <div
                                className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl"
                                role="menu"
                            >
                                <div className="px-3 py-2.5 border-b border-zinc-100 mb-1">
                                    <p className="text-sm font-bold text-[#191c1c] truncate">
                                        {fullName}
                                    </p>
                                    <p className="text-xs text-[#72796e] truncate">{user?.email}</p>
                                </div>

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => runMenuAction(onViewProfile)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]"
                                >
                                    <User size={18} className="text-[#4e6953]" />
                                    View Profile
                                </button>

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => runMenuAction(onAccountSettings)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]"
                                >
                                    <Settings size={18} className="text-[#4e6953]" />
                                    Account Settings
                                </button>

                                <div className="h-px bg-zinc-100 my-1" />

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => runMenuAction(onDeactivate)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-red-600 hover:bg-red-50"
                                >
                                    <UserX size={18} />
                                    Deactivate account
                                </button>

                                <button
                                    type="button"
                                    role="menuitem"
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

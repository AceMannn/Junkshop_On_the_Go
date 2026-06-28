import { useEffect, useRef } from "react";
import {
    HelpCircle,
    User,
    Settings,
    LogOut,
    UserX,
    Recycle,
} from "lucide-react";
import { getUserInitials, getUserFullName } from "../../utils/userDisplay";
import { formatPoints } from "../../utils/pickupPoints";
import logoImage from "../../assets/junkshop-logo.png";
import DashboardNotificationMenu from "../dashboard/DashboardNotificationMenu";
import { isCustomerNotificationNavigable } from "../../utils/notificationNavigation";
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
    onNotificationNavigate,
    onOpenPointsWallet,
}) {
    const menuRef = useRef(null);
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
                    <button
                        type="button"
                        onClick={onOpenPointsWallet}
                        className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 hover:border-amber-300 transition-colors"
                        title="View recycling points"
                    >
                        <Recycle size={14} />
                        {formatPoints(user?.recyclingPoints ?? 0)} pts
                    </button>

                    <DashboardNotificationMenu
                        isNavigable={isCustomerNotificationNavigable}
                        onNavigate={(notification) => {
                            onNotificationNavigate?.(notification);
                        }}
                    />

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
                            aria-haspopup="menu"
                            aria-label={`Profile menu for ${displayName}`}
                        >
                            {user?.avatar ? (
                                <img
                                    alt="Your profile"
                                    className={`${dashboardAvatarClass} object-cover`}
                                    src={user.avatar}
                                />
                            ) : (
                                <span
                                    className={`flex items-center justify-center bg-[#154212] text-xs font-bold text-white ${dashboardAvatarClass}`}
                                    aria-hidden
                                >
                                    {initials}
                                </span>
                            )}
                            <span className={dashboardProfileNameClass}>
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
                                    Settings
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

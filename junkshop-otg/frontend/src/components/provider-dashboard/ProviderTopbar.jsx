import { useEffect, useRef } from "react";
import { HelpCircle, Lock, LogOut, Store, User, UserX } from "lucide-react";
import { getUserInitials, getUserFullName } from "../../utils/userDisplay";
import logoImage from "../../assets/junkshop-logo.png";
import DashboardNotificationMenu, { getPickupRequestId } from "../dashboard/DashboardNotificationMenu";
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
    onViewProfile,
    onNavigateShopSettings,
    onNavigateAccountSettings,
    onLogout,
    onDeactivate,
    onNotificationNavigate,
}) {
    const menuRef = useRef(null);
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
                    <DashboardNotificationMenu
                        onNavigate={(notification) => {
                            const pickupId = getPickupRequestId(notification);
                            if (pickupId) {
                                onNotificationNavigate?.(pickupId);
                            }
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
                            <div
                                className="absolute right-0 top-full z-50 mt-2 w-60 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl"
                                role="menu"
                            >
                                <div className="px-3 py-2.5 border-b border-zinc-100 mb-1">
                                    <p className="text-sm font-bold text-[#191c1c] truncate">{fullName}</p>
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
                                    onClick={() => runMenuAction(onNavigateShopSettings)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]"
                                >
                                    <Store size={18} className="text-[#4e6953]" />
                                    Shop Settings
                                </button>

                                <button
                                    type="button"
                                    role="menuitem"
                                    onClick={() => runMenuAction(onNavigateAccountSettings)}
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold text-[#191c1c] hover:bg-[#f3f4f3]"
                                >
                                    <Lock size={18} className="text-[#4e6953]" />
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

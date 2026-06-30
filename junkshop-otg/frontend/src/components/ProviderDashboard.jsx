import { useCallback, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { AlertTriangle, CheckCircle, Info, XCircle } from "lucide-react";
import { authApi } from "../services/api";
import ProviderPickupRequests from "./provider-dashboard/ProviderPickupRequests";
import ProviderTopbar from "./provider-dashboard/ProviderTopbar";
import HelpModal from "./ui/HelpModal";
import ProviderSidebar, { ProviderMobileNav } from "./provider-dashboard/ProviderSidebar";
import ProviderOverviewTab from "./provider-dashboard/ProviderOverviewTab";
import ProviderMaterialsTab from "./provider-dashboard/ProviderMaterialsTab";
import ProviderAvailabilityTab from "./provider-dashboard/ProviderAvailabilityTab";
import ProviderSettingsTab from "./provider-dashboard/ProviderSettingsTab";
import ProviderTransactionsTab from "./provider-dashboard/ProviderTransactionsTab";
import ProviderVerificationTab from "./provider-dashboard/ProviderVerificationTab";
import ProfileCompletionBanner from "./ui/ProfileCompletionBanner";
import VerificationStatusBanner from "./ui/VerificationStatusBanner";
import {
    ViewProfilePage,
    AccountSettingsPage,
    DeactivateAccountModal,
} from "./customer-dashboard/CustomerAccountViews";
import { dashboardMainPaddingClass } from "./dashboard/dashboardTopbarUi";
import { buildProviderPath, parseProviderPath } from "../utils/dashboardRoutes";
import { getProviderNotificationTarget } from "../utils/notificationNavigation";

function readSidebarPinnedPreference(key) {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(key) === "true";
}

function saveSidebarPinnedPreference(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, String(value));
}

const TOAST_STYLES = {
    success: {
        wrapper: "bg-emerald-50 border-emerald-200 text-emerald-800",
        icon: CheckCircle,
        iconClass: "text-emerald-600",
    },
    warning: {
        wrapper: "bg-amber-50 border-amber-200 text-amber-900",
        icon: AlertTriangle,
        iconClass: "text-amber-600",
    },
    error: {
        wrapper: "bg-red-50 border-red-200 text-red-800",
        icon: XCircle,
        iconClass: "text-red-600",
    },
    info: {
        wrapper: "bg-sky-50 border-sky-200 text-sky-800",
        icon: Info,
        iconClass: "text-sky-600",
    },
};

function inferToastType(message) {
    const text = String(message || "").toLowerCase();
    if (/(could not|failed|error|not found|server|expired|cannot reach|too many)/.test(text)) {
        return "error";
    }
    if (/(please|required|enter|add|invalid|missing|complete|security|before|cannot|must)/.test(text)) {
        return "warning";
    }
    if (/(loading|sent|check|review)/.test(text)) {
        return "info";
    }
    return "success";
}

export default function ProviderDashboard({ onLogout, user, onUserUpdate }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [showToast, setShowToast] = useState(false);
    const [passwordNoticeShown, setPasswordNoticeShown] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [focusRequestId, setFocusRequestId] = useState(null);
    const [accountView, setAccountView] = useState(null);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(() =>
        readSidebarPinnedPreference("provider-sidebar-pinned")
    );

    useEffect(() => {
        const path = location.pathname.replace(/\/+$/, "");
        if (path === "/provider") {
            navigate("/provider/dashboard", { replace: true });
            return;
        }

        const parsed = parseProviderPath(location.pathname);
        setActiveTab(parsed.tab);
        setAccountView(parsed.accountView);

        if (location.state?.focusRequestId) {
            setFocusRequestId(location.state.focusRequestId);
        }
    }, [location.pathname, location.state, navigate]);

    const refreshUser = useCallback(async () => {
        try {
            const { user: fresh } = await authApi.me();
            onUserUpdate?.(fresh);
        } catch {
            /* ignore */
        }
    }, [onUserUpdate]);

    const handleNavigate = (tabId) => {
        navigate(buildProviderPath({ tab: tabId }));
    };

    const openAccountView = (view) => {
        navigate(buildProviderPath({ accountView: view }));
    };

    const handleDeactivateConfirm = () => {
        setShowDeactivateModal(false);
        showNotification("Account deactivated.");
        onLogout();
    };

    const handleNotificationNavigate = (notification) => {
        const target = getProviderNotificationTarget(notification);
        if (!target) return;

        if (target.focusRequestId) {
            navigate(buildProviderPath({ tab: "requests" }), {
                state: { focusRequestId: target.focusRequestId },
            });
            return;
        }

        navigate(buildProviderPath({ tab: target.tab }));
    };

    const showNotification = (message, type) => {
        setToastMessage(message);
        setToastType(type || inferToastType(message));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
    };

    const sidebarOffset = sidebarPinned ? "14rem" : "5rem";

    const handleSidebarPinChange = (value) => {
        setSidebarPinned(value);
        saveSidebarPinnedPreference("provider-sidebar-pinned", value);
    };

    useEffect(() => {
        if (!user?.passwordNeedsUpdate || passwordNoticeShown) return;
        const noticeTimer = setTimeout(() => {
            setToastMessage(
                user.passwordSecurityMessage ||
                    "For your security, please update your password to meet the latest requirements."
            );
            setToastType("warning");
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3200);
            setPasswordNoticeShown(true);
        }, 0);

        return () => clearTimeout(noticeTimer);
    }, [passwordNoticeShown, user?.passwordNeedsUpdate, user?.passwordSecurityMessage]);

    const toastStyle = TOAST_STYLES[toastType] || TOAST_STYLES.success;
    const ToastIcon = toastStyle.icon;

    return (
        <div
            className="min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans overflow-x-hidden"
            style={{ "--dashboard-sidebar-offset": sidebarOffset }}
        >
            <ProviderTopbar
                user={user}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                onHelp={() => setShowHelp(true)}
                onViewProfile={() => openAccountView("profile")}
                onNavigateShopSettings={() => handleNavigate("settings")}
                onNavigateAccountSettings={() => openAccountView("accountSettings")}
                onLogout={onLogout}
                onDeactivate={() => {
                    setShowProfileMenu(false);
                    setShowDeactivateModal(true);
                }}
                onNotificationNavigate={handleNotificationNavigate}
            />

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                onContact={() => {
                    window.location.href = "mailto:hello@junkshop-otg.ph";
                }}
            />

            <ProviderSidebar
                activeTab={activeTab}
                onNavigate={handleNavigate}
                pinned={sidebarPinned}
                onPinnedChange={handleSidebarPinChange}
            />

            <main className="md:pl-[var(--dashboard-sidebar-offset)] pt-16 min-h-screen pb-24 md:pb-8 transition-[padding] duration-300">
                <div className={dashboardMainPaddingClass}>
                    {showToast && (
                        <div className={`fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 border px-4 py-3 sm:px-5 rounded-xl shadow-lg max-w-md sm:ml-auto ${toastStyle.wrapper}`}>
                            <ToastIcon size={20} className={`${toastStyle.iconClass} shrink-0`} />
                            <p className="text-sm font-semibold">{toastMessage}</p>
                        </div>
                    )}

                    {!accountView && (
                        <>
                            {activeTab !== "verification" && (
                                <VerificationStatusBanner
                                    user={user}
                                    className="mb-5 sm:mb-6"
                                    onGoVerification={() => handleNavigate("verification")}
                                />
                            )}
                            {activeTab !== "settings" && (
                                <ProfileCompletionBanner
                                    user={user}
                                    role="provider"
                                    onGoSettings={() => handleNavigate("settings")}
                                    className="mb-5 sm:mb-6"
                                />
                            )}
                        </>
                    )}

                    {accountView === "profile" && (
                        <ViewProfilePage
                            user={user}
                            onBack={() => navigate(buildProviderPath({ tab: activeTab }))}
                            onUserUpdate={onUserUpdate}
                            onSaveSuccess={() =>
                                showNotification("Profile updated successfully")
                            }
                        />
                    )}

                    {accountView === "accountSettings" && (
                        <AccountSettingsPage
                            user={user}
                            variant="provider"
                            onBack={() => navigate(buildProviderPath({ tab: activeTab }))}
                            onNotify={showNotification}
                            onUserUpdate={onUserUpdate}
                        />
                    )}

                    {!accountView && activeTab === "dashboard" && (
                        <ProviderOverviewTab user={user} onNavigate={handleNavigate} />
                    )}
                    {!accountView && activeTab === "materials" && (
                        <ProviderMaterialsTab
                            onNotify={showNotification}
                            onRefreshProfile={refreshUser}
                        />
                    )}
                    {!accountView && activeTab === "availability" && (
                        <ProviderAvailabilityTab
                            user={user}
                            onNotify={showNotification}
                            onRefreshProfile={refreshUser}
                        />
                    )}
                    {!accountView && activeTab === "requests" && (
                        <ProviderPickupRequests
                            focusRequestId={focusRequestId}
                            onFocusHandled={() => setFocusRequestId(null)}
                        />
                    )}
                    {!accountView && activeTab === "transactions" && (
                        <ProviderTransactionsTab onNotify={showNotification} />
                    )}
                    {!accountView && activeTab === "verification" && (
                        <ProviderVerificationTab
                            user={user}
                            onNotify={showNotification}
                            onUserUpdate={onUserUpdate}
                        />
                    )}
                    {!accountView && activeTab === "settings" && (
                        <ProviderSettingsTab
                            user={user}
                            onNotify={showNotification}
                            onUserUpdate={onUserUpdate}
                        />
                    )}
                </div>
            </main>

            <ProviderMobileNav activeTab={activeTab} onNavigate={handleNavigate} />

            <DeactivateAccountModal
                isOpen={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={handleDeactivateConfirm}
            />
        </div>
    );
}

import { useCallback, useState } from "react";
import { CheckCircle } from "lucide-react";
import { authApi } from "../services/api";
import ProviderPickupRequests from "./provider-dashboard/ProviderPickupRequests";
import ProviderTopbar from "./provider-dashboard/ProviderTopbar";
import HelpModal from "./ui/HelpModal";
import ProviderSidebar, { ProviderMobileNav } from "./provider-dashboard/ProviderSidebar";
import ProviderOverviewTab from "./provider-dashboard/ProviderOverviewTab";
import ProviderMaterialsTab from "./provider-dashboard/ProviderMaterialsTab";
import ProviderPricesTab from "./provider-dashboard/ProviderPricesTab";
import ProviderAvailabilityTab from "./provider-dashboard/ProviderAvailabilityTab";
import ProviderSettingsTab from "./provider-dashboard/ProviderSettingsTab";
import ProviderTransactionsTab from "./provider-dashboard/ProviderTransactionsTab";
import ProfileCompletionBanner from "./ui/ProfileCompletionBanner";
import { dashboardMainPaddingClass } from "./dashboard/dashboardTopbarUi";

export default function ProviderDashboard({ onLogout, user, onUserUpdate }) {
    const [activeTab, setActiveTab] = useState("dashboard");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const refreshUser = useCallback(async () => {
        try {
            const { user: fresh } = await authApi.me();
            onUserUpdate?.(fresh);
        } catch {
            /* ignore */
        }
    }, [onUserUpdate]);

    const handleNavigate = (tabId) => {
        setActiveTab(tabId);
        setShowProfileMenu(false);
    };

    const showNotification = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
    };

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans overflow-x-hidden">
            <ProviderTopbar
                user={user}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                onHelp={() => setShowHelp(true)}
                onNavigateSettings={() => handleNavigate("settings")}
                onLogout={onLogout}
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
                user={user}
            />

            <main className="lg:pl-56 pt-16 min-h-screen pb-24 lg:pb-8">
                <div className={dashboardMainPaddingClass}>
                    {showToast && (
                        <div className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 sm:px-5 rounded-xl shadow-lg max-w-md sm:ml-auto">
                            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                            <p className="text-sm font-semibold">{toastMessage}</p>
                        </div>
                    )}

                    <ProfileCompletionBanner
                        user={user}
                        role="provider"
                        onGoSettings={() => handleNavigate("settings")}
                        className="mb-5 sm:mb-6"
                    />

                    {activeTab === "dashboard" && (
                        <ProviderOverviewTab onNavigate={handleNavigate} />
                    )}
                    {activeTab === "materials" && (
                        <ProviderMaterialsTab
                            onNotify={showNotification}
                            onRefreshProfile={refreshUser}
                        />
                    )}
                    {activeTab === "prices" && (
                        <ProviderPricesTab onNotify={showNotification} />
                    )}
                    {activeTab === "availability" && (
                        <ProviderAvailabilityTab
                            user={user}
                            onNotify={showNotification}
                            onRefreshProfile={refreshUser}
                        />
                    )}
                    {activeTab === "requests" && <ProviderPickupRequests />}
                    {activeTab === "transactions" && (
                        <ProviderTransactionsTab onNotify={showNotification} />
                    )}
                    {activeTab === "settings" && (
                        <ProviderSettingsTab
                            user={user}
                            onNotify={showNotification}
                            onUserUpdate={onUserUpdate}
                        />
                    )}
                </div>
            </main>

            <ProviderMobileNav activeTab={activeTab} onNavigate={handleNavigate} />
        </div>
    );
}

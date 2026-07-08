import { useState, useMemo, useCallback, useEffect, Fragment } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
    AlertTriangle,
    LayoutDashboard,
    History,
    Heart,
    Search,
    Map,
    Store,
    BookOpen,
    Recycle,
    Coins,
    MapPin,
    ReceiptText,
    ChevronRight,
    Download,
    CalendarDays,
    CheckCircle,
    Info,
    Truck,
    MoreHorizontal,
    Pin,
    PinOff,
    XCircle,
} from "lucide-react";
import CustomerPickupsTab from "./customer-dashboard/CustomerPickupsTab";
import ProfileCompletionBanner from "./ui/ProfileCompletionBanner";
import { dashboardMainPaddingClass } from "./dashboard/dashboardTopbarUi";
import { useCatalogJunkshops } from "../hooks/useCatalogData";
import { useFavorites } from "../hooks/useFavorites";
import { authApi, domainApi } from "../services/api";
import { normalizeTransaction } from "../utils/catalogMappers";
import { matchesPrefixWordSearch } from "../utils/searchFilter";
import { isFavoriteShopId } from "../utils/favorites";
import {
    DashboardPanelShell,
    OVERVIEW_PANELS,
} from "./customer-dashboard/CustomerOverviewPanels";
import CustomerSellRecyclablesSection from "./customer-dashboard/CustomerSellRecyclablesSection";
import CustomerTopbar from "./customer-dashboard/CustomerTopbar";
import HelpModal from "./ui/HelpModal";
import ReportTransactionModal from "./ui/ReportTransactionModal";
import EmptyState from "./ui/EmptyState";
import StatCard from "./ui/StatCard";
import ShopRating from "./ui/ShopRating";
import CustomerSettingsPage from "./customer-dashboard/CustomerSettingsPage";
import { DeactivateAccountModal } from "./customer-dashboard/CustomerAccountViews";
import { hasValidPhilippinePhone, TRANSACTION_PHONE_SETTINGS_MESSAGE } from "../utils/phone";
import {
    hasConfirmedCustomerAddress,
    TRANSACTION_ADDRESS_SETTINGS_MESSAGE,
} from "../utils/transactionGates";
import CustomerShopProfile from "./customer-dashboard/CustomerShopProfile";
import CustomerShopSummaryCard from "./customer-dashboard/CustomerShopSummaryCard";
import CustomerPointsWallet from "./customer-dashboard/CustomerPointsWallet";
import {
    buildCustomerPath,
    parseCustomerPath,
    parseCustomerSettingsTab,
} from "../utils/dashboardRoutes";
import { getCustomerNotificationTarget } from "../utils/notificationNavigation";
import { formatPoints } from "../utils/pickupPoints";

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

function SidebarPesoIcon({ size = 20 }) {
    return (
        <span
            className="inline-flex shrink-0 items-center justify-center font-semibold leading-none select-none"
            style={{
                width: size,
                height: size,
                fontSize: Math.round(size * 0.8),
            }}
            aria-hidden
        >
            ₱
        </span>
    );
}

const navTabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "pickups", label: "Pickups", icon: Truck },
    { id: "favorites", label: "Favorites", icon: Heart },
    { id: "history", label: "History", icon: History },
];

const sidebarNavItems = [
    { kind: "panel", id: "junkshops", label: "Find a Shop", icon: MapPin, primary: true },
    { kind: "tab", id: "overview", label: "Overview", icon: LayoutDashboard },
    { kind: "tab", id: "pickups", label: "Pickups", icon: Truck },
    { kind: "panel", id: "prices", label: "Prices", icon: SidebarPesoIcon },
    { kind: "panel", id: "guide", label: "Guide", icon: BookOpen },
    { kind: "tab", id: "favorites", label: "Favorites", icon: Heart },
    { kind: "tab", id: "history", label: "History", icon: History },
];

const primarySidebarButtonClass =
    "w-full flex items-center rounded-2xl border border-[#154212] bg-[#154212] py-2 text-sm font-semibold text-white shadow-sm hover:bg-emerald-900 hover:shadow transition-colors";

function readSidebarPinnedPreference(key) {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem(key) === "true";
}

function saveSidebarPinnedPreference(key, value) {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, String(value));
}

const SHOP_IMAGE =
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop";

function getTimeGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
}

const ACTIVITY_STYLES = [
    { icon: Recycle,     iconBg: "bg-emerald-100", iconText: "text-emerald-700" },
    { icon: ReceiptText, iconBg: "bg-blue-100",     iconText: "text-blue-700"   },
    { icon: Store,       iconBg: "bg-amber-100",    iconText: "text-amber-700"  },
];

export default function CustomerDashboard({
    onLogout,
    user,
    onUserUpdate,
    onBookMaterial,
    onOpenAllPrices,
    pickupWizardPrefill,
    pickupWizardSignal,
}) {
    const { shops, loading: shopsLoading } = useCatalogJunkshops({ partnersOnly: true });
    const { favoriteIds, loading: favoritesLoading, toggleFavorite } = useFavorites();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState("overview");
    const [overviewPanel, setOverviewPanel] = useState(null);
    const [junkshopFocusId, setJunkshopFocusId] = useState(null);
    const [routeToShopId, setRouteToShopId] = useState(null);
    const [accountView, setAccountView] = useState(null);
    const [settingsTab, setSettingsTab] = useState("profile");
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [sidebarPinned, setSidebarPinned] = useState(() =>
        readSidebarPinnedPreference("customer-sidebar-pinned")
    );
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [openPickupWizard, setOpenPickupWizard] = useState(false);
    const [focusPickupId, setFocusPickupId] = useState(null);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [toastType, setToastType] = useState("success");
    const [passwordNoticeShown, setPasswordNoticeShown] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showPointsWallet, setShowPointsWallet] = useState(false);
    const [pickupsTabMounted, setPickupsTabMounted] = useState(
        () => activeTab === "pickups"
    );
    const [shopProfile, setShopProfile] = useState(null);
    const [shopProfileBackLabel, setShopProfileBackLabel] = useState("Back");

    useEffect(() => {
        if (activeTab === "pickups") {
            setPickupsTabMounted(true);
        }
    }, [activeTab]);

    useEffect(() => {
        const path = location.pathname.replace(/\/+$/, "");
        if (path === "/customer") {
            navigate("/customer/overview", { replace: true });
            return;
        }

        if (path === "/customer/account/profile") {
            navigate(buildCustomerPath({ accountView: "settings" }), { replace: true });
            return;
        }

        const parsed = parseCustomerPath(location.pathname);
        setActiveTab(parsed.tab);
        setOverviewPanel(parsed.panel);
        setAccountView(parsed.accountView);
        setSettingsTab(
            parsed.accountView === "settings"
                ? parseCustomerSettingsTab(location.search) || parsed.settingsTab
                : "profile"
        );
        setJunkshopFocusId(parsed.junkshopFocusId);
        setRouteToShopId(location.state?.routeToShopId || null);

        if (parsed.shopId) {
            const found = shops.find(
                (shop) =>
                    String(shop.id) === parsed.shopId ||
                    String(shop._id) === parsed.shopId
            );
            setShopProfile(found || null);
            setShopProfileBackLabel(location.state?.backLabel || "Back");
        } else {
            setShopProfile(null);
        }

        if (location.state?.focusPickupId) {
            const pickupId = location.state.focusPickupId;
            setPickupsTabMounted(true);
            setFocusPickupId(pickupId);

            const { focusPickupId: _consumed, ...restState } = location.state;
            navigate(location.pathname, {
                replace: true,
                state: Object.keys(restState).length > 0 ? restState : undefined,
            });
        }

        if (parsed.tab === "pickups") {
            setPickupsTabMounted(true);
            if (location.state?.openWizard) {
                setOpenPickupWizard(
                    hasValidPhilippinePhone(user?.phone) && hasConfirmedCustomerAddress(user)
                );
            }
        }

        if (location.state?.openWizard && (!hasValidPhilippinePhone(user?.phone) || !hasConfirmedCustomerAddress(user))) {
            setOpenPickupWizard(false);
        }
    }, [location.pathname, location.search, location.state, shops, navigate, user?.phone, user?.address, user?.addressConfirmed, user?.location]);

    const showNotification = (message, type) => {
        setToastMessage(message);
        setToastType(type || inferToastType(message));
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
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

    const openOverviewPanel = (panelId, shopId = null) => {
        navigate(
            buildCustomerPath({
                panel: panelId,
                junkshopFocusId: shopId,
            })
        );
    };

    const closeOverviewPanel = () => {
        navigate(buildCustomerPath({ tab: "overview" }));
    };

    const openShopProfile = (shop, backLabel = "Back to Find a Shop") => {
        const shopId = shop?.id || shop?._id;
        if (!shopId) return;
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
        navigate(buildCustomerPath({ shopId }), {
            state: {
                backLabel,
                returnTo: location.pathname,
            },
        });
    };

    const closeShopProfile = () => {
        navigate(location.state?.returnTo || buildCustomerPath({ tab: "overview" }));
    };

    const handleTabChange = (tabId) => {
        navigate(buildCustomerPath({ tab: tabId }));
    };

    const requireTransactionProfile = () => {
        if (!hasValidPhilippinePhone(user?.phone)) {
            showNotification(TRANSACTION_PHONE_SETTINGS_MESSAGE);
            openSettings("profile");
            return false;
        }
        if (!hasConfirmedCustomerAddress(user)) {
            showNotification(TRANSACTION_ADDRESS_SETTINGS_MESSAGE);
            openSettings("profile");
            return false;
        }
        return true;
    };

    const openPickupsTab = (withWizard = false) => {
        if (withWizard && !requireTransactionProfile()) return;
        navigate(buildCustomerPath({ tab: "pickups" }), {
            state: withWizard ? { openWizard: true } : undefined,
        });
    };

    const handleNotificationNavigate = (notification) => {
        const target = getCustomerNotificationTarget(notification);
        if (!target) return;

        setPickupsTabMounted(true);
        navigate(buildCustomerPath({ tab: "pickups" }), {
            state: { focusPickupId: target.focusPickupId },
        });
    };

    const openSettings = (tab = "profile") => {
        navigate(buildCustomerPath({ accountView: "settings", settingsTab: tab }));
    };

    const refreshUser = useCallback(async () => {
        try {
            const { user: fresh } = await authApi.me();
            onUserUpdate?.(fresh);
        } catch {
            /* ignore */
        }
    }, [onUserUpdate]);

    const handleDeactivateConfirm = () => {
        setShowDeactivateModal(false);
        showNotification("Account deactivated.");
        onLogout();
    };

    const [historyDateFrom, setHistoryDateFrom] = useState("");
    const [historyDateTo, setHistoryDateTo] = useState("");

    const loadHistory = useCallback(async () => {
        try {
            setHistoryLoading(true);
            const { transactions } = await domainApi.getTransactions({
                from: historyDateFrom || undefined,
                to: historyDateTo || undefined,
            });
            setHistoryRows((transactions || []).map((row) => normalizeTransaction(row, 'customer')));
        } catch {
            setHistoryRows([]);
        } finally {
            setHistoryLoading(false);
        }
    }, [historyDateFrom, historyDateTo]);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    useEffect(() => {
        if (activeTab === "history") {
            loadHistory();
        }
    }, [activeTab, loadHistory]);

    const handleToggleFavorite = (shopId) => {
        toggleFavorite(shopId);
    };

    const openShopRoute = (shop) => {
        if (!shop?.id) return;
        navigate(
            buildCustomerPath({
                panel: "junkshops",
                junkshopFocusId: shop.id,
            }),
            { state: { routeToShopId: shop.id } }
        );
    };

    const isSidePanelOpen = !accountView && (overviewPanel !== null || shopProfile !== null);
    const sidebarOffset = sidebarPinned ? "14rem" : "5rem";

    const handleSidebarPinChange = (value) => {
        setSidebarPinned(value);
        saveSidebarPinnedPreference("customer-sidebar-pinned", value);
    };

    useEffect(() => {
        if (!isSidePanelOpen) return;
        const html = document.documentElement;
        const prevOverflow = html.style.overflow;
        html.style.overflow = "hidden";
        return () => {
            html.style.overflow = prevOverflow;
        };
    }, [isSidePanelOpen]);

    return (
        <div
            className={`min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans overflow-x-hidden ${
                isSidePanelOpen ? "h-dvh overflow-hidden" : ""
            }`}
            style={{ "--dashboard-sidebar-offset": sidebarOffset }}
        >
            <CustomerTopbar
                user={user}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                onHelp={() => setShowHelp(true)}
                onSettings={() => openSettings("profile")}
                onLogout={onLogout}
                onDeactivate={() => {
                    setShowProfileMenu(false);
                    setShowDeactivateModal(true);
                }}
                onNotificationNavigate={handleNotificationNavigate}
                onOpenPointsWallet={() => setShowPointsWallet(true)}
            />

            <HelpModal
                isOpen={showHelp}
                onClose={() => setShowHelp(false)}
                onContact={() => {
                    window.location.href = "mailto:hello@junkshop-otg.ph";
                }}
            />

            <Sidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                overviewPanel={overviewPanel}
                onOpenPanel={openOverviewPanel}
                pinned={sidebarPinned}
                onPinnedChange={handleSidebarPinChange}
            />

            <main
                className={`md:pl-[var(--dashboard-sidebar-offset)] pt-16 min-h-screen transition-[padding] duration-300 ${
                    isSidePanelOpen ? "bg-white" : "pb-28 md:pb-8"
                }`}
            >
                <div className={isSidePanelOpen ? undefined : dashboardMainPaddingClass}>
                    {showToast && (
                        <div className={`fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 border px-4 py-3 sm:px-5 rounded-xl shadow-lg max-w-md sm:ml-auto ${toastStyle.wrapper}`}>
                            <ToastIcon size={20} className={`${toastStyle.iconClass} shrink-0`} />
                            <p className="text-sm font-semibold">{toastMessage || "Saved successfully"}</p>
                        </div>
                    )}

                    {!accountView && !isSidePanelOpen && (
                        <ProfileCompletionBanner
                            user={user}
                            role="customer"
                            onGoSettings={() => openSettings("profile")}
                            className="mb-5 sm:mb-6"
                        />
                    )}

                    {accountView === "settings" && (
                        <CustomerSettingsPage
                            user={user}
                            initialTab={settingsTab}
                            onBack={() =>
                                navigate(
                                    buildCustomerPath({
                                        tab: activeTab,
                                        panel: overviewPanel,
                                    })
                                )
                            }
                            onNotify={showNotification}
                            onUserUpdate={onUserUpdate}
                            onSaveSuccess={() =>
                                showNotification("Profile updated successfully")
                            }
                        />
                    )}

                    {!accountView && shopProfile && (
                        <CustomerShopProfile
                            key={shopProfile.id || shopProfile._id || shopProfile.name}
                            shop={shopProfile}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                            onBack={closeShopProfile}
                            backLabel={shopProfileBackLabel}
                            onBookPickup={(shop, item) => {
                                if (!requireTransactionProfile()) return;
                                handleTabChange("pickups");
                                onBookMaterial?.({
                                    junkshopId: shop._id || shop.id,
                                    ...(item ? {
                                        name: item.name,
                                        category: item.category,
                                        unit: item.unit,
                                        price: item.price,
                                        catalogId: `shop-${item.name}`,
                                    } : {}),
                                });
                            }}
                        />
                    )}

                    {!accountView && overviewPanel && !shopProfile && (
                        <CustomerSidePanel
                            panelId={overviewPanel}
                            user={user}
                            shops={shops}
                            favoriteIds={favoriteIds}
                            junkshopFocusId={junkshopFocusId}
                            routeToShopId={routeToShopId}
                            onRouteDrawn={() => setRouteToShopId(null)}
                            onClose={closeOverviewPanel}
                            onToggleFavorite={handleToggleFavorite}
                            onNotify={showNotification}
                            onViewShopProfile={(shop) => openShopProfile(shop, "Back to Find a Shop")}
                        />
                    )}

                    {!accountView && !overviewPanel && !shopProfile && activeTab === "overview" && (
                        <OverviewTab
                            user={user}
                            shops={shops}
                            shopsLoading={shopsLoading}
                            favoriteIds={favoriteIds}
                            historyRows={historyRows}
                            onOpenPanel={openOverviewPanel}
                            onGoToHistory={() => handleTabChange("history")}
                            onOpenShopRoute={openShopRoute}
                            onToggleFavorite={handleToggleFavorite}
                            onBookMaterial={(material) => {
                                handleTabChange("pickups");
                                onBookMaterial?.(material);
                            }}
                            onViewAllPrices={() => {
                                onOpenAllPrices?.();
                                openOverviewPanel("prices");
                            }}
                            onViewShopProfile={(shop) => openShopProfile(shop, "Back to Overview")}
                            onBookShop={(shop, prefillMaterial) => {
                                handleTabChange("pickups");
                                onBookMaterial?.({
                                    junkshopId: shop._id || shop.id,
                                    ...(prefillMaterial
                                        ? {
                                              name: prefillMaterial.name,
                                              category: prefillMaterial.category,
                                              unit: prefillMaterial.unit,
                                              catalogId: `shop-${prefillMaterial.name}`,
                                          }
                                        : {}),
                                });
                            }}
                            onOpenPointsWallet={() => setShowPointsWallet(true)}
                        />
                    )}
                    {!accountView && !overviewPanel && !shopProfile && pickupsTabMounted && (
                        <div
                            className={activeTab === "pickups" ? "" : "hidden"}
                            aria-hidden={activeTab !== "pickups"}
                        >
                            <CustomerPickupsTab
                                user={user}
                                onNotify={showNotification}
                                onGoProfile={() => openSettings("profile")}
                                openWizardOnMount={openPickupWizard}
                                focusPickupId={focusPickupId}
                                onFocusHandled={() => setFocusPickupId(null)}
                                onUserUpdate={refreshUser}
                                wizardPrefill={pickupWizardPrefill}
                                openWizardSignal={pickupWizardSignal}
                            />
                        </div>
                    )}
                    {!accountView && !overviewPanel && !shopProfile && activeTab === "history" && (
                        <HistoryTab
                            historyRows={historyRows}
                            loading={historyLoading}
                            dateFrom={historyDateFrom}
                            dateTo={historyDateTo}
                            onDateFromChange={setHistoryDateFrom}
                            onDateToChange={setHistoryDateTo}
                            onRefresh={loadHistory}
                            onNotify={showNotification}
                        />
                    )}
                    {!accountView && !overviewPanel && !shopProfile && activeTab === "favorites" && (
                        <FavoritesTab
                            shops={shops}
                            shopsLoading={shopsLoading}
                            favoriteIds={favoriteIds}
                            favoritesLoading={favoritesLoading}
                            onToggleFavorite={handleToggleFavorite}
                            onFindShops={() => openOverviewPanel("junkshops")}
                            onViewProfile={(shop) => openShopProfile(shop, "Back to Favorites")}
                            onRouteShop={openShopRoute}
                        />
                    )}
                </div>
            </main>

            {!accountView && !overviewPanel && (
                <MobileNav
                    activeTab={activeTab}
                    setActiveTab={handleTabChange}
                    overviewPanel={overviewPanel}
                    onOpenPanel={openOverviewPanel}
                />
            )}

            <DeactivateAccountModal
                isOpen={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={handleDeactivateConfirm}
            />

            <CustomerPointsWallet
                user={user}
                isOpen={showPointsWallet}
                onClose={() => setShowPointsWallet(false)}
            />
        </div>
    );
}

function Sidebar({ activeTab, setActiveTab, overviewPanel, onOpenPanel, pinned, onPinnedChange }) {
    const sidebarWidthClass = pinned ? "w-56" : "w-20 hover:w-56";
    const labelClass = pinned
        ? "max-w-[10rem] opacity-100"
        : "max-w-0 opacity-0 group-hover:max-w-[10rem] group-hover:opacity-100";
    const itemLayoutClass = pinned
        ? "justify-start"
        : "justify-center group-hover:justify-start";
    const itemPaddingClass = pinned
        ? "px-3"
        : "px-0 group-hover:px-3";
    const primaryPaddingClass = pinned
        ? "px-4"
        : "px-0 group-hover:px-4";
    const gapClass = pinned ? "gap-2.5" : "gap-0 group-hover:gap-2.5";

    return (
        <aside
            className={`group fixed left-0 top-16 h-[calc(100vh-4rem)] ${sidebarWidthClass} overflow-hidden border-r border-zinc-200 bg-zinc-50 hidden md:flex flex-col z-30 transition-[width] duration-300 ease-out`}
        >
            <nav className="overflow-hidden flex flex-col gap-0.5 px-3 pt-3 flex-1">
                {sidebarNavItems.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.kind === "tab"
                            ? activeTab === item.id && !overviewPanel
                            : overviewPanel === item.id;

                    const handleClick = () => {
                        if (item.kind === "tab") {
                            setActiveTab(item.id);
                            return;
                        }
                        onOpenPanel(item.id);
                    };

                    if (item.primary) {
                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={handleClick}
                                title={item.label}
                                className={`${primarySidebarButtonClass} ${itemLayoutClass} ${primaryPaddingClass} ${gapClass} mb-2 min-h-10 whitespace-nowrap overflow-hidden transition-[padding,gap] duration-300 ${
                                    isActive ? "ring-2 ring-emerald-400/80" : ""
                                }`}
                            >
                                <Icon size={20} className="shrink-0" />
                                <span className={`min-w-0 overflow-hidden truncate transition-all duration-200 ${labelClass}`}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={item.id}
                            type="button"
                            onClick={handleClick}
                            title={item.label}
                            className={`flex min-h-11 items-center ${itemLayoutClass} ${gapClass} ${itemPaddingClass} py-2.5 text-sm font-medium transition-[padding,gap,colors] duration-300 text-left rounded-lg whitespace-nowrap overflow-hidden ${isActive
                                ? "text-emerald-800 bg-emerald-100/80"
                                : "text-zinc-600 hover:bg-zinc-100"
                                }`}
                        >
                            <Icon size={20} className="shrink-0" />
                            <span className={`min-w-0 overflow-hidden truncate transition-all duration-200 ${labelClass}`}>
                                {item.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
            <div className="px-3 py-2 flex justify-end">
                <button
                    type="button"
                    onClick={() => onPinnedChange(!pinned)}
                    className="flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-white text-[#42493e] shadow-sm hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800 transition-colors"
                    title={pinned ? "Collapse sidebar" : "Pin sidebar open"}
                    aria-pressed={pinned}
                >
                    {pinned ? <PinOff size={14} fill="currentColor" /> : <Pin size={14} fill="currentColor" />}
                </button>
            </div>
        </aside>
    );
}

const mobileMoreItems = [
    { id: "junkshops", label: "Find a Shop", icon: MapPin },
    { id: "prices", label: "Prices", icon: SidebarPesoIcon },
    { id: "guide", label: "Guide", icon: BookOpen },
];

function MobileNav({ activeTab, setActiveTab, overviewPanel, onOpenPanel }) {
    const [showMore, setShowMore] = useState(false);
    const moreActive = mobileMoreItems.some((item) => overviewPanel === item.id);

    const handleOpenPanel = (panelId) => {
        onOpenPanel?.(panelId);
        setShowMore(false);
    };

    return (
        <>
            {showMore && (
                <button
                    type="button"
                    aria-label="Close menu"
                    className="md:hidden fixed inset-0 z-40 bg-black/20"
                    onClick={() => setShowMore(false)}
                />
            )}

            {showMore && (
                <div className="md:hidden fixed bottom-[4.25rem] left-3 right-3 z-50 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl safe-area-pb">
                    {mobileMoreItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = overviewPanel === item.id;

                        return (
                            <button
                                key={item.id}
                                type="button"
                                onClick={() => handleOpenPanel(item.id)}
                                className={`flex w-full min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "text-[#191c1c] hover:bg-zinc-50"
                                    }`}
                            >
                                <Icon size={20} />
                                {item.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-1 py-2.5 bg-white border-t border-zinc-200 shadow-[0_-4px_12px_rgba(141,170,145,0.15)] z-50 rounded-t-2xl safe-area-pb max-w-lg mx-auto sm:max-w-none sm:mx-0">
                {navTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id && !overviewPanel;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 flex-col items-center justify-center min-h-11 min-w-0 px-1 py-1.5 rounded-xl active:scale-95 transition-transform ${isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "text-zinc-500 hover:text-emerald-600"
                                }`}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] font-medium mt-0.5 truncate max-w-full px-0.5">{tab.label}</span>
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => setShowMore((open) => !open)}
                    className={`flex flex-1 flex-col items-center justify-center min-h-11 min-w-0 px-1 py-1.5 rounded-xl active:scale-95 transition-transform ${moreActive || showMore
                        ? "bg-emerald-100 text-emerald-800"
                        : "text-zinc-500 hover:text-emerald-600"
                        }`}
                >
                    <MoreHorizontal size={20} />
                    <span className="text-[10px] font-medium mt-0.5">More</span>
                </button>
            </nav>
        </>
    );
}

function CustomerSidePanel({
    panelId,
    user,
    shops,
    favoriteIds,
    junkshopFocusId,
    routeToShopId,
    onRouteDrawn,
    onClose,
    onToggleFavorite,
    onNotify,
    onViewShopProfile,
}) {
    if (OVERVIEW_PANELS[panelId]) {
        const { title, Component } = OVERVIEW_PANELS[panelId];

        return (
            <DashboardPanelShell title={title} onClose={onClose}>
                <Component
                    user={user}
                    favoriteIds={favoriteIds}
                    onToggleFavorite={onToggleFavorite}
                    {...(panelId === "junkshops"
                        ? {
                            initialShopId: junkshopFocusId,
                            autoRouteShopId: routeToShopId,
                            onRouteDrawn,
                            onViewProfile: onViewShopProfile,
                        }
                        : {})}
                />
            </DashboardPanelShell>
        );
    }

    return null;
}

function PesoIcon({ size = 18 }) {
    return (
        <span
            className="font-bold leading-none select-none"
            style={{ fontSize: Math.round(size * 0.95) }}
            aria-hidden
        >
            ₱
        </span>
    );
}

function OverviewTab({
    user,
    shops,
    shopsLoading = false,
    favoriteIds,
    historyRows,
    onOpenPanel,
    onGoToHistory,
    onOpenShopRoute,
    onToggleFavorite,
    onBookMaterial,
    onViewAllPrices,
    onViewShopProfile,
    onBookShop,
    onOpenPointsWallet,
}) {
    const welcomeName = user?.firstName || "there";
    const overviewStats = useMemo(() => {
        const totalKg = historyRows.reduce((sum, row) => {
            const match = String(row.weight).match(/[\d.]+/);
            return sum + (match ? Number(match[0]) : 0);
        }, 0);
        const totalEarnings = historyRows.reduce((sum, row) => {
            const num = Number(row.amountValue);
            return sum + (Number.isFinite(num) ? num : 0);
        }, 0);
        const paidTransactions = historyRows.filter((row) => row.isPaidTransaction).length;
        return {
            totalKg: totalKg.toFixed(1),
            totalEarnings: totalEarnings.toFixed(2),
            transactions: paidTransactions,
            points: user?.recyclingPoints ?? 0,
        };
    }, [historyRows, user?.recyclingPoints]);

    const recentActivities = useMemo(
        () =>
            historyRows.slice(0, 3).map((row, index) => ({
                id: row.id,
                material: row.material,
                date: row.date,
                shop: row.shop,
                amount: row.amount,
                weight: row.weight,
                ...ACTIVITY_STYLES[index % ACTIVITY_STYLES.length],
            })),
        [historyRows]
    );

    return (
        <div className="space-y-5 sm:space-y-7 md:space-y-8">
            {/* Mobile: Find a Shop button */}
            <section className="md:hidden">
                <button
                    type="button"
                    onClick={() => onOpenPanel("junkshops")}
                    className={primarySidebarButtonClass}
                >
                    <MapPin size={20} />
                    Find a Shop
                </button>
            </section>

            {/* Welcome banner */}
            <section>
                <div className="rounded-2xl bg-gradient-to-br from-[#154212] via-[#1e5a1a] to-[#3DA35D] p-4 sm:p-5 text-white shadow-[0_4px_20px_rgba(21,66,18,0.22)] relative overflow-hidden">
                    <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute bottom-0 right-8 w-20 h-20 rounded-full bg-white/5 pointer-events-none" />
                    <p className="text-xs sm:text-sm font-medium text-white/70 mb-0.5 relative">
                        {getTimeGreeting()},
                    </p>
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight relative">{welcomeName}!</h1>
                    <p className="mt-1.5 text-xs sm:text-sm text-white/75 relative">
                        {Number(overviewStats.totalKg) > 0
                            ? `You've recycled ${overviewStats.totalKg} kg · ₱${overviewStats.totalEarnings} earned`
                            : "Start recycling to track your impact."}
                    </p>
                </div>
            </section>

            <OverviewQuickAccess onOpenPanel={onOpenPanel} />

            {/* Stats (2×2) + Recent Activities side-by-side */}
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Left: 2×2 stat cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4">
                    <StatCard
                        label="Total Recycled"
                        value={overviewStats.totalKg}
                        unit="kg"
                        icon={Recycle}
                        showHelperIcon={false}
                        accentColor="green"
                    />
                    <StatCard
                        label="Total Earnings"
                        value={`₱${overviewStats.totalEarnings}`}
                        icon={PesoIcon}
                        showHelperIcon={false}
                        accentColor="amber"
                    />
                    <StatCard
                        label="Transactions"
                        value={String(overviewStats.transactions)}
                        icon={ReceiptText}
                        showHelperIcon={false}
                        accentColor="blue"
                    />
                    <StatCard
                        label="Points"
                        value={formatPoints(overviewStats.points)}
                        unit="pts"
                        icon={Coins}
                        showHelperIcon={false}
                        accentColor="amber"
                        onClick={onOpenPointsWallet}
                    />
                </div>

                {/* Right: Recent Activities */}
                <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#191c1c]">Recent Activities</h2>
                        <button
                            type="button"
                            onClick={onGoToHistory}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                            View Full History
                        </button>
                    </div>

                    <div className="flex-1 bg-white rounded-xl border border-zinc-200 shadow-sm divide-y divide-zinc-100">
                        {recentActivities.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-2 p-6 text-center min-h-[140px]">
                                <div className="w-11 h-11 rounded-full bg-emerald-50 flex items-center justify-center">
                                    <ReceiptText size={20} className="text-emerald-600" />
                                </div>
                                <p className="text-sm font-medium text-[#191c1c]">No activity yet</p>
                                <p className="text-xs text-[#72796e] max-w-[220px]">
                                    Completed pickups and paid transactions will appear here.
                                </p>
                            </div>
                        ) : (
                            recentActivities.map((activity) => {
                                const Icon = activity.icon;
                                return (
                                    <button
                                        key={activity.id}
                                        type="button"
                                        onClick={onGoToHistory}
                                        className="w-full p-3 sm:p-4 hover:bg-emerald-50/40 transition-colors text-left group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`${activity.iconBg} p-2.5 rounded-xl shrink-0`}>
                                                <Icon size={18} className={activity.iconText} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h5 className="font-bold text-[#191c1c] text-sm truncate">
                                                    {activity.material}
                                                </h5>
                                                <p className="text-xs text-[#72796e] truncate">
                                                    {activity.date} · {activity.shop}
                                                </p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="font-bold text-emerald-700 text-sm">
                                                    {activity.amount}
                                                </p>
                                                <p className="text-xs text-[#72796e]">
                                                    {activity.weight}
                                                </p>
                                            </div>
                                            <ChevronRight
                                                size={16}
                                                className="text-zinc-300 group-hover:text-emerald-600 shrink-0 transition-colors"
                                            />
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>
            </section>

            {/* Sell your recyclables */}
            <CustomerSellRecyclablesSection
                onViewProfile={onViewShopProfile}
                onBookNow={onBookShop}
            />
        </div>
    );
}

function OverviewQuickAccess({ onOpenPanel }) {
    const items = [
        { id: "prices", label: "Prices", icon: SidebarPesoIcon },
        { id: "guide", label: "Guide", icon: BookOpen },
    ];

    return (
        <section className="md:hidden" aria-label="Quick access">
            <p className="text-xs font-bold uppercase tracking-wider text-[#72796e] mb-3">
                Quick access
            </p>
            <div className="grid grid-cols-2 gap-3">
                {items.map(({ id, label, icon: Icon }) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => onOpenPanel(id)}
                        className="flex flex-col items-center justify-center gap-2 py-4 px-2 bg-white border border-zinc-200 rounded-xl shadow-sm hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors active:scale-[0.98]"
                    >
                        <span className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <Icon size={20} className="text-emerald-800" />
                        </span>
                        <span className="text-xs font-semibold text-[#191c1c]">{label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}

function historyStatusClass(status) {
    const value = String(status || "").toLowerCase();
    if (value === "completed") return "bg-emerald-100 text-emerald-700";
    if (value === "cancelled") return "bg-red-100 text-red-700";
    return "bg-yellow-100 text-yellow-700";
}

function HistoryTab({
    historyRows,
    loading,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onRefresh,
    onNotify,
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showDateFilter, setShowDateFilter] = useState(false);
    const [expandedRowId, setExpandedRowId] = useState(null);
    const [reportRow, setReportRow] = useState(null);

    const toggleRow = (rowId) => {
        setExpandedRowId((current) => (current === rowId ? null : rowId));
    };

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return historyRows.filter((row) => {
            const matchesStatus =
                statusFilter === "all" ||
                row.status.toLowerCase() === statusFilter.toLowerCase();

            if (!query) return matchesStatus;

            return (
                matchesStatus &&
                matchesPrefixWordSearch(
                    [row.date, row.material, row.weight, row.amount, row.shop, row.status],
                    query
                )
            );
        });
    }, [historyRows, search, statusFilter]);

    const totalEarnings = useMemo(() => {
        return filteredRows.reduce((sum, row) => {
            const num = Number(row.amountValue);
            return sum + (Number.isFinite(num) ? num : 0);
        }, 0);
    }, [filteredRows]);

    const totalWeightKg = useMemo(() => {
        return filteredRows.reduce((sum, row) => sum + (row.weightKg || 0), 0);
    }, [filteredRows]);

    const paidTransactionCount = useMemo(
        () => filteredRows.filter((row) => row.isPaidTransaction).length,
        [filteredRows]
    );
    const totalPaidTransactionCount = useMemo(
        () => historyRows.filter((row) => row.isPaidTransaction).length,
        [historyRows]
    );

    const handleExport = () => {
        const header = ["Date", "Material", "Weight", "Amount", "Shop", "Status"];
        const lines = filteredRows.map((row) =>
            [row.date, row.material, row.weight, row.amount, row.shop, row.status]
                .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
                .join(",")
        );
        const csv = [header.join(","), ...lines].join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "recycling-history.csv";
        link.click();
        URL.revokeObjectURL(url);
    };

    const renderExpandedDetails = (row) => (
        <div className="mt-3 rounded-lg border border-emerald-100 bg-emerald-50/60 p-3 text-sm space-y-2">
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Shop</p>
                    <p className="font-medium text-[#191c1c]">{row.shop}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Status</p>
                    <p className="font-medium text-[#191c1c]">{row.status}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Weight</p>
                    <p className="font-medium text-[#191c1c]">{row.weight}</p>
                </div>
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Amount</p>
                    <p className="font-semibold text-emerald-700">{row.amount}</p>
                </div>
            </div>
            {row.historyType === "pickup_cancelled" && (
                <p className="text-xs text-red-700 font-medium">Cancelled pickup — no payment recorded.</p>
            )}
            <p className="text-xs text-[#72796e]">Recorded on {row.date}</p>
        </div>
    );

    const renderRowActions = (row) => (
        <div className="flex items-center justify-end gap-3">
            <button
                type="button"
                onClick={() => toggleRow(row.id)}
                className="text-[#154212] hover:underline text-sm font-semibold"
            >
                {expandedRowId === row.id ? "Hide" : "View"}
            </button>
            {row.canReport ? (
                <button
                    type="button"
                    onClick={() => setReportRow(row)}
                    className="text-red-700 hover:underline text-sm font-semibold"
                >
                    Report
                </button>
            ) : null}
        </div>
    );

    return (
        <div className="space-y-8 pb-24 md:pb-8">
            <ReportTransactionModal
                isOpen={Boolean(reportRow)}
                row={reportRow}
                onClose={() => setReportRow(null)}
                onSuccess={(message) => onNotify?.(message)}
                onError={(message) => onNotify?.(message)}
            />
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1c]">
                    Recycling History
                </h1>
                <p className="text-[#72796e] mt-2">
                    Track your recycling records, paid transactions, and earnings.
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
                    <div className="flex items-center bg-white border border-zinc-200 px-3 py-2 rounded-lg w-full sm:flex-1 sm:min-w-0 sm:max-w-md">
                        <Search size={18} className="text-[#72796e] mr-2 shrink-0" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="outline-none text-sm w-full bg-transparent"
                            placeholder="Search materials or shops..."
                            aria-label="Search recycling history"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowDateFilter((v) => !v)}
                        className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm bg-white hover:bg-zinc-50 transition-colors ${dateFrom || dateTo ? "border-emerald-400 text-emerald-800" : "border-zinc-200"}`}
                    >
                        <CalendarDays size={16} className="text-[#72796e]" />
                        Date
                    </button>

                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="w-full sm:w-auto flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white sm:min-w-[140px]"
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="processing">Processing</option>
                    </select>
                </div>

                <button
                    type="button"
                    onClick={handleExport}
                    disabled={filteredRows.length === 0}
                    className="flex items-center justify-center gap-2 bg-[#154212] text-white px-4 py-2 rounded-lg text-sm hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Download size={16} />
                    Export CSV
                </button>
            </div>

            {showDateFilter && (
                <div className="flex flex-wrap items-end gap-3 p-4 bg-white border border-zinc-200 rounded-xl">
                    <div>
                        <label className="block text-xs font-semibold text-[#72796e] mb-1">From</label>
                        <input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => onDateFromChange(e.target.value)}
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-[#72796e] mb-1">To</label>
                        <input
                            type="date"
                            value={dateTo}
                            onChange={(e) => onDateToChange(e.target.value)}
                            className="border border-zinc-200 rounded-lg px-3 py-2 text-sm"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onRefresh}
                        className="px-4 py-2 rounded-lg bg-[#154212] text-white text-sm font-semibold"
                    >
                        Apply
                    </button>
                    {(dateFrom || dateTo) && (
                        <button
                            type="button"
                            onClick={() => {
                                onDateFromChange("");
                                onDateToChange("");
                                onRefresh();
                            }}
                            className="px-4 py-2 rounded-lg border border-zinc-200 text-sm font-semibold"
                        >
                            Clear
                        </button>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <StatCard
                    layout="horizontal"
                    label="Transactions"
                    value={paidTransactionCount}
                    suffix={
                        <span className="text-xs font-medium text-[#72796e] ml-1">
                            / {totalPaidTransactionCount}
                        </span>
                    }
                    icon={ReceiptText}
                    accentColor="green"
                />
                <StatCard
                    layout="horizontal"
                    label="Earned"
                    value={`₱${totalEarnings.toFixed(2)}`}
                    icon={PesoIcon}
                    accentColor="amber"
                />
                <StatCard
                    layout="horizontal"
                    label="Weight recycled"
                    value={totalWeightKg.toFixed(1)}
                    unit="kg"
                    icon={Recycle}
                    accentColor="teal"
                />
            </div>

            {loading ? (
                <div className="text-center py-16 text-[#72796e] bg-white rounded-xl border border-zinc-200 animate-pulse">
                    Loading history...
                </div>
            ) : filteredRows.length === 0 ? (
                <EmptyState
                    compact
                    icon={ReceiptText}
                    title="No recycling records yet"
                    description="Completed pickups and paid transactions will appear here. You can also adjust your search and date filters."
                    action={
                        onRefresh ? (
                            <button
                                type="button"
                                onClick={onRefresh}
                                className="text-sm font-semibold text-emerald-700 hover:underline"
                            >
                                Refresh
                            </button>
                        ) : null
                    }
                />
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="md:hidden divide-y divide-zinc-100">
                        {filteredRows.map((row) => {
                            const isExpanded = expandedRowId === row.id;

                            return (
                            <div key={row.id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#191c1c]">{row.material}</p>
                                        <p className="text-xs text-[#72796e]">{row.date}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${historyStatusClass(row.status)}`}
                                    >
                                        {row.status}
                                    </span>
                                </div>
                                {!isExpanded && (
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Weight</p>
                                            <p>{row.weight}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Amount</p>
                                            <p className="text-emerald-700 font-semibold">{row.amount}</p>
                                        </div>
                                    </div>
                                )}
                                {isExpanded && renderExpandedDetails(row)}
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <p className="text-[#72796e] truncate">{row.shop}</p>
                                    {renderRowActions(row)}
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    <div className="hidden md:block scroll-x-clean">
                        <table className="w-full text-sm">
                            <thead className="bg-[#f3f4f3] text-[#42493e]">
                                <tr>
                                    <th className="text-left p-3 sm:p-4">Date</th>
                                    <th className="text-left p-3 sm:p-4">Material</th>
                                    <th className="text-left p-3 sm:p-4">Weight</th>
                                    <th className="text-left p-3 sm:p-4">Amount</th>
                                    <th className="text-left p-3 sm:p-4">Shop</th>
                                    <th className="text-left p-3 sm:p-4">Status</th>
                                    <th className="text-right p-3 sm:p-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y">
                                {filteredRows.map((row) => {
                                    const isExpanded = expandedRowId === row.id;

                                    return (
                                    <Fragment key={row.id}>
                                        <tr className="hover:bg-zinc-50">
                                        <td className="p-3 sm:p-4">{row.date}</td>
                                        <td className="p-3 sm:p-4 font-medium">{row.material}</td>
                                        <td className="p-3 sm:p-4">{row.weight}</td>
                                        <td className="p-3 sm:p-4 text-emerald-700 font-semibold">
                                            {row.amount}
                                        </td>
                                        <td className="p-3 sm:p-4">{row.shop}</td>

                                        <td className="p-3 sm:p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${historyStatusClass(row.status)}`}
                                            >
                                                {row.status}
                                            </span>
                                        </td>

                                        <td className="p-3 sm:p-4 text-right">
                                            {renderRowActions(row)}
                                        </td>
                                    </tr>
                                    {isExpanded && (
                                        <tr key={`${row.id}-details`} className="bg-emerald-50/40">
                                            <td colSpan={7} className="p-3 sm:p-4">
                                                {renderExpandedDetails(row)}
                                            </td>
                                        </tr>
                                    )}
                                    </Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function FavoritesTab({
    shops,
    shopsLoading = false,
    favoriteIds,
    favoritesLoading = false,
    onToggleFavorite,
    onFindShops,
    onViewProfile,
    onRouteShop,
}) {
    const favoriteShops = useMemo(
        () => shops.filter((shop) => isFavoriteShopId(shop.id, favoriteIds)),
        [shops, favoriteIds]
    );
    const isLoadingFavorites =
        favoritesLoading || (favoriteIds.length > 0 && shopsLoading && favoriteShops.length === 0);

    return (
        <div className="space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                        Favorite Shops
                    </h1>
                    <p className="text-[#42493e] mt-2 max-w-md">
                        Access your most visited recycling centers and junkshops to manage
                        your sustainability routine.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={onFindShops}
                    className="flex items-center justify-center gap-2 bg-[#154212] text-white px-6 py-3 rounded-xl font-semibold hover:shadow-lg transition-all active:scale-95"
                >
                    <Map size={20} />
                    Find New Centers
                </button>
            </div>

            <div className="grid w-full gap-4 sm:gap-6 grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))]">
                {favoriteShops.map((shop) => (
                    <CustomerShopSummaryCard
                        key={shop.id}
                        shop={shop}
                        isFavorite={true}
                        onToggleFavorite={() => onToggleFavorite(shop.id)}
                        onViewProfile={() => onViewProfile(shop)}
                        onRoute={() => onRouteShop(shop)}
                    />
                ))}

                {isLoadingFavorites && (
                    <div className="col-span-full min-h-[min(50vh,20rem)] flex items-center justify-center">
                        <p className="text-sm text-[#72796e] animate-pulse">Loading favorite shops…</p>
                    </div>
                )}

                {!isLoadingFavorites && favoriteShops.length === 0 && (
                    <div className="col-span-full">
                        <EmptyState
                            icon={Heart}
                            title="No favorite shops yet"
                            description="Tap the heart on any shop in Find Nearby Junkshops to save it here for quick access."
                            action={
                                <button
                                    type="button"
                                    onClick={onFindShops}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#154212] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 transition-colors"
                                >
                                    <Map size={16} />
                                    Find nearby centers
                                </button>
                            }
                        />
                    </div>
                )}
            </div>
        </div>
    );
}


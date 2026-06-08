import { useState, useMemo, useCallback, useEffect } from "react";
import {
    LayoutDashboard,
    History,
    Heart,
    Search,
    Map,
    Store,
    TrendingUp,
    DollarSign,
    BookOpen,
    Leaf,
    Recycle,
    TreePine,
    Star,
    MapPin,
    Navigation,
    Info,
    ReceiptText,
    Download,
    CalendarDays,
    CheckCircle,
    Truck,
} from "lucide-react";
import CustomerPickupsTab from "./customer-dashboard/CustomerPickupsTab";
import ProfileCompletionBanner from "./ui/ProfileCompletionBanner";
import { useCatalogJunkshops } from "../hooks/useCatalogData";
import { useFavorites } from "../hooks/useFavorites";
import { domainApi } from "../services/api";
import { normalizeTransaction } from "../utils/catalogMappers";
import { isFavoriteShopId } from "../utils/favorites";
import {
    DashboardPanelShell,
    LogTripPanel,
    OVERVIEW_PANELS,
} from "./customer-dashboard/CustomerOverviewPanels";
import CustomerSpeedDial from "./customer-dashboard/CustomerSpeedDial";
import { QuickAddPanel, ScanPhotoPanel } from "./customer-dashboard/CustomerFabPanels";
import CustomerTopbar from "./customer-dashboard/CustomerTopbar";
import HelpModal from "./ui/HelpModal";
import EmptyState from "./ui/EmptyState";
import {
    ViewProfilePage,
    AccountSettingsPage,
    DeactivateAccountModal,
} from "./customer-dashboard/CustomerAccountViews";

const navTabs = [
    { id: "overview", label: "Overview", icon: LayoutDashboard },
    { id: "pickups", label: "Pickups", icon: Truck },
    { id: "history", label: "History", icon: History },
    { id: "favorites", label: "Favorites", icon: Heart },
];

const SHOP_IMAGE =
    "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?q=80&w=1000&auto=format&fit=crop";

export default function CustomerDashboard({ onLogout, user, onUserUpdate }) {
    const { shops } = useCatalogJunkshops({ partnersOnly: true });
    const { favoriteIds, toggleFavorite } = useFavorites();
    const [activeTab, setActiveTab] = useState("overview");
    const [overviewPanel, setOverviewPanel] = useState(null);
    const [junkshopFocusId, setJunkshopFocusId] = useState(null);
    const [routeToShopId, setRouteToShopId] = useState(null);
    const [accountView, setAccountView] = useState(null);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [historyRows, setHistoryRows] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [fabOpen, setFabOpen] = useState(false);
    const [openPickupWizard, setOpenPickupWizard] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState("");
    const [showHelp, setShowHelp] = useState(false);

    const openOverviewPanel = (panelId, shopId = null) => {
        setAccountView(null);
        setActiveTab("overview");
        setOverviewPanel(panelId);
        setJunkshopFocusId(shopId || null);
        setFabOpen(false);
    };

    const closeOverviewPanel = () => {
        setOverviewPanel(null);
        setJunkshopFocusId(null);
        setRouteToShopId(null);
    };

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        setAccountView(null);
        setShowProfileMenu(false);
        setOpenPickupWizard(false);
        if (tabId !== "overview") {
            setOverviewPanel(null);
        }
    };

    const openPickupsTab = (withWizard = false) => {
        setAccountView(null);
        setOverviewPanel(null);
        setActiveTab("pickups");
        setOpenPickupWizard(withWizard && Boolean(user?.profileComplete));
        setFabOpen(false);
        if (withWizard && !user?.profileComplete) {
            showNotification("Add your mobile number in Profile Settings before booking a pickup.");
            openAccountView("profile");
        }
    };

    const openAccountView = (view) => {
        setAccountView(view);
        setOverviewPanel(null);
        setShowProfileMenu(false);
    };

    const showNotification = (message) => {
        setToastMessage(message);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3200);
    };

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
            setHistoryRows((transactions || []).map(normalizeTransaction));
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

    const handleLogTrip = async (entry) => {
        try {
            const { transaction } = await domainApi.logTrip({
                junkshopId: entry.junkshopId,
                material: entry.material,
                weight: entry.weightKg,
                pricePerUnit: entry.pricePerUnit,
            });
            setHistoryRows((prev) => [normalizeTransaction(transaction), ...prev]);
            closeOverviewPanel();
            showNotification("Trip logged! Check History to see it.");
        } catch (err) {
            showNotification(err.message || "Could not log trip.");
        }
    };

    const handleQuickAdd = async ({ mode, shopId, shopName, note, amount }) => {
        if (mode === "favorite") {
            showNotification(`${shopName || "Shop"} added to favorites.`);
            return;
        }

        const type = mode === "note" ? "note" : "memo";
        const text = mode === "note" ? note : amount;

        await domainApi.createNote({ type, text, shopId: shopId || "" });
        showNotification(mode === "note" ? "Note saved." : "Transaction memo saved.");
    };

    const handleScanPhoto = async ({ fileName, imageData }) => {
        await domainApi.createNote({
            type: "photo",
            text: fileName,
            imageData,
        });
        showNotification("Photo saved.");
    };

    const openShopRoute = (shop) => {
        if (!shop?.id) return;
        openOverviewPanel("junkshops", shop.id);
        setRouteToShopId(shop.id);
    };

    const showFab =
        activeTab === "overview" && !overviewPanel && !accountView;

    const isOverviewPanelOpen =
        !accountView && activeTab === "overview" && overviewPanel !== null;

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c] font-sans overflow-x-hidden">
            <CustomerTopbar
                user={user}
                showProfileMenu={showProfileMenu}
                setShowProfileMenu={setShowProfileMenu}
                onHelp={() => setShowHelp(true)}
                onViewProfile={() => openAccountView("profile")}
                onAccountSettings={() => openAccountView("settings")}
                onLogout={onLogout}
                onDeactivate={() => {
                    setShowProfileMenu(false);
                    setShowDeactivateModal(true);
                }}
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
                user={user}
                onFindShop={() => openOverviewPanel("junkshops")}
            />

            <main
                className={`lg:pl-56 pt-16 min-h-screen ${
                    isOverviewPanelOpen
                        ? "flex flex-col h-screen overflow-hidden bg-white"
                        : "pb-28 lg:pb-8"
                }`}
            >
                <div
                    className={
                        isOverviewPanelOpen
                            ? "flex flex-1 flex-col min-h-0 w-full"
                            : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-7"
                    }
                >
                    {showToast && (
                        <div className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 sm:px-5 rounded-xl shadow-lg max-w-md sm:ml-auto">
                            <CheckCircle size={20} className="text-emerald-600 shrink-0" />
                            <p className="text-sm font-semibold">{toastMessage || "Saved successfully"}</p>
                        </div>
                    )}

                    {!accountView && (
                        <ProfileCompletionBanner
                            user={user}
                            role="customer"
                            onGoSettings={() => openAccountView("profile")}
                            className="mb-6"
                        />
                    )}

                    {accountView === "profile" && (
                        <ViewProfilePage
                            user={user}
                            onBack={() => setAccountView(null)}
                            onUserUpdate={onUserUpdate}
                            onSaveSuccess={() =>
                                showNotification("Profile updated successfully")
                            }
                        />
                    )}

                    {accountView === "settings" && (
                        <AccountSettingsPage
                            user={user}
                            onBack={() => setAccountView(null)}
                            onNotify={showNotification}
                            onUserUpdate={onUserUpdate}
                        />
                    )}

                    {!accountView && activeTab === "overview" && (
                        <OverviewTab
                            user={user}
                            shops={shops}
                            favoriteIds={favoriteIds}
                            historyRows={historyRows}
                            activePanel={overviewPanel}
                            junkshopFocusId={junkshopFocusId}
                            routeToShopId={routeToShopId}
                            onRouteDrawn={() => setRouteToShopId(null)}
                            onOpenPanel={openOverviewPanel}
                            onClosePanel={closeOverviewPanel}
                            onGoToHistory={() => handleTabChange("history")}
                            onLogTrip={handleLogTrip}
                            onQuickAdd={handleQuickAdd}
                            onScanPhoto={handleScanPhoto}
                            onOpenShopRoute={openShopRoute}
                            onNotify={showNotification}
                            onToggleFavorite={handleToggleFavorite}
                        />
                    )}
                    {!accountView && activeTab === "pickups" && (
                        <CustomerPickupsTab
                            user={user}
                            onNotify={showNotification}
                            onGoProfile={() => openAccountView("profile")}
                            openWizardOnMount={openPickupWizard}
                        />
                    )}
                    {!accountView && activeTab === "history" && (
                        <HistoryTab
                            historyRows={historyRows}
                            loading={historyLoading}
                            dateFrom={historyDateFrom}
                            dateTo={historyDateTo}
                            onDateFromChange={setHistoryDateFrom}
                            onDateToChange={setHistoryDateTo}
                            onRefresh={loadHistory}
                        />
                    )}
                    {!accountView && activeTab === "favorites" && (
                        <FavoritesTab
                            shops={shops}
                            favoriteIds={favoriteIds}
                            onToggleFavorite={handleToggleFavorite}
                            onFindShops={() => openOverviewPanel("junkshops")}
                            onViewShop={(shopId) => openOverviewPanel("junkshops", shopId)}
                            onRouteShop={openShopRoute}
                        />
                    )}
                </div>
            </main>

            <MobileNav activeTab={activeTab} setActiveTab={handleTabChange} />

            {showFab && (
                <CustomerSpeedDial
                    open={fabOpen}
                    onToggle={() => setFabOpen((value) => !value)}
                    onClose={() => setFabOpen(false)}
                    onSelect={(panelId) => {
                        if (panelId === "request-pickup") {
                            openPickupsTab(true);
                        } else {
                            openOverviewPanel(panelId);
                        }
                    }}
                />
            )}

            <DeactivateAccountModal
                isOpen={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={handleDeactivateConfirm}
            />
        </div>
    );
}

function Sidebar({ activeTab, setActiveTab, user, onFindShop }) {
    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 border-r border-zinc-200 bg-zinc-50 hidden lg:flex flex-col z-30">
            <nav className="flex flex-col gap-0.5 p-3 flex-1">
                {navTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-medium transition-colors text-left rounded-lg ${isActive
                                ? "text-emerald-800 bg-emerald-100/80"
                                : "text-zinc-600 hover:bg-zinc-100"
                                }`}
                        >
                            <Icon size={20} />
                            {tab.label}
                        </button>
                    );
                })}
            </nav>

            <div className="p-3 border-t border-zinc-200/80">
                <button
                    type="button"
                    onClick={onFindShop}
                    className="w-full bg-[#154212] text-white py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors"
                >
                    Find a Shop
                </button>
            </div>
        </aside>
    );
}

function MobileNav({ activeTab, setActiveTab }) {
    return (
        <nav className="lg:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-2 py-2.5 bg-white border-t border-zinc-200 shadow-[0_-4px_12px_rgba(141,170,145,0.15)] z-50 rounded-t-2xl safe-area-pb">
            {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;

                return (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-col items-center justify-center min-w-[4.5rem] px-3 py-1.5 rounded-xl active:scale-95 transition-transform ${isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "text-zinc-500 hover:text-emerald-600"
                            }`}
                    >
                        <Icon size={20} />
                        <span className="text-[10px] font-medium mt-0.5">{tab.label}</span>
                    </button>
                );
            })}
        </nav>
    );
}

const FAB_PANEL_CONFIG = {
    "log-trip": {
        title: "Log a Recycling Trip",
        render: (props) => (
            <LogTripPanel shops={props.shops} onSubmit={props.onLogTrip} />
        ),
    },
    "quick-add": {
        title: "Quick Add",
        render: (props) => (
            <QuickAddPanel
                shops={props.shops}
                favoriteIds={props.favoriteIds}
                onToggleFavorite={props.onToggleFavorite}
                onSubmit={async (payload) => {
                    try {
                        await props.onQuickAdd(payload);
                        props.onClosePanel();
                    } catch (err) {
                        props.onNotify(err.message || "Could not save.");
                    }
                }}
            />
        ),
    },
    "scan-photo": {
        title: "Scan / Photo",
        render: (props) => (
            <ScanPhotoPanel
                onSubmit={async (payload) => {
                    try {
                        await props.onScanPhoto(payload);
                        props.onClosePanel();
                    } catch (err) {
                        props.onNotify(err.message || "Could not save photo.");
                    }
                }}
            />
        ),
    },
};

function OverviewTab({
    user,
    shops,
    favoriteIds,
    historyRows,
    activePanel,
    junkshopFocusId,
    routeToShopId,
    onRouteDrawn,
    onOpenPanel,
    onClosePanel,
    onGoToHistory,
    onLogTrip,
    onQuickAdd,
    onScanPhoto,
    onOpenShopRoute,
    onNotify,
    onToggleFavorite,
}) {
    const handleViewAllShops = () => onOpenPanel("junkshops");
    const welcomeName = user?.firstName || "there";

    const nearbyShops = useMemo(
        () =>
            shops
                .filter((shop) => shop.isPartner)
                .slice(0, 3)
                .map((shop) => ({
                    ...shop,
                    location: shop.address,
                    image: SHOP_IMAGE,
                })),
        [shops]
    );

    const overviewStats = useMemo(() => {
        const totalKg = historyRows.reduce((sum, row) => {
            const match = String(row.weight).match(/[\d.]+/);
            return sum + (match ? Number(match[0]) : 0);
        }, 0);
        const totalEarnings = historyRows.reduce((sum, row) => {
            const num = Number(String(row.amount).replace(/[₱,]/g, ""));
            return sum + (Number.isFinite(num) ? num : 0);
        }, 0);
        return {
            totalKg: totalKg.toFixed(1),
            totalEarnings: totalEarnings.toFixed(2),
            transactions: historyRows.length,
            trees: Math.max(1, Math.floor(totalKg / 10)),
        };
    }, [historyRows]);

    const recentActivities = useMemo(
        () =>
            historyRows.slice(0, 3).map((row, index) => ({
                id: row.id,
                material: row.material,
                date: row.date,
                shop: row.shop,
                amount: row.amount,
                weight: row.weight,
                icon: index % 2 === 0 ? Recycle : Store,
            })),
        [historyRows]
    );

    const fabPanel = activePanel && FAB_PANEL_CONFIG[activePanel];
    if (fabPanel) {
        return (
            <DashboardPanelShell title={fabPanel.title} onClose={onClosePanel}>
                {fabPanel.render({
                    shops,
                    favoriteIds,
                    onToggleFavorite,
                    onLogTrip,
                    onQuickAdd,
                    onScanPhoto,
                    onNotify,
                    onClosePanel,
                })}
            </DashboardPanelShell>
        );
    }

    if (activePanel && OVERVIEW_PANELS[activePanel]) {
        const { title, Component } = OVERVIEW_PANELS[activePanel];

        return (
            <DashboardPanelShell title={title} onClose={onClosePanel}>
                <Component
                    favoriteIds={favoriteIds}
                    onToggleFavorite={onToggleFavorite}
                    {...(activePanel === "junkshops"
                        ? {
                            initialShopId: junkshopFocusId,
                            autoRouteShopId: routeToShopId,
                            onRouteDrawn,
                        }
                        : {})}
                />
            </DashboardPanelShell>
        );
    }

    return (
        <div className="space-y-6 sm:space-y-8">
            <section>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Welcome back, {welcomeName}!
                </h1>
                <p className="mt-1.5 text-sm sm:text-base text-[#72796e]">
                    Ready to recycle today?
                </p>
            </section>

            <OverviewQuickAccess onOpenPanel={onOpenPanel} />

            {/* Primary Action Cards */}
            <section className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
                <ActionCard
                    title="Find Nearby Junkshops"
                    subtitle="Locate recycling centers near you"
                    icon={Map}
                    bg="bg-[#2d5a27]"
                    text="text-white"
                    iconBg="bg-[#154212]/30"
                    largeIcon={MapPin}
                    onClick={() => onOpenPanel("junkshops")}
                />

                <ActionCard
                    title="View Material Prices"
                    subtitle="Check current market rates"
                    icon={DollarSign}
                    bg="bg-[#c9e7cc]"
                    text="text-[#062010]"
                    iconBg="bg-[#4a654f]/20"
                    largeIcon={TrendingUp}
                    onClick={() => onOpenPanel("prices")}
                />

                <ActionCard
                    title="Open Recycling Guide"
                    subtitle="Learn how to sort materials"
                    icon={BookOpen}
                    bg="bg-[#e1e3e2]"
                    text="text-[#191c1c]"
                    iconBg="bg-[#2e3d34]/10"
                    largeIcon={Leaf}
                    onClick={() => onOpenPanel("guide")}
                />
            </section>

            {/* Stats */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    label="Total Recycled"
                    value={overviewStats.totalKg}
                    unit="kg"
                    helper="From your logged trips and transactions"
                />

                <StatCard
                    label="Total Earnings"
                    value={`₱${overviewStats.totalEarnings}`}
                    helper="Total from your recycling history"
                />

                <StatCard
                    label="Transactions"
                    value={String(overviewStats.transactions)}
                    helper="Trips recorded in your account"
                />

                <StatCard
                    label="Trees Saved"
                    value={String(overviewStats.trees)}
                    icon={TreePine}
                    helper="Estimated environmental impact"
                />
            </section>

            {/* Nearby + Recent */}
            <section className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
                <div className="xl:col-span-2 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-lg sm:text-xl font-bold text-[#191c1c]">
                            Nearby Junkshops
                        </h2>

                        <button
                            type="button"
                            onClick={handleViewAllShops}
                            className="text-emerald-700 font-semibold flex items-center gap-1 hover:underline"
                        >
                            View All <Navigation size={18} />
                        </button>
                    </div>

                    <div className="scrollbar-clean-h flex gap-4 sm:gap-6 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
                        {nearbyShops.length === 0 ? (
                            <EmptyState
                                compact
                                title="No partner shops yet"
                                description="When a junkshop owner completes their profile, they'll show up here and on the map."
                            />
                        ) : (
                            nearbyShops.map((shop) => (
                                <NearbyShopCard
                                    key={shop.id}
                                    shop={shop}
                                    isFavorite={isFavoriteShopId(shop.id, favoriteIds)}
                                    onToggleFavorite={() => onToggleFavorite(shop.id)}
                                    onViewDetails={() => onOpenPanel("junkshops", shop.id)}
                                    onRoute={() => onOpenShopRoute(shop)}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* Recent Activities */}
                <div className="space-y-4">
                    <h2 className="text-lg sm:text-xl font-bold text-[#191c1c]">
                        Recent Activities
                    </h2>

                    <div className="bg-white rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)] divide-y divide-zinc-100">
                        {recentActivities.length === 0 && (
                            <p className="p-4 text-sm text-[#72796e]">
                                Log a trip to see recent activity here.
                            </p>
                        )}
                        {recentActivities.map((activity) => {
                            const Icon = activity.icon;

                            return (
                                <button
                                    key={activity.id}
                                    className="w-full p-4 hover:bg-zinc-50 transition-colors text-left"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="bg-emerald-100 p-3 rounded-lg">
                                            <Icon size={22} className="text-emerald-700" />
                                        </div>

                                        <div className="flex-1">
                                            <h5 className="font-bold text-[#191c1c]">
                                                {activity.material}
                                            </h5>
                                            <p className="text-xs text-[#72796e]">
                                                {activity.date} • {activity.shop}
                                            </p>
                                        </div>

                                        <div className="text-right">
                                            <p className="font-bold text-emerald-700">
                                                {activity.amount}
                                            </p>
                                            <p className="text-xs text-[#72796e]">
                                                {activity.weight}
                                            </p>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    <button
                        type="button"
                        onClick={onGoToHistory}
                        className="w-full text-center py-2.5 text-sm text-[#72796e] font-medium hover:text-emerald-700 transition-colors"
                    >
                        View Full History
                    </button>
                </div>
            </section>
        </div>
    );
}

function OverviewQuickAccess({ onOpenPanel }) {
    const items = [
        { id: "junkshops", label: "Shops", icon: Map },
        { id: "prices", label: "Prices", icon: DollarSign },
        { id: "guide", label: "Guide", icon: BookOpen },
    ];

    return (
        <section className="lg:hidden" aria-label="Quick access">
            <p className="text-xs font-bold uppercase tracking-wider text-[#72796e] mb-3">
                Quick access
            </p>
            <div className="grid grid-cols-3 gap-3">
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

function ActionCard({
    title,
    subtitle,
    icon,
    bg,
    text,
    iconBg,
    largeIcon,
    onClick,
}) {
    const Icon = icon;
    const LargeIcon = largeIcon;

    return (
        <button
            type="button"
            onClick={onClick}
            className={`group relative overflow-hidden ${bg} ${text} p-5 sm:p-6 rounded-2xl flex flex-col justify-between min-h-[10.5rem] sm:min-h-[11.5rem] cursor-pointer shadow-[0_4px_12px_rgba(141,170,145,0.15)] hover:shadow-md transition-shadow text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700`}
        >
            <div className="flex justify-between items-start">
                <div className={`${iconBg} p-2.5 rounded-lg`}>
                    <Icon size={28} />
                </div>
            </div>

            <div>
                <h3 className="text-xl sm:text-2xl font-bold leading-tight">
                    {title}
                </h3>
                <p className="text-sm opacity-80 mt-1">
                    {subtitle}
                </p>
            </div>

            <div className="absolute -right-5 -bottom-5 opacity-10 group-hover:scale-110 transition-transform">
                <LargeIcon size={120} />
            </div>
        </button>
    );
}

function StatCard({ label, value, unit, icon: Icon, helper }) {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
            <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] sm:text-xs text-[#72796e] uppercase tracking-wider font-semibold">
                    {label}
                </p>

                <Info
                    size={18}
                    className="text-emerald-600 cursor-help shrink-0"
                >
                    <title>{helper}</title>
                </Info>
            </div>

            <p className="text-xl sm:text-2xl font-bold text-emerald-900 flex items-center gap-1.5 flex-wrap">
                {value}
                {unit && <span className="text-xs sm:text-sm font-semibold">{unit}</span>}
                {Icon && <Icon size={20} className="text-emerald-500" />}
            </p>
        </div>
    );
}

function NearbyShopCard({
    shop,
    isFavorite,
    onToggleFavorite,
    onViewDetails,
    onRoute,
}) {
    return (
        <div className="min-w-[280px] sm:min-w-[320px] max-w-[320px] snap-start bg-white rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.15)] overflow-hidden flex-shrink-0 group">
            <div className="h-36 bg-zinc-200 overflow-hidden relative">
                <img
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={shop.image}
                />

                <div className="absolute top-3 right-3">
                    <button
                        type="button"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleFavorite?.();
                        }}
                        className={`bg-white/90 p-2 rounded-full active:scale-90 transition-transform ${isFavorite ? "text-red-600" : "text-zinc-400"
                            }`}
                    >
                        <Heart
                            size={18}
                            fill={isFavorite ? "currentColor" : "none"}
                        />
                    </button>
                </div>
            </div>

            <div className="p-5 space-y-4">
                <div className="flex justify-between items-start gap-3">
                    <div>
                        <h4 className="font-bold text-[#191c1c]">
                            {shop.name}
                        </h4>
                        <p className="text-xs text-[#72796e]">
                            {shop.distance} • {shop.location}
                        </p>
                    </div>

                    <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-1 rounded-full font-bold uppercase">
                        {shop.status}
                    </span>
                </div>

                <div className="flex items-center gap-1 text-emerald-600">
                    <Star size={16} fill="currentColor" />
                    <span className="text-sm font-bold">{shop.rating}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-4">
                    {shop.materials.length > 0 ? (
                        shop.materials.map((material) => (
                            <span
                                key={material}
                                className="bg-[#c9e7cc] text-[#4e6953] px-2 py-0.5 rounded-md text-[10px] font-medium"
                            >
                                {material}
                            </span>
                        ))
                    ) : (
                        <span className="text-[10px] text-[#72796e] italic">
                            Materials not listed yet
                        </span>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onViewDetails}
                        className="py-2 border border-[#154212] text-[#154212] rounded-lg text-sm font-bold hover:bg-[#154212] hover:text-white transition-colors"
                    >
                        View Details
                    </button>

                    <button
                        type="button"
                        onClick={onRoute}
                        className="py-2 border border-zinc-300 text-[#154212] rounded-lg text-sm font-bold hover:bg-zinc-50 transition-colors"
                    >
                        Route
                    </button>
                </div>
            </div>
        </div>
    );
}

function HistoryTab({
    historyRows,
    loading,
    dateFrom,
    dateTo,
    onDateFromChange,
    onDateToChange,
    onRefresh,
}) {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [showDateFilter, setShowDateFilter] = useState(false);

    const filteredRows = useMemo(() => {
        const query = search.trim().toLowerCase();

        return historyRows.filter((row) => {
            const matchesStatus =
                statusFilter === "all" ||
                row.status.toLowerCase() === statusFilter.toLowerCase();

            if (!query) return matchesStatus;

            const haystack = [
                row.date,
                row.material,
                row.weight,
                row.amount,
                row.shop,
                row.status,
            ]
                .join(" ")
                .toLowerCase();

            return matchesStatus && haystack.includes(query);
        });
    }, [historyRows, search, statusFilter]);

    const totalEarnings = useMemo(() => {
        return filteredRows.reduce((sum, row) => {
            const num = Number(String(row.amount).replace(/[₱,]/g, ""));
            return sum + (Number.isFinite(num) ? num : 0);
        }, 0);
    }, [filteredRows]);

    const totalWeightKg = useMemo(() => {
        return filteredRows.reduce((sum, row) => sum + (row.weightKg || 0), 0);
    }, [filteredRows]);

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

    return (
        <div className="space-y-8 pb-24 lg:pb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1c]">
                    Recycling History
                </h1>
                <p className="text-[#72796e] mt-2">
                    Track all your recycling transactions and earnings.
                </p>
            </div>

            <div className="flex flex-col md:flex-row md:items-center gap-4 justify-between">
                <div className="flex flex-col sm:flex-row flex-wrap gap-3 flex-1">
                    <div className="flex items-center bg-white border border-zinc-200 px-3 py-2 rounded-lg flex-1 min-w-[200px] max-w-md">
                        <Search size={18} className="text-[#72796e] mr-2 shrink-0" />
                        <input
                            type="search"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="outline-none text-sm w-full bg-transparent"
                            placeholder="Search materials or shops..."
                            aria-label="Search transaction history"
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
                        className="flex items-center gap-2 px-4 py-2 border border-zinc-200 rounded-lg text-sm bg-white min-w-[140px]"
                        aria-label="Filter by status"
                    >
                        <option value="all">All statuses</option>
                        <option value="completed">Completed</option>
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

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white px-3 py-2.5 rounded-xl border shadow-sm">
                    <p className="text-[11px] text-[#72796e] leading-tight">Trips</p>
                    <p className="text-[10px] text-[#72796e]/80 leading-tight mb-0.5">matching filters</p>
                    <p className="text-lg font-bold text-emerald-700 leading-tight">
                        {filteredRows.length} / {historyRows.length}
                    </p>
                </div>

                <div className="bg-white px-3 py-2.5 rounded-xl border shadow-sm">
                    <p className="text-[11px] text-[#72796e] leading-tight">Earned</p>
                    <p className="text-[10px] text-[#72796e]/80 leading-tight mb-0.5">from filtered trips</p>
                    <p className="text-lg font-bold text-emerald-700 leading-tight">
                        ₱{totalEarnings.toFixed(2)}
                    </p>
                </div>

                <div className="bg-white px-3 py-2.5 rounded-xl border shadow-sm">
                    <p className="text-[11px] text-[#72796e] leading-tight">Weight recycled</p>
                    <p className="text-[10px] text-[#72796e]/80 leading-tight mb-0.5">from filtered trips</p>
                    <p className="text-lg font-bold text-emerald-700 leading-tight">
                        {totalWeightKg.toFixed(1)} kg
                    </p>
                </div>
            </div>

            {loading ? (
                <div className="text-center py-16 text-[#72796e] bg-white rounded-xl border border-zinc-200">
                    Loading history...
                </div>
            ) : filteredRows.length === 0 ? (
                <div className="text-center py-16 text-[#72796e] bg-white rounded-xl border border-zinc-200">
                    No transactions yet. Log a trip from the + menu or clear filters.
                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            className="block mx-auto mt-3 text-sm font-semibold text-emerald-700 hover:underline"
                        >
                            Refresh
                        </button>
                    )}
                </div>
            ) : (
                <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
                    <div className="md:hidden divide-y divide-zinc-100">
                        {filteredRows.map((row) => (
                            <div key={row.id} className="p-4 space-y-2">
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <p className="font-semibold text-[#191c1c]">{row.material}</p>
                                        <p className="text-xs text-[#72796e]">{row.date}</p>
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold shrink-0 ${row.status === "Completed"
                                            ? "bg-emerald-100 text-emerald-700"
                                            : "bg-yellow-100 text-yellow-700"
                                            }`}
                                    >
                                        {row.status}
                                    </span>
                                </div>
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
                                <div className="flex items-center justify-between gap-3 text-sm">
                                    <p className="text-[#72796e] truncate">{row.shop}</p>
                                    <button
                                        type="button"
                                        className="text-[#154212] hover:underline text-sm shrink-0"
                                    >
                                        View
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="hidden md:block overflow-x-auto">
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
                                {filteredRows.map((row) => (
                                    <tr key={row.id} className="hover:bg-zinc-50">
                                        <td className="p-3 sm:p-4">{row.date}</td>
                                        <td className="p-3 sm:p-4 font-medium">{row.material}</td>
                                        <td className="p-3 sm:p-4">{row.weight}</td>
                                        <td className="p-3 sm:p-4 text-emerald-700 font-semibold">
                                            {row.amount}
                                        </td>
                                        <td className="p-3 sm:p-4">{row.shop}</td>

                                        <td className="p-3 sm:p-4">
                                            <span
                                                className={`px-2 py-1 rounded-full text-xs font-semibold ${row.status === "Completed"
                                                    ? "bg-emerald-100 text-emerald-700"
                                                    : "bg-yellow-100 text-yellow-700"
                                                    }`}
                                            >
                                                {row.status}
                                            </span>
                                        </td>

                                        <td className="p-3 sm:p-4 text-right">
                                            <button
                                                type="button"
                                                className="text-[#154212] hover:underline text-sm"
                                            >
                                                View
                                            </button>
                                        </td>
                                    </tr>
                                ))}
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
    favoriteIds,
    onToggleFavorite,
    onFindShops,
    onViewShop,
    onRouteShop,
}) {
    const favoriteShops = useMemo(
        () => shops.filter((shop) => isFavoriteShopId(shop.id, favoriteIds)),
        [shops, favoriteIds]
    );

    return (
        <div className="space-y-8 pb-24 lg:pb-8">
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

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {favoriteShops.map((shop) => (
                    <FavoriteShopCard
                        key={shop.id}
                        shop={{ ...shop, image: SHOP_IMAGE }}
                        onRemove={() => onToggleFavorite(shop.id)}
                        onViewDetails={() => onViewShop(shop.id)}
                        onRoute={() => onRouteShop(shop)}
                    />
                ))}

                {favoriteShops.length === 0 && (
                    <div className="md:col-span-2 xl:col-span-3 bg-emerald-50/50 border-2 border-dashed border-emerald-200 rounded-xl flex flex-col items-center justify-center p-6 sm:p-8 text-center min-h-[280px] sm:min-h-[320px]">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                            <Search size={42} className="text-emerald-600" />
                        </div>

                        <h3 className="text-xl sm:text-2xl font-bold text-[#154212] mb-2">
                            Explore the Map
                        </h3>

                        <p className="text-[#42493e] text-sm max-w-[280px] mb-6">
                            You haven&apos;t saved any shops yet. Tap the heart on any shop
                            in Find Nearby Junkshops, or browse the map to find favorites.
                        </p>

                        <button
                            type="button"
                            onClick={onFindShops}
                            className="text-emerald-700 font-semibold hover:underline"
                        >
                            Browse nearby centers
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

function FavoriteShopCard({ shop, onRemove, onViewDetails, onRoute }) {
    return (
        <div className="bg-white border border-[#c2c9bb] rounded-xl overflow-hidden shadow-[0_4px_12px_rgba(141,170,145,0.15)] flex flex-col group">
            <div className="relative h-40">
                <img
                    alt={shop.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    src={shop.image}
                />

                <button
                    type="button"
                    onClick={onRemove}
                    className="absolute top-3 right-3 bg-white/90 backdrop-blur p-2 rounded-full text-red-600 transition-transform hover:scale-110 active:scale-90"
                    aria-label="Remove from favorites"
                >
                    <Heart size={18} fill="currentColor" />
                </button>
            </div>

            <div className="p-5 flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-bold text-[#154212]">{shop.name}</h3>

                    <div className="flex items-center gap-1 text-[#4e6953] bg-[#c9e7cc] px-2 py-0.5 rounded-full text-xs font-semibold">
                        <Star size={13} fill="currentColor" />
                        {shop.rating}
                    </div>
                </div>

                <div className="space-y-2 mb-6">
                    <div className="flex items-center gap-2 text-[#42493e] text-sm">
                        <MapPin size={16} />
                        {shop.distance} · {shop.address}
                    </div>

                    <div className="flex flex-wrap gap-1">
                        {(shop.materials || []).slice(0, 3).map((m) => (
                            <span
                                key={m}
                                className="bg-[#c9e7cc] text-[#4e6953] px-2 py-0.5 rounded text-[10px] font-medium"
                            >
                                {m}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button
                        type="button"
                        onClick={onViewDetails}
                        className="flex items-center justify-center gap-1 py-2 px-3 border border-[#c2c9bb] rounded-lg text-sm font-semibold hover:bg-[#edeeed] transition-colors"
                    >
                        <Info size={15} />
                        Details
                    </button>

                    <button
                        type="button"
                        onClick={onRoute}
                        className="flex items-center justify-center gap-1 py-2 px-3 border border-[#c2c9bb] rounded-lg text-sm font-semibold hover:bg-[#edeeed] transition-colors"
                    >
                        <Navigation size={15} />
                        Route
                    </button>

                    <button className="col-span-2 flex items-center justify-center gap-1 py-2 px-3 bg-[#4a654f] text-white rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity">
                        <DollarSign size={15} />
                        View Prices
                    </button>
                </div>
            </div>
        </div>
    );
}

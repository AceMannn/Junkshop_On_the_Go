import { useState } from "react";
import {
    LayoutDashboard,
    Package,
    DollarSign,
    Clock,
    Truck,
    ReceiptText,
    MoreHorizontal,
} from "lucide-react";

export const providerTabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "materials", label: "Materials", icon: Package },
    { id: "prices", label: "Prices", icon: DollarSign },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "requests", label: "Pickups", icon: Truck },
    { id: "transactions", label: "Transactions", icon: ReceiptText },
];

const mobilePrimaryIds = ["dashboard", "requests", "materials", "prices"];
const mobileMoreIds = ["availability", "transactions"];

const primarySidebarButtonClass =
    "w-full flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-200/70 bg-emerald-100/80 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100 hover:shadow transition-colors";

const sidebarNavTabs = providerTabs.filter((tab) => tab.id !== "requests");

export default function ProviderSidebar({ activeTab, onNavigate }) {
    return (
        <aside className="fixed left-0 top-16 h-[calc(100vh-4rem)] w-56 border-r border-zinc-200 bg-zinc-50 hidden md:flex flex-col z-30">
            <div className="p-3 pb-2">
                <button
                    type="button"
                    onClick={() => onNavigate("requests")}
                    className={`${primarySidebarButtonClass} ${
                        activeTab === "requests" ? "ring-2 ring-emerald-400/80" : ""
                    }`}
                >
                    <Truck size={20} />
                    Pickups
                </button>
            </div>

            <nav className="flex flex-col gap-0.5 px-3 flex-1 overflow-y-auto">
                {sidebarNavTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onNavigate(tab.id)}
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
        </aside>
    );
}

export function ProviderMobileNav({ activeTab, onNavigate }) {
    const [showMore, setShowMore] = useState(false);
    const mobileTabs = providerTabs.filter((tab) => mobilePrimaryIds.includes(tab.id));
    const moreTabs = providerTabs.filter((tab) => mobileMoreIds.includes(tab.id));
    const moreActive = moreTabs.some((tab) => tab.id === activeTab);

    const handleNavigate = (tabId) => {
        onNavigate(tabId);
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
                <div className="md:hidden fixed bottom-[4.25rem] left-3 right-3 z-50 rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl">
                    {moreTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;

                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => handleNavigate(tab.id)}
                                className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "text-[#191c1c] hover:bg-zinc-50"
                                    }`}
                            >
                                <Icon size={20} />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            )}

            <nav className="md:hidden fixed bottom-0 left-0 w-full flex justify-around items-center px-1 py-2.5 bg-white border-t border-zinc-200 shadow-[0_-4px_12px_rgba(141,170,145,0.15)] z-50 rounded-t-2xl safe-area-pb max-w-lg mx-auto sm:max-w-none sm:mx-0">
                {mobileTabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => handleNavigate(tab.id)}
                            className={`flex flex-1 flex-col items-center justify-center min-w-0 px-1 py-1.5 rounded-xl active:scale-95 transition-transform ${isActive
                                ? "bg-emerald-100 text-emerald-800"
                                : "text-zinc-500 hover:text-emerald-600"
                                }`}
                        >
                            <Icon size={20} />
                            <span className="text-[10px] font-medium mt-0.5 truncate max-w-full px-0.5">
                                {tab.label}
                            </span>
                        </button>
                    );
                })}

                <button
                    type="button"
                    onClick={() => setShowMore((open) => !open)}
                    className={`flex flex-1 flex-col items-center justify-center min-w-0 px-1 py-1.5 rounded-xl active:scale-95 transition-transform ${moreActive || showMore
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


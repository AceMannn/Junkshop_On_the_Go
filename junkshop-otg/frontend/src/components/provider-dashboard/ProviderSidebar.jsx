import { useState } from "react";
import {
    LayoutDashboard,
    Package,
    Clock,
    Truck,
    History,
    MoreHorizontal,
    ShieldCheck,
    Pin,
    PinOff,
} from "lucide-react";

export const providerTabs = [
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "requests", label: "Pickups", icon: Truck },
    { id: "materials", label: "Materials", icon: Package },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "verification", label: "Verification", icon: ShieldCheck },
    { id: "transactions", label: "History", icon: History },
];

const mobilePrimaryIds = ["dashboard", "verification", "requests", "materials"];
const mobileMoreIds = ["availability", "transactions"];

const primarySidebarButtonClass =
    "w-full flex items-center text-sm font-semibold transition-colors";

const sidebarIconSlotClass = "flex h-10 w-20 shrink-0 items-center justify-center";

const sidebarIconInnerClass = "flex h-10 w-10 items-center justify-center shrink-0";

function sidebarIconHighlightClass(isActive, pinned) {
    if (pinned) return sidebarIconInnerClass;
    const shell =
        "flex h-10 w-10 items-center justify-center shrink-0 rounded-xl transition-colors group-hover/sidebar:bg-transparent group-hover/sidebar:text-inherit";
    if (isActive) {
        return `${shell} bg-[var(--dash-active-bg)] text-[var(--dash-active-text)]`;
    }
    return `${shell} group-hover/nav:bg-[var(--dash-hover)]`;
}

function sidebarNavButtonClass(isActive, pinned) {
    const base =
        "group/nav flex min-h-11 w-full items-center rounded-lg py-0.5 text-sm font-medium text-left whitespace-nowrap overflow-hidden transition-colors focus:outline-none";
    if (pinned) {
        return `${base} ${
            isActive
                ? "bg-[var(--dash-active-bg)] text-[var(--dash-active-text)]"
                : "text-[var(--dash-muted)] hover:bg-[var(--dash-hover)]"
        }`;
    }
    return `${base} ${
        isActive
            ? "text-[var(--dash-muted)] group-hover/sidebar:bg-[var(--dash-active-bg)] group-hover/sidebar:text-[var(--dash-active-text)]"
            : "text-[var(--dash-muted)] group-hover/sidebar:hover:bg-[var(--dash-hover)]"
    }`;
}

const primaryIconShellClass =
    "flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--dash-brand)] bg-[var(--dash-brand)] text-white shadow-sm transition-colors hover:opacity-90";

const sidebarNavItems = [
    { id: "requests", label: "Pickups", icon: Truck, primary: true },
    { id: "dashboard", label: "Overview", icon: LayoutDashboard },
    { id: "materials", label: "Materials", icon: Package },
    { id: "availability", label: "Availability", icon: Clock },
    { id: "verification", label: "Verification", icon: ShieldCheck },
    { id: "transactions", label: "History", icon: History },
];

export default function ProviderSidebar({ activeTab, onNavigate, pinned, onPinnedChange }) {
    const sidebarWidthClass = pinned ? "w-56" : "w-20 hover:w-56";
    const labelClass = pinned
        ? "max-w-[10rem] opacity-100"
        : "max-w-0 opacity-0 group-hover/sidebar:max-w-[10rem] group-hover/sidebar:opacity-100";

    return (
        <aside
            className={`group/sidebar fixed left-0 top-16 h-[calc(100vh-4rem)] ${sidebarWidthClass} overflow-hidden border-r border-[var(--dash-border)] bg-[var(--dash-sidebar-bg)] hidden md:flex flex-col z-30 transition-[width] duration-300 ease-out`}
        >
            <nav className="overflow-hidden flex flex-col gap-0.5 px-1.5 pt-3 flex-1">
                {sidebarNavItems.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    if (tab.primary) {
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => onNavigate(tab.id)}
                                title={tab.label}
                                className={`${primarySidebarButtonClass} group/nav mb-2 min-h-10 whitespace-nowrap overflow-hidden focus:outline-none`}
                            >
                                <span className={sidebarIconSlotClass}>
                                    <span className={primaryIconShellClass}>
                                        <Icon size={20} />
                                    </span>
                                </span>
                                <span
                                    className={`min-w-0 flex-1 overflow-hidden truncate pr-3 text-left font-semibold text-[var(--dash-brand)] transition-[max-width,opacity] duration-300 ease-out ${labelClass}`}
                                >
                                    {tab.label}
                                </span>
                            </button>
                        );
                    }

                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => onNavigate(tab.id)}
                            title={tab.label}
                            className={sidebarNavButtonClass(isActive, pinned)}
                        >
                            <span className={sidebarIconSlotClass}>
                                <span className={sidebarIconHighlightClass(isActive, pinned)}>
                                    <Icon size={20} />
                                </span>
                            </span>
                            <span
                                className={`min-w-0 flex-1 overflow-hidden truncate pr-2 transition-[max-width,opacity] duration-300 ease-out ${labelClass}`}
                            >
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </nav>
            <div
                className={`flex py-2 ${
                    pinned ? "justify-end px-3" : "justify-center group-hover/sidebar:justify-end group-hover/sidebar:px-3"
                }`}
            >
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
                                className={`flex w-full min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive
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
                            className={`flex flex-1 flex-col items-center justify-center min-h-11 min-w-0 px-1 py-1.5 rounded-xl active:scale-95 transition-transform ${isActive
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


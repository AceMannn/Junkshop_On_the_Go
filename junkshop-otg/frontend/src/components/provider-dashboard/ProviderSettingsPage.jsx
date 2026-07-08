import { useEffect, useState } from "react";
import { AccountPageShell } from "../customer-dashboard/CustomerAccountViews";
import ProviderSettingsTab from "./ProviderSettingsTab";
import ProviderAccountTab from "./ProviderAccountTab";

const TABS = [
    { id: "shop", label: "Shop" },
    { id: "account", label: "Account" },
];

export default function ProviderSettingsPage({
    user,
    onBack,
    onNotify,
    onUserUpdate,
    initialTab = "shop",
}) {
    const [activeTab, setActiveTab] = useState(
        initialTab === "account" ? "account" : "shop"
    );

    useEffect(() => {
        setActiveTab(initialTab === "account" ? "account" : "shop");
    }, [initialTab]);

    return (
        <AccountPageShell
            title="Settings"
            subtitle="Manage your junkshop listing and owner account in one place."
            onBack={onBack}
        >
            <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-1">
                {TABS.map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                        <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`rounded-t-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                                isActive
                                    ? "border-b-2 border-[#154212] text-[#154212] bg-emerald-50/60"
                                    : "text-[#72796e] hover:text-[#191c1c] hover:bg-zinc-50"
                            }`}
                            aria-pressed={isActive}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>

            {activeTab === "shop" ? (
                <ProviderSettingsTab
                    embedded
                    user={user}
                    onNotify={onNotify}
                    onUserUpdate={onUserUpdate}
                />
            ) : (
                <ProviderAccountTab user={user} onNotify={onNotify} onUserUpdate={onUserUpdate} />
            )}
        </AccountPageShell>
    );
}

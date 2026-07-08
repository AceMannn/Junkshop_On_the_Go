import { useEffect, useState } from "react";
import {
    AccountPageShell,
    ViewProfilePage,
    AccountSettingsPage,
} from "./CustomerAccountViews";

const TABS = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
];

export default function CustomerSettingsPage({
    user,
    onBack,
    onNotify,
    onUserUpdate,
    onSaveSuccess,
    initialTab = "profile",
}) {
    const [activeTab, setActiveTab] = useState(
        initialTab === "account" ? "account" : "profile"
    );

    useEffect(() => {
        setActiveTab(initialTab === "account" ? "account" : "profile");
    }, [initialTab]);

    return (
        <AccountPageShell
            title="Settings"
            subtitle="Your profile, pickup address, and account security in one place."
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

            {activeTab === "profile" ? (
                <ViewProfilePage
                    embedded
                    user={user}
                    onUserUpdate={onUserUpdate}
                    onSaveSuccess={onSaveSuccess}
                />
            ) : (
                <AccountSettingsPage
                    embedded
                    user={user}
                    onNotify={onNotify}
                    onUserUpdate={onUserUpdate}
                />
            )}
        </AccountPageShell>
    );
}

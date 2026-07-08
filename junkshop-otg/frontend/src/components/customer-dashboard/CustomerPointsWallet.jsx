import { useEffect, useState } from "react";
import {
    X,
    Leaf,
    Truck,
    MapPin,
    Gift,
    Info,
    ChevronRight,
    Lock,
} from "lucide-react";
import { pickupApi } from "../../services/api";
import { formatPoints, DROP_OFF_POINTS_PER_KG, HOME_PICKUP_POINTS_PER_KG } from "../../utils/pickupPoints";

const TABS = ["Activity", "Rewards", "How it works"];

function PointsActivityItem({ request }) {
    const label =
        request.materials?.map((m) => m.name).join(", ") || "Mixed recyclables";
    const dateStr = request.createdAt
        ? new Date(request.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
          })
        : "";
    const isDropOff = request.requestType === "drop_off";
    const shopName =
        request.junkshop?.name ||
        request.provider?.junkshopName ||
        [request.provider?.firstName, request.provider?.lastName]
            .filter(Boolean)
            .join(" ") ||
        "Junkshop";

    return (
        <div className="flex items-start gap-3 py-3 border-b border-zinc-100 last:border-0">
            <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center">
                {isDropOff ? (
                    <MapPin size={16} className="text-emerald-700" />
                ) : (
                    <Truck size={16} className="text-emerald-700" />
                )}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#191c1c] truncate">{label}</p>
                <p className="text-xs text-[#72796e] truncate">
                    {shopName} · {dateStr}
                </p>
                <p className="text-xs text-[#72796e] mt-0.5">
                    {request.actualWeightKg ?? request.estimatedWeightKg ?? "—"} kg ·{" "}
                    {isDropOff ? "Drop-off" : "Home pickup"}
                </p>
            </div>
            <span className="shrink-0 text-sm font-bold text-emerald-700">
                +{formatPoints(request.pointsAwarded)} pts
            </span>
        </div>
    );
}

const REWARDS = [
    {
        id: "voucher",
        title: "₱50 partner voucher",
        points: 500,
        locked: true,
    },
    {
        id: "priority",
        title: "Priority pickup slot",
        points: 300,
        locked: true,
    },
    {
        id: "badge",
        title: "Eco Champion badge",
        points: 1000,
        locked: true,
    },
];

export default function CustomerPointsWallet({ user, isOpen, onClose }) {
    const [tab, setTab] = useState("Activity");
    const [activity, setActivity] = useState([]);
    const [loading, setLoading] = useState(false);

    const balance = user?.recyclingPoints ?? 0;

    useEffect(() => {
        if (!isOpen) return;
        setLoading(true);
        pickupApi
            .list()
            .then(({ requests = [] }) => {
                const earned = requests.filter(
                    (r) => r.status === "completed" && (r.pointsAwarded ?? 0) > 0
                );
                earned.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
                setActivity(earned);
            })
            .catch(() => setActivity([]))
            .finally(() => setLoading(false));
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close points wallet"
                className="fixed inset-0 z-40 bg-black/30"
                onClick={onClose}
            />

            {/* Drawer */}
            <aside className="fixed right-0 top-0 bottom-0 z-50 flex flex-col w-full max-w-sm bg-white shadow-2xl md:top-0 md:h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 shrink-0">
                    <div className="flex items-center gap-2">
                        <Leaf size={18} className="text-emerald-700" />
                        <h2 className="text-base font-bold text-[#191c1c]">My Points</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-zinc-100 transition-colors"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Balance card */}
                <div className="shrink-0 mx-5 mt-5 rounded-2xl bg-gradient-to-br from-[#154212] via-[#1e5a1a] to-[#3DA35D] p-5 text-white shadow-[0_4px_20px_rgba(21,66,18,0.22)] relative overflow-hidden">
                    <div className="absolute -top-5 -right-5 w-24 h-24 rounded-full bg-white/5 pointer-events-none" />
                    <p className="text-xs font-medium text-white/70 mb-0.5">Total balance</p>
                    <p className="text-3xl font-bold tracking-tight">
                        {formatPoints(balance)}
                        <span className="text-lg font-semibold text-white/80 ml-1.5">pts</span>
                    </p>
                    <p className="mt-2 text-xs text-white/70">
                        Earn up to {formatPoints(DROP_OFF_POINTS_PER_KG)} pts/kg on drop-off (
                        {formatPoints(HOME_PICKUP_POINTS_PER_KG)} pts/kg on home pickup).
                    </p>
                </div>

                {/* Tabs */}
                <div className="shrink-0 flex gap-0 mx-5 mt-4 rounded-xl bg-zinc-100 p-1">
                    {TABS.map((t) => (
                        <button
                            key={t}
                            type="button"
                            onClick={() => setTab(t)}
                            className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition-colors ${
                                tab === t
                                    ? "bg-white text-[#191c1c] shadow-sm"
                                    : "text-[#72796e] hover:text-[#191c1c]"
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1">
                    {tab === "Activity" && (
                        <>
                            {loading ? (
                                <p className="text-sm text-[#72796e] text-center py-10 animate-pulse">
                                    Loading activity…
                                </p>
                            ) : activity.length === 0 ? (
                                <div className="flex flex-col items-center justify-center gap-2 py-12 text-center">
                                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center">
                                        <Leaf size={22} className="text-emerald-600" />
                                    </div>
                                    <p className="text-sm font-semibold text-[#191c1c]">
                                        No points earned yet
                                    </p>
                                    <p className="text-xs text-[#72796e] max-w-[200px]">
                                        Complete a pickup or drop-off to start earning recycling points.
                                    </p>
                                </div>
                            ) : (
                                <div>
                                    {activity.map((r) => (
                                        <PointsActivityItem key={r.id} request={r} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    {tab === "Rewards" && (
                        <div className="space-y-3 pt-1">
                            <p className="text-xs text-[#72796e]">
                                Redeem your points for rewards. More options coming soon.
                            </p>
                            {REWARDS.map((reward) => {
                                const canRedeem = balance >= reward.points && !reward.locked;
                                return (
                                    <div
                                        key={reward.id}
                                        className={`flex items-center gap-3 p-4 rounded-xl border ${
                                            canRedeem
                                                ? "border-emerald-200 bg-emerald-50"
                                                : "border-zinc-200 bg-white opacity-70"
                                        }`}
                                    >
                                        <div className="w-9 h-9 shrink-0 rounded-full bg-amber-100 flex items-center justify-center">
                                            {reward.locked ? (
                                                <Lock size={16} className="text-amber-600" />
                                            ) : (
                                                <Gift size={16} className="text-amber-600" />
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-[#191c1c] truncate">
                                                {reward.title}
                                            </p>
                                            <p className="text-xs text-[#72796e]">
                                                {formatPoints(reward.points)} pts required
                                            </p>
                                        </div>
                                        {reward.locked ? (
                                            <span className="text-xs font-semibold text-[#72796e] shrink-0">
                                                Coming soon
                                            </span>
                                        ) : (
                                            <button
                                                type="button"
                                                disabled={!canRedeem}
                                                className="shrink-0 px-3 py-1.5 rounded-lg bg-[#154212] text-white text-xs font-semibold disabled:opacity-40"
                                            >
                                                Redeem
                                                <ChevronRight size={12} className="inline ml-0.5" />
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {tab === "How it works" && (
                        <div className="space-y-4 pt-1">
                            <div className="flex items-start gap-3 p-4 rounded-xl border border-zinc-200 bg-zinc-50">
                                <Info size={16} className="text-emerald-700 shrink-0 mt-0.5" />
                                <p className="text-xs text-[#42493e] leading-relaxed">
                                    Recycling points are automatically awarded by the system when a
                                    pickup or drop-off is marked completed by the junkshop owner.
                                    You never lose points for selling materials.
                                </p>
                            </div>

                            {[
                                {
                                    step: "1",
                                    title: "Book a pickup or drop-off",
                                    desc: "Schedule a home pickup or drop-off at a partner junkshop.",
                                },
                                {
                                    step: "2",
                                    title: "Provider confirms completion",
                                    desc: "The junkshop owner enters the actual weight and marks the request completed.",
                                },
                                {
                                    step: "3",
                                    title: "Points are automatically awarded",
                                    desc: `Drop-off earns ${formatPoints(DROP_OFF_POINTS_PER_KG)} pts/kg; home pickup earns ${formatPoints(HOME_PICKUP_POINTS_PER_KG)} pts/kg — awarded automatically when the shop completes your request.`,
                                },
                                {
                                    step: "4",
                                    title: "Redeem for rewards",
                                    desc: "Use accumulated points for vouchers, badges, and partner perks (coming soon).",
                                },
                            ].map(({ step, title, desc }) => (
                                <div key={step} className="flex gap-3">
                                    <div className="shrink-0 w-7 h-7 rounded-full bg-[#154212] text-white text-xs font-bold flex items-center justify-center">
                                        {step}
                                    </div>
                                    <div className="pt-0.5">
                                        <p className="text-sm font-semibold text-[#191c1c]">
                                            {title}
                                        </p>
                                        <p className="text-xs text-[#72796e] mt-0.5 leading-relaxed">
                                            {desc}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </aside>
        </>
    );
}

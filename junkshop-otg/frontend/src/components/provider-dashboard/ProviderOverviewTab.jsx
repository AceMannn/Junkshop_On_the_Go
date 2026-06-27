import { useCallback, useEffect, useMemo, useState } from "react";
import { Truck, CheckCircle, Clock3, DollarSign, Layers, AlertCircle } from "lucide-react";
import { pickupApi, domainApi } from "../../services/api";
import { useProviderMaterials } from "../../hooks/useProviderData";
import { STATUS_STYLES, STATUS_LABELS } from "../../utils/pickupHelpers";
import { normalizeTransaction } from "../../utils/catalogMappers";
import StatCard from "../ui/StatCard";

function getTimeGreeting() {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
}

const CATEGORY_CHIP_COLORS = {
    plastic:   "bg-blue-100 text-blue-700",
    metal:     "bg-amber-100 text-amber-700",
    paper:     "bg-emerald-100 text-emerald-700",
    glass:     "bg-teal-100 text-teal-700",
    "e-waste": "bg-purple-100 text-purple-700",
    other:     "bg-zinc-100 text-zinc-600",
};

export default function ProviderOverviewTab({ user, onNavigate }) {
    const { materials } = useProviderMaterials();
    const [pickups, setPickups] = useState([]);
    const [totalRevenue, setTotalRevenue] = useState(0);

    const loadPickups = useCallback(async () => {
        try {
            const { requests } = await pickupApi.list();
            setPickups(requests || []);
        } catch {
            setPickups([]);
        }
    }, []);

    const loadRevenue = useCallback(async () => {
        try {
            const { transactions } = await domainApi.getTransactions();
            const total = (transactions || [])
                .map(normalizeTransaction)
                .reduce((sum, row) => {
                    const num = Number(String(row.amount).replace(/[₱,]/g, ""));
                    return sum + (Number.isFinite(num) ? num : 0);
                }, 0);
            setTotalRevenue(total);
        } catch {
            setTotalRevenue(0);
        }
    }, []);

    useEffect(() => {
        loadPickups();
        loadRevenue();
    }, [loadPickups, loadRevenue]);

    const stats = useMemo(() => {
        const pending = pickups.filter((r) => r.status === "pending").length;
        const completed = pickups.filter((r) => r.status === "completed").length;
        const activeMaterials = materials.filter((m) => m.available).length;
        const avgPrice =
            materials.length > 0
                ? (
                      materials.reduce((sum, m) => sum + Number(m.price || 0), 0) /
                      materials.length
                  ).toFixed(0)
                : "—";

        return { pending, completed, activeMaterials, avgPrice };
    }, [pickups, materials]);

    const recentPickups = pickups.slice(0, 4);

    const shopName = user?.junkshopName || "My Shop";
    const ownerName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || null;

    // Build the banner sub-line
    const hasActivity = stats.completed > 0 || totalRevenue > 0 || stats.activeMaterials > 0;
    const bannerLine = hasActivity
        ? [
              stats.completed > 0 ? `${stats.completed} completed pickup${stats.completed !== 1 ? "s" : ""}` : null,
              totalRevenue > 0 ? `₱${totalRevenue.toFixed(2)} revenue` : null,
              stats.activeMaterials > 0 ? `${stats.activeMaterials} material${stats.activeMaterials !== 1 ? "s" : ""} live` : null,
          ]
              .filter(Boolean)
              .join(" · ")
        : "Complete your shop setup to start receiving pickups.";

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <section className="md:hidden">
                <button
                    type="button"
                    onClick={() => onNavigate("requests")}
                    className="w-full flex items-center justify-center gap-2.5 rounded-2xl border border-emerald-200/70 bg-emerald-100/80 px-4 py-3 text-sm font-semibold text-emerald-900 shadow-sm hover:bg-emerald-100 hover:shadow transition-colors"
                >
                    <Truck size={20} />
                    Pickups
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
                    <h1 className="text-xl sm:text-2xl font-bold tracking-tight relative leading-tight">
                        {shopName}
                    </h1>
                    {ownerName && (
                        <p className="text-xs sm:text-sm text-white/60 font-normal relative mt-0.5">
                            Managed by {ownerName}
                        </p>
                    )}
                    <p className="mt-2 text-xs sm:text-sm text-white/75 relative">
                        {bannerLine}
                    </p>
                </div>
            </section>

            {/* Pending alert — separate from banner */}
            {stats.pending > 0 && (
                <section>
                    <div className="inline-flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm font-semibold px-4 py-2 rounded-xl">
                        <AlertCircle size={16} className="shrink-0" />
                        {stats.pending} pending pickup{stats.pending > 1 ? "s" : ""} — awaiting your response
                    </div>
                </section>
            )}

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    label="Pending Pickups"
                    value={String(stats.pending)}
                    icon={Clock3}
                    accentColor="amber"
                    helper="Awaiting your response"
                    helperMode="inline"
                />
                <StatCard
                    label="Completed"
                    value={String(stats.completed)}
                    icon={CheckCircle}
                    accentColor="green"
                    helper="Finished pickup requests"
                    helperMode="inline"
                />
                <StatCard
                    label="Active Materials"
                    value={String(stats.activeMaterials)}
                    icon={Layers}
                    accentColor="blue"
                    helper="Listed and available"
                    helperMode="inline"
                />
                <StatCard
                    label="Avg Price"
                    value={stats.avgPrice === "—" ? "—" : `₱${stats.avgPrice}`}
                    unit={stats.avgPrice === "—" ? "" : "/kg"}
                    icon={DollarSign}
                    accentColor="teal"
                    helper="Across your material list"
                    helperMode="inline"
                />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-[#191c1c] mb-4">Recent Pickups</h2>
                    {recentPickups.length === 0 ? (
                        <p className="text-sm text-[#72796e]">No pickup requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentPickups.map((req) => {
                                const customerName = req.customer?.firstName
                                    ? `${req.customer.firstName} ${req.customer.lastName || ""}`.trim()
                                    : "Customer";
                                const typeLabel = req.requestType === "drop_off" ? "Drop-off" : "Home pickup";
                                const statusKey = req.status?.toLowerCase() || "pending";
                                const badgeStyle = STATUS_STYLES[statusKey] || "bg-zinc-100 text-zinc-600";
                                const badgeLabel = STATUS_LABELS[statusKey] || req.status;
                                return (
                                    <div
                                        key={req.id}
                                        className="flex items-center justify-between gap-3 border-b border-zinc-100 pb-2.5 last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="font-semibold text-sm text-[#191c1c] truncate">{customerName}</p>
                                            <p className="text-xs text-[#72796e]">{typeLabel}</p>
                                        </div>
                                        <span className={`shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${badgeStyle}`}>
                                            {badgeLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => onNavigate("requests")}
                        className="mt-4 text-sm font-semibold text-emerald-700 hover:underline"
                    >
                        View all pickups →
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle size={18} className="text-emerald-700" />
                        <h2 className="text-lg font-bold text-[#191c1c]">Top Materials</h2>
                    </div>
                    {materials.length === 0 ? (
                        <p className="text-sm text-[#72796e]">No materials listed yet.</p>
                    ) : (
                        <div className="space-y-2.5">
                            {materials.slice(0, 5).map((item) => {
                                const catKey = item.category?.toLowerCase() || "other";
                                const chipClass = CATEGORY_CHIP_COLORS[catKey] || CATEGORY_CHIP_COLORS.other;
                                return (
                                    <div
                                        key={item.id}
                                        className="flex items-center justify-between gap-3"
                                    >
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className={`shrink-0 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${chipClass}`}>
                                                {item.category || "Other"}
                                            </span>
                                            <span className="text-sm text-[#191c1c] truncate">{item.name}</span>
                                        </div>
                                        <span className="shrink-0 font-bold text-sm text-emerald-700">
                                            ₱{item.price}<span className="font-normal text-xs text-[#72796e]">/{item.unit}</span>
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}

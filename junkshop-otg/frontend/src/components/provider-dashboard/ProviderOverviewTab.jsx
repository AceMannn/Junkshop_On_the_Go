import { useCallback, useEffect, useMemo, useState } from "react";
import { Package, Truck, DollarSign, CheckCircle } from "lucide-react";
import { pickupApi } from "../../services/api";
import { useProviderMaterials } from "../../hooks/useProviderData";

function StatCard({ label, value, unit, helper }) {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
            <p className="text-[10px] sm:text-xs text-[#72796e] uppercase tracking-wider font-semibold">
                {label}
            </p>
            <p className="text-xl sm:text-2xl font-bold text-emerald-900 mt-1">
                {value}
                {unit && <span className="text-xs sm:text-sm font-semibold ml-1">{unit}</span>}
            </p>
            {helper && <p className="text-xs text-[#72796e] mt-2">{helper}</p>}
        </div>
    );
}

export default function ProviderOverviewTab({ onNavigate }) {
    const { materials } = useProviderMaterials();
    const [pickups, setPickups] = useState([]);

    const loadPickups = useCallback(async () => {
        try {
            const { requests } = await pickupApi.list();
            setPickups(requests || []);
        } catch {
            setPickups([]);
        }
    }, []);

    useEffect(() => {
        loadPickups();
    }, [loadPickups]);

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

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-8">
            <section>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Overview
                </h1>
                <p className="mt-1.5 text-sm sm:text-base text-[#72796e]">
                    Live stats from your pickups and materials.
                </p>
            </section>

            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <StatCard
                    label="Pending Pickups"
                    value={String(stats.pending)}
                    helper="Awaiting your response"
                />
                <StatCard
                    label="Completed"
                    value={String(stats.completed)}
                    helper="Finished pickup requests"
                />
                <StatCard
                    label="Active Materials"
                    value={String(stats.activeMaterials)}
                    helper="Listed and available"
                />
                <StatCard
                    label="Avg Price"
                    value={stats.avgPrice === "—" ? "—" : `₱${stats.avgPrice}`}
                    unit={stats.avgPrice === "—" ? "" : "/kg"}
                    helper="Across your material list"
                />
            </section>

            <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <h2 className="text-lg font-bold text-[#191c1c] mb-4">Recent Pickups</h2>
                    {recentPickups.length === 0 ? (
                        <p className="text-sm text-[#72796e]">No pickup requests yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {recentPickups.map((req) => (
                                <div
                                    key={req.id}
                                    className="flex items-center justify-between text-sm border-b border-zinc-100 pb-2 last:border-0"
                                >
                                    <span className="font-medium text-[#191c1c] capitalize">
                                        {req.status?.replace("_", " ")}
                                    </span>
                                    <span className="text-[#72796e] text-xs">
                                        {req.pickupType || "pickup"}
                                    </span>
                                </div>
                            ))}
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
                    <h2 className="text-lg font-bold text-[#191c1c] mb-4">Quick Actions</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[
                            { id: "materials", label: "Materials", icon: Package },
                            { id: "requests", label: "Pickups", icon: Truck },
                            { id: "settings", label: "GCash", icon: DollarSign },
                        ].map(({ id, label, icon: Icon }) => (
                            <button
                                key={id}
                                type="button"
                                onClick={() => onNavigate(id)}
                                className="flex flex-col items-center gap-2 py-4 px-2 bg-[#f9f9f8] border border-zinc-200 rounded-xl hover:border-emerald-300 hover:bg-emerald-50/50 transition-colors"
                            >
                                <Icon size={20} className="text-emerald-800" />
                                <span className="text-xs font-semibold">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {materials.length > 0 && (
                <section className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4">
                        <CheckCircle size={18} className="text-emerald-700" />
                        <h2 className="text-lg font-bold text-[#191c1c]">Top Materials</h2>
                    </div>
                    <div className="space-y-2">
                        {materials.slice(0, 5).map((item) => (
                            <div
                                key={item.id}
                                className="flex justify-between text-sm text-[#42493e]"
                            >
                                <span>{item.name}</span>
                                <span className="font-semibold text-emerald-800">
                                    ₱{item.price}/{item.unit}
                                </span>
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

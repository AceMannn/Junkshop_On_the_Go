import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Truck, Clock, Info, ChevronDown, ChevronUp } from "lucide-react";
import { domainApi } from "../../services/api";
import { authApiExtended } from "../../services/api";
import { useProviderJunkshop } from "../../hooks/useProviderData";
import {
    DEFAULT_OPERATING_HOURS,
    WEEKDAY_ROWS,
    sanitizeOperatingHours,
    copyWeekdayHours,
} from "../../utils/operatingHours";

const QUICK_PRESETS = [
    {
        label: "Mon–Fri",
        apply: (schedule) =>
            schedule.map((r) => ({
                ...r,
                open: ["mon", "tue", "wed", "thu", "fri"].includes(r.day) ? "08:00" : "",
                close: ["mon", "tue", "wed", "thu", "fri"].includes(r.day) ? "17:00" : "",
                closed: !["mon", "tue", "wed", "thu", "fri"].includes(r.day),
            })),
    },
    {
        label: "Mon–Sat",
        apply: (schedule) =>
            schedule.map((r) => ({
                ...r,
                open: r.day !== "sun" ? "08:00" : "",
                close: r.day !== "sun" ? "17:00" : "",
                closed: r.day === "sun",
            })),
    },
    {
        label: "All days",
        apply: (schedule) =>
            schedule.map((r) => ({ ...r, open: "08:00", close: "17:00", closed: false })),
    },
];

export default function ProviderAvailabilityTab({ user, onNotify, onRefreshProfile }) {
    const { shop, loading, refresh } = useProviderJunkshop();
    const [isOpen, setIsOpen] = useState(true);
    const [pickupEnabled, setPickupEnabled] = useState(true);
    const [schedule, setSchedule] = useState(DEFAULT_OPERATING_HOURS);
    const [advanced, setAdvanced] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (shop) {
            setIsOpen(shop.status === "open");
            if (Array.isArray(shop.operatingHours) && shop.operatingHours.length > 0) {
                setSchedule(sanitizeOperatingHours(shop.operatingHours));
            }
        }
        if (user) {
            setPickupEnabled(user.pickupEnabled !== false);
        }
    }, [shop, user]);

    const updateRow = (index, patch) => {
        setSchedule((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], ...patch };
            return next;
        });
    };

    const toggleDayClosed = (index) => {
        const row = schedule[index];
        const nowClosed = row.closed;
        updateRow(index, {
            closed: !nowClosed,
            open: nowClosed ? row.open || "08:00" : "",
            close: nowClosed ? row.close || "17:00" : "",
        });
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            await authApiExtended.updateProviderProfile({ pickupEnabled });
            const sanitized = sanitizeOperatingHours(schedule);
            const payload = {
                status: isOpen ? "open" : "closed",
                operatingHours: sanitized,
            };
            if (shop?._id) {
                await domainApi.updateJunkshop(shop._id, payload);
            } else {
                await domainApi.createJunkshop({
                    name: user?.junkshopName || "My Junkshop",
                    address: "Teresa, Sta. Mesa, Manila",
                    phone: user?.phone || "",
                    status: isOpen ? "open" : "closed",
                    operatingHours: sanitized,
                    location: { lat: 14.5995, lng: 121.0055 },
                    pickupEnabled,
                });
            }
            refresh();
            await onRefreshProfile?.();
            onNotify?.("Availability saved. Customers will see your updated status and hours.");
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Availability
                </h1>
                <p className="text-[#72796e] mt-2 text-sm">
                    Shop status, pickup availability, and working hours — synced to customer map &amp; bookings.
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e]">Loading shop...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Shop status card */}
                    <div className={`bg-white rounded-xl border-2 p-5 shadow-sm transition ${isOpen ? "border-emerald-300" : "border-red-200"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-bold text-[#191c1c] text-sm">Shop status</h2>
                                <p className="text-xs text-[#72796e] mt-0.5">Shown on customer map &amp; cards</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isOpen ? "bg-emerald-100" : "bg-red-100"}`}>
                                {isOpen
                                    ? <CheckCircle size={20} className="text-emerald-700" />
                                    : <XCircle size={20} className="text-red-600" />
                                }
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsOpen((v) => !v)}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${isOpen
                                ? "bg-emerald-600 text-white hover:bg-emerald-700"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                        >
                            {isOpen
                                ? <><CheckCircle size={15} /> Open — tap to close</>
                                : <><XCircle size={15} /> Closed — tap to open</>
                            }
                        </button>
                    </div>

                    {/* Pickup requests card */}
                    <div className={`bg-white rounded-xl border-2 p-5 shadow-sm transition ${pickupEnabled ? "border-blue-300" : "border-zinc-200"}`}>
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="font-bold text-[#191c1c] text-sm">Pickup requests</h2>
                                <p className="text-xs text-[#72796e] mt-0.5">Allow customers to book home pickups</p>
                            </div>
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${pickupEnabled ? "bg-blue-100" : "bg-zinc-100"}`}>
                                <Truck size={20} className={pickupEnabled ? "text-blue-700" : "text-zinc-400"} />
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => setPickupEnabled((v) => !v)}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition inline-flex items-center justify-center gap-2 ${pickupEnabled
                                ? "bg-blue-600 text-white hover:bg-blue-700"
                                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                            }`}
                        >
                            {pickupEnabled
                                ? <><Truck size={15} /> Accepting pickups</>
                                : <><Truck size={15} /> Pickups paused</>
                            }
                        </button>
                    </div>
                </div>
            )}

            {/* Working hours editor */}
            <div className="bg-white rounded-xl border border-zinc-200 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100">
                    <div className="flex items-center gap-2">
                        <Clock size={16} className="text-amber-600" />
                        <h2 className="font-bold text-[#191c1c] text-sm">Set working hours</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setAdvanced((v) => !v)}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#154212] border border-[#154212] px-3 py-1.5 rounded-lg"
                    >
                        {advanced ? <><ChevronUp size={13} /> Simple</> : <><ChevronDown size={13} /> Advanced</>}
                    </button>
                </div>

                {!advanced ? (
                    /* Simple mode — alarm-style day chips */
                    <div className="p-5 space-y-5">
                        {/* Quick presets */}
                        <div>
                            <p className="text-xs font-semibold text-[#72796e] uppercase tracking-wider mb-2">Quick presets</p>
                            <div className="flex flex-wrap gap-2">
                                {QUICK_PRESETS.map((preset) => (
                                    <button
                                        key={preset.label}
                                        type="button"
                                        onClick={() => setSchedule(preset.apply(schedule))}
                                        className="text-xs font-semibold border border-zinc-300 text-[#42493e] px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                                    >
                                        {preset.label}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    onClick={() => setSchedule(copyWeekdayHours(schedule, "mon"))}
                                    className="text-xs font-semibold border border-zinc-300 text-[#42493e] px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                                >
                                    Copy Mon → weekdays
                                </button>
                            </div>
                        </div>

                        {/* Open time / Close time */}
                        <div className="grid grid-cols-2 gap-4 max-w-xs">
                            <label className="space-y-1">
                                <p className="text-xs font-semibold text-[#72796e] uppercase tracking-wider">Open</p>
                                <input
                                    type="time"
                                    value={schedule.find((r) => !r.closed)?.open || "08:00"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSchedule((prev) =>
                                            prev.map((r) => (r.closed ? r : { ...r, open: val }))
                                        );
                                    }}
                                    className="w-full border border-[#c2c9bb] rounded-xl px-3 py-2 text-sm bg-[#f9f9f8] outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </label>
                            <label className="space-y-1">
                                <p className="text-xs font-semibold text-[#72796e] uppercase tracking-wider">Close</p>
                                <input
                                    type="time"
                                    value={schedule.find((r) => !r.closed)?.close || "17:00"}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setSchedule((prev) =>
                                            prev.map((r) => (r.closed ? r : { ...r, close: val }))
                                        );
                                    }}
                                    className="w-full border border-[#c2c9bb] rounded-xl px-3 py-2 text-sm bg-[#f9f9f8] outline-none focus:ring-2 focus:ring-amber-400"
                                />
                            </label>
                        </div>

                        {/* Day chips — alarm style */}
                        <div>
                            <p className="text-xs font-semibold text-[#72796e] uppercase tracking-wider mb-2">Active days</p>
                            <div className="flex flex-wrap gap-2">
                                {schedule.map((row, index) => {
                                    const label = WEEKDAY_ROWS.find((w) => w.day === row.day)?.label || row.day;
                                    return (
                                        <button
                                            key={row.day}
                                            type="button"
                                            onClick={() => toggleDayClosed(index)}
                                            className={`w-12 h-12 rounded-full text-sm font-bold transition ${row.closed
                                                ? "bg-zinc-100 text-zinc-400"
                                                : "bg-amber-500 text-white shadow-sm"
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            <p className="text-xs text-[#72796e] mt-2">Tap a day to toggle open / closed.</p>
                        </div>
                    </div>
                ) : (
                    /* Advanced mode — per-day rows */
                    <div className="p-5 space-y-4">
                        {/* Mobile: card per day */}
                        <div className="space-y-3 md:hidden">
                            {schedule.map((row, index) => {
                                const label = WEEKDAY_ROWS.find((w) => w.day === row.day)?.label || row.day;
                                return (
                                    <div key={row.day} className="rounded-xl border border-zinc-200 bg-white p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="font-bold text-[#191c1c]">{label}</p>
                                            <label className="flex items-center gap-2 text-xs font-semibold text-[#72796e] cursor-pointer select-none">
                                                <input
                                                    type="checkbox"
                                                    checked={row.closed}
                                                    onChange={() => toggleDayClosed(index)}
                                                    className="w-4 h-4 accent-red-500"
                                                />
                                                Closed
                                            </label>
                                        </div>
                                        {!row.closed && (
                                            <div className="grid grid-cols-2 gap-3">
                                                <label className="space-y-1">
                                                    <p className="text-xs font-semibold text-[#72796e]">Open</p>
                                                    <input
                                                        type="time"
                                                        value={row.open}
                                                        onChange={(e) => updateRow(index, { open: e.target.value, closed: false })}
                                                        className="w-full border border-[#c2c9bb] rounded-xl px-3 py-2 text-sm bg-[#f9f9f8] outline-none focus:ring-2 focus:ring-amber-400"
                                                    />
                                                </label>
                                                <label className="space-y-1">
                                                    <p className="text-xs font-semibold text-[#72796e]">Close</p>
                                                    <input
                                                        type="time"
                                                        value={row.close}
                                                        onChange={(e) => updateRow(index, { close: e.target.value, closed: false })}
                                                        className="w-full border border-[#c2c9bb] rounded-xl px-3 py-2 text-sm bg-[#f9f9f8] outline-none focus:ring-2 focus:ring-amber-400"
                                                    />
                                                </label>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Desktop: table */}
                        <div className="hidden md:block scroll-x-clean">
                            <table className="w-full text-sm">
                                <thead className="bg-[#f3f4f3] text-[#72796e]">
                                    <tr>
                                        <th className="text-left px-4 py-3 font-semibold">Day</th>
                                        <th className="text-left px-4 py-3 font-semibold">Open</th>
                                        <th className="text-left px-4 py-3 font-semibold">Close</th>
                                        <th className="px-4 py-3 font-semibold text-center">Closed</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {schedule.map((row, index) => {
                                        const label = WEEKDAY_ROWS.find((w) => w.day === row.day)?.label || row.day;
                                        return (
                                            <tr key={row.day} className={row.closed ? "opacity-40" : ""}>
                                                <td className="px-4 py-3 font-bold text-[#191c1c]">{label}</td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="time"
                                                        value={row.closed ? "" : row.open}
                                                        disabled={row.closed}
                                                        onChange={(e) => updateRow(index, { open: e.target.value, closed: false })}
                                                        className="border border-[#c2c9bb] rounded-xl px-3 py-2 text-sm bg-[#f9f9f8] outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="time"
                                                        value={row.closed ? "" : row.close}
                                                        disabled={row.closed}
                                                        onChange={(e) => updateRow(index, { close: e.target.value, closed: false })}
                                                        className="border border-[#c2c9bb] rounded-xl px-3 py-2 text-sm bg-[#f9f9f8] outline-none focus:ring-2 focus:ring-amber-400 disabled:cursor-not-allowed"
                                                    />
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={row.closed}
                                                        onChange={() => toggleDayClosed(index)}
                                                        className="w-4 h-4 accent-red-500 cursor-pointer"
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <button
                                type="button"
                                onClick={() => setSchedule(copyWeekdayHours(schedule, "mon"))}
                                className="text-xs font-semibold border border-zinc-300 text-[#42493e] px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                            >
                                Copy Mon → weekdays
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 max-w-2xl text-sm text-blue-800">
                <Info size={16} className="shrink-0 mt-0.5" />
                <p>
                    <span className="font-semibold">Manual Closed always wins.</span> If you mark the shop as Closed above, customers see "Closed" even during working hours. Schedule hours control the "Open now / Closed now" status on normal days.
                </p>
            </div>

            <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="bg-[#154212] text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-900 disabled:opacity-60"
            >
                {saving ? "Saving..." : "Save availability"}
            </button>
        </div>
    );
}

import { useEffect, useState } from "react";
import { domainApi } from "../../services/api";
import { authApiExtended } from "../../services/api";
import { useProviderJunkshop } from "../../hooks/useProviderData";

export default function ProviderAvailabilityTab({ user, onNotify, onRefreshProfile }) {
    const { shop, loading, refresh } = useProviderJunkshop();
    const [isOpen, setIsOpen] = useState(true);
    const [pickupEnabled, setPickupEnabled] = useState(true);
    const [hours, setHours] = useState("8:00 AM - 6:00 PM");
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (shop) {
            setIsOpen(shop.status === "open");
            setHours(shop.hours || "8:00 AM - 6:00 PM");
        }
        if (user) {
            setPickupEnabled(user.pickupEnabled !== false);
        }
    }, [shop, user]);

    const handleSave = async () => {
        setSaving(true);
        try {
            await authApiExtended.updateProviderProfile({ pickupEnabled });
            const payload = {
                status: isOpen ? "open" : "closed",
                hours: hours.trim(),
            };
            if (shop?._id) {
                await domainApi.updateJunkshop(shop._id, payload);
            } else {
                await domainApi.createJunkshop({
                    name: user?.junkshopName || "My Junkshop",
                    address: "Teresa, Sta. Mesa, Manila",
                    phone: user?.phone || "",
                    hours: hours.trim(),
                    status: isOpen ? "open" : "closed",
                    location: { lat: 14.5995, lng: 121.0055 },
                    pickupEnabled,
                });
            }
            refresh();
            await onRefreshProfile?.();
            onNotify?.("Availability saved. Customers will see updated shop status.");
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Availability
                </h1>
                <p className="text-[#72796e] mt-2 text-sm">
                    Shop open/closed status and pickup availability — synced to customer map &amp; bookings.
                </p>
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e]">Loading shop...</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                        <h2 className="font-bold text-[#191c1c] mb-3 text-sm">Shop status</h2>
                        <button
                            type="button"
                            onClick={() => setIsOpen((v) => !v)}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${isOpen
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-red-100 text-red-700"
                                }`}
                        >
                            {isOpen ? "Open" : "Closed"}
                        </button>
                        <p className="text-xs text-[#72796e] mt-2">
                            Shown on customer map pins and shop cards.
                        </p>
                    </div>

                    <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm">
                        <h2 className="font-bold text-[#191c1c] mb-3 text-sm">Pickup requests</h2>
                        <button
                            type="button"
                            onClick={() => setPickupEnabled((v) => !v)}
                            className={`w-full py-2.5 rounded-xl text-sm font-semibold transition ${pickupEnabled
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-zinc-100 text-zinc-600"
                                }`}
                        >
                            {pickupEnabled ? "Accepting pickups" : "Pickups paused"}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl border border-zinc-200 p-5 shadow-sm max-w-lg">
                <label className="block text-sm font-semibold text-[#42493e] mb-2">
                    Working hours
                </label>
                <input
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="e.g. 8:00 AM - 6:00 PM"
                    className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                />
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

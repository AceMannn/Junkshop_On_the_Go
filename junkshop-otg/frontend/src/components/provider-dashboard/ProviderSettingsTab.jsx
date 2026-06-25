import { useEffect, useState } from "react";
import { Store } from "lucide-react";
import { authApiExtended, domainApi, authApi } from "../../services/api";
import { useProviderJunkshop } from "../../hooks/useProviderData";
import NumberInput from "../ui/NumberInput";
import LocationPickerMap from "../maps/LocationPickerMap";
import ShopRating from "../ui/ShopRating";
import PartnerReviews from "../ui/PartnerReviews";

function Field({ label, value, onChange, type = "text", required, min, max, step, maxLength, inputMode, placeholder, error }) {
    const inputClassName = `w-full bg-[#f9f9f8] border rounded-xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-[#154212] ${
        error ? "border-red-400 focus:ring-red-200" : "border-[#c2c9bb]"
    }`;

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#42493e]">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            {type === "number" ? (
                <NumberInput
                    value={value}
                    onChange={onChange}
                    min={min}
                    max={max}
                    step={step}
                    inputClassName={inputClassName}
                />
            ) : (
                <input
                    type={type}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    maxLength={maxLength}
                    inputMode={inputMode}
                    placeholder={placeholder}
                    className={inputClassName.replace(" pr-11", "")}
                    required={required}
                />
            )}
            {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
    );
}

export default function ProviderSettingsTab({ user, onNotify, onUserUpdate }) {
    const { shop, refresh } = useProviderJunkshop();
    const [shopForm, setShopForm] = useState({
        name: user?.junkshopName || "",
        phone: user?.phone || "",
        address: "Teresa, Sta. Mesa, Manila",
        hours: "8:00 AM - 6:00 PM",
        lat: "14.5995",
        lng: "121.0055",
    });
    const [savingShop, setSavingShop] = useState(false);

    useEffect(() => {
        if (shop) {
            setShopForm({
                name: shop.name,
                phone: shop.phone,
                address: shop.address,
                hours: shop.hours,
                lat: String(shop.lat ?? 14.5995),
                lng: String(shop.lng ?? 121.0055),
            });
        }
    }, [shop]);

    const handleSaveShop = async (e) => {
        e.preventDefault();
        if (!shopForm.name.trim() || !shopForm.address.trim()) {
            onNotify?.("Shop name and address are required.");
            return;
        }
        setSavingShop(true);
        try {
            const payload = {
                name: shopForm.name.trim(),
                address: shopForm.address.trim(),
                phone: shopForm.phone.trim(),
                hours: shopForm.hours.trim(),
                status: shop?.status || "open",
                location: {
                    lat: Number(shopForm.lat) || 14.5995,
                    lng: Number(shopForm.lng) || 121.0055,
                },
            };
            if (shop?._id) {
                await domainApi.updateJunkshop(shop._id, payload);
            } else {
                await domainApi.createJunkshop(payload);
            }
            await authApiExtended.updateProviderProfile({
                junkshopName: shopForm.name.trim(),
                phone: shopForm.phone.trim(),
                address: shopForm.address.trim(),
            });
            refresh();
            const { user: updated } = await authApi.me();
            onUserUpdate?.(updated);
            onNotify?.("Shop profile saved. Visible on customer map when verification is complete.");
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setSavingShop(false);
        }
    };

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Shop Settings
                </h1>
                <p className="text-[#72796e] mt-2 text-sm">
                    Shop details appear on the customer dashboard map and shop list.
                </p>
            </div>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-3 mb-5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800">
                        <Store size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-[#191c1c]">Shop information</h2>
                        <p className="text-sm text-[#72796e]">
                            Linked to customer map pins and nearby shops.
                        </p>
                    </div>
                </div>
                <form onSubmit={handleSaveShop} className="space-y-4 max-w-xl">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Shop name"
                            value={shopForm.name}
                            onChange={(v) => setShopForm({ ...shopForm, name: v })}
                            required
                        />
                        <Field
                            label="Phone"
                            value={shopForm.phone}
                            onChange={(v) => setShopForm({ ...shopForm, phone: v })}
                        />
                    </div>
                    <Field
                        label="Address"
                        value={shopForm.address}
                        onChange={(v) => setShopForm({ ...shopForm, address: v })}
                        required
                    />
                    <Field
                        label="Hours"
                        value={shopForm.hours}
                        onChange={(v) => setShopForm({ ...shopForm, hours: v })}
                    />
                    <LocationPickerMap
                        lat={shopForm.lat}
                        lng={shopForm.lng}
                        onChange={({ lat, lng, address }) =>
                            setShopForm((prev) => ({
                                ...prev,
                                lat: String(lat),
                                lng: String(lng),
                                ...(address ? { address } : {}),
                            }))
                        }
                    />
                    <button
                        type="submit"
                        disabled={savingShop}
                        className="rounded-xl bg-[#154212] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
                    >
                        {savingShop ? "Saving..." : "Save shop profile"}
                    </button>
                </form>
            </section>

            <section className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6 shadow-sm">
                <h2 className="text-lg font-bold text-[#191c1c] mb-1">Customer reviews</h2>
                <p className="text-sm text-[#72796e] mb-4">
                    Ratings from completed pickups. Same scores customers see on the public shop listing.
                </p>
                {!shop ? (
                    <p className="text-sm text-[#72796e]">
                        Save your shop profile first to collect customer reviews.
                    </p>
                ) : shop.reviewCount > 0 || shop.rating > 0 ? (
                    <div>
                        <ShopRating shop={shop} className="mb-2" />
                        <PartnerReviews shop={shop} />
                    </div>
                ) : (
                    <p className="text-sm text-[#72796e]">
                        No customer reviews yet. Ratings appear here after completed pickups are rated.
                    </p>
                )}
            </section>
        </div>
    );
}

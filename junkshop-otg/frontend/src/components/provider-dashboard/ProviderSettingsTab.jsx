import { useEffect, useRef, useState } from "react";
import { Camera, Store, X } from "lucide-react";
import { authApiExtended, domainApi, authApi } from "../../services/api";
import { useProviderJunkshop } from "../../hooks/useProviderData";
import NumberInput from "../ui/NumberInput";
import LocationPickerMap from "../maps/LocationPickerMap";
import ShopRating from "../ui/ShopRating";
import PartnerReviews from "../ui/PartnerReviews";

const PH_GCASH_PATTERN = /^09\d{9}$/;

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

function GcashQrUpload({ preview, onPreviewChange, onClear }) {
    const inputRef = useRef(null);

    const handleFile = (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return;
        }

        const reader = new FileReader();
        reader.onload = () => onPreviewChange(reader.result);
        reader.readAsDataURL(file);
        e.target.value = "";
    };

    const openPicker = () => inputRef.current?.click();

    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#42493e]">
                GCash QR image (optional)
            </label>
            <p className="text-xs text-[#72796e]">
                Upload your GCash QR code. Saved with your pickup payment info.
            </p>

            <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFile}
            />

            {preview ? (
                <div className="relative w-full max-w-[220px]">
                    <div className="aspect-square w-full rounded-xl border border-[#c2c9bb] bg-white overflow-hidden flex items-center justify-center p-2">
                        <img
                            src={preview}
                            alt="GCash QR preview"
                            className="max-w-full max-h-full w-auto h-auto object-contain"
                        />
                    </div>
                    <button
                        type="button"
                        onClick={onClear}
                        className="absolute -top-2 -right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-700"
                        aria-label="Remove QR image"
                    >
                        <X size={14} />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={openPicker}
                    className="flex flex-col items-center justify-center gap-2 w-full max-w-[220px] aspect-square rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40 cursor-pointer hover:bg-emerald-50/70 transition-colors"
                >
                    <Camera className="w-8 h-8 text-emerald-700" />
                    <span className="text-xs font-semibold text-[#154212] text-center px-3">
                        Tap to upload QR image
                    </span>
                </button>
            )}

            {preview && (
                <button
                    type="button"
                    onClick={openPicker}
                    className="text-xs font-semibold text-emerald-700 hover:underline"
                >
                    Replace image
                </button>
            )}
        </div>
    );
}

export default function ProviderSettingsTab({ user, onNotify, onUserUpdate }) {
    const { shop, refresh } = useProviderJunkshop();
    const [pickupProfile, setPickupProfile] = useState({
        pickupServiceFee: user?.pickupServiceFee ?? 0,
        gcashNumber: user?.gcashNumber || "",
        gcashQrUrl: user?.gcashQrUrl || "",
        pickupEnabled: user?.pickupEnabled !== false,
    });
    const [shopForm, setShopForm] = useState({
        name: user?.junkshopName || "",
        phone: user?.phone || "",
        address: "Teresa, Sta. Mesa, Manila",
        hours: "8:00 AM - 6:00 PM",
        lat: "14.5995",
        lng: "121.0055",
    });
    const [savingPickup, setSavingPickup] = useState(false);
    const [savingShop, setSavingShop] = useState(false);
    const [pickupErrors, setPickupErrors] = useState({});
    const [gcashQrPreview, setGcashQrPreview] = useState(null);

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

    useEffect(() => {
        setPickupProfile({
            pickupServiceFee: user?.pickupServiceFee ?? 0,
            gcashNumber: user?.gcashNumber || "",
            gcashQrUrl: user?.gcashQrUrl || "",
            pickupEnabled: user?.pickupEnabled !== false,
        });
        if (user?.gcashQrUrl) {
            setGcashQrPreview(user.gcashQrUrl);
        }
    }, [user]);

    const handleServiceFeeChange = (raw) => {
        if (raw === "" || raw === "-") {
            setPickupProfile({ ...pickupProfile, pickupServiceFee: 0 });
            return;
        }

        const parsed = Number(raw);
        if (Number.isNaN(parsed)) return;

        setPickupProfile({
            ...pickupProfile,
            pickupServiceFee: Math.max(0, parsed),
        });
        setPickupErrors((prev) => ({ ...prev, pickupServiceFee: "" }));
    };

    const handleGcashNumberChange = (raw) => {
        const digits = raw.replace(/\D/g, "").slice(0, 11);
        setPickupProfile({ ...pickupProfile, gcashNumber: digits });
        setPickupErrors((prev) => ({ ...prev, gcashNumber: "" }));
    };

    const validatePickupForm = () => {
        const errors = {};

        if (pickupProfile.pickupServiceFee <= 0) {
            errors.pickupServiceFee = "Home pickups need a service fee greater than ₱0.";
        }

        const number = pickupProfile.gcashNumber.trim();
        if (number && !PH_GCASH_PATTERN.test(number)) {
            errors.gcashNumber = "Invalid mobile number format. Use 09XXXXXXXXX (11 digits).";
        }

        setPickupErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSavePickup = async (e) => {
        e.preventDefault();

        if (!validatePickupForm()) {
            onNotify?.("Please fix the errors before saving.");
            return;
        }

        setSavingPickup(true);
        try {
            const { user: updated } = await authApiExtended.updateProviderProfile({
                pickupServiceFee: pickupProfile.pickupServiceFee,
                gcashNumber: pickupProfile.gcashNumber,
                gcashQrUrl: pickupProfile.gcashQrUrl,
                pickupEnabled: pickupProfile.pickupEnabled,
            });
            onUserUpdate?.(updated);
            onNotify?.("Pickup & GCash settings saved.");
        } catch (err) {
            onNotify?.(err.message);
        } finally {
            setSavingPickup(false);
        }
    };

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

            <section className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-5 sm:p-6">
                <h2 className="text-lg font-bold text-[#154212] mb-1">Pickup &amp; GCash</h2>
                <p className="text-sm text-[#72796e] mb-4">
                    Shown to customers after you accept a home pickup. Drop-offs do not use this fee.
                </p>
                <form onSubmit={handleSavePickup} className="space-y-4 max-w-lg">
                    <Field
                        label="Service fee (₱)"
                        type="number"
                        min={1}
                        value={String(pickupProfile.pickupServiceFee)}
                        onChange={handleServiceFeeChange}
                        error={pickupErrors.pickupServiceFee}
                    />
                    <Field
                        label="GCash mobile number"
                        value={pickupProfile.gcashNumber}
                        onChange={handleGcashNumberChange}
                        inputMode="numeric"
                        maxLength={11}
                        placeholder="09XXXXXXXXX"
                        error={pickupErrors.gcashNumber}
                    />
                    <GcashQrUpload
                        preview={gcashQrPreview}
                        onPreviewChange={(dataUrl) => {
                            setGcashQrPreview(dataUrl);
                            setPickupProfile((prev) => ({ ...prev, gcashQrUrl: dataUrl }));
                        }}
                        onClear={() => {
                            setGcashQrPreview(null);
                            setPickupProfile((prev) => ({ ...prev, gcashQrUrl: "" }));
                        }}
                    />
                    <button
                        type="submit"
                        disabled={savingPickup}
                        className="rounded-xl bg-[#154212] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
                    >
                        {savingPickup ? "Saving..." : "Save pickup payment info"}
                    </button>
                </form>
            </section>

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

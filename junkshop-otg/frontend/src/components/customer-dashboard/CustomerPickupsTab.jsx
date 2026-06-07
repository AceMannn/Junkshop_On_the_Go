import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Truck,
    Plus,
    MapPin,
    Star,
    X,
    ChevronRight,
    ChevronLeft,
    CheckCircle,
    Navigation,
    CreditCard,
} from "lucide-react";
import { pickupApi } from "../../services/api";
import { useCatalogJunkshops, useCatalogMaterials } from "../../hooks/useCatalogData";
import NumberInput from "../ui/NumberInput";
import EmptyState from "../ui/EmptyState";
import { REFRESH_INTERVAL_MS, REFRESH_INTERVAL_FAST_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    TIME_SLOTS,
    STATUS_LABELS,
    STATUS_STYLES,
    formatPickupSchedule,
    getShopName,
    materialsSummary,
    canCustomerCancel,
    mapsLink,
} from "../../utils/pickupHelpers";
import { getUserFullName } from "../../utils/userDisplay";

const STEPS = ["Type", "Shop", "Materials", "Schedule", "Contact", "Review"];

export default function CustomerPickupsTab({
    user,
    onNotify,
    onGoProfile,
    openWizardOnMount = false,
}) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("active");
    const [wizardOpen, setWizardOpen] = useState(openWizardOnMount);
    const [selectedId, setSelectedId] = useState(null);
    const { shops } = useCatalogJunkshops({ partnersOnly: true });

    const load = useCallback(
        async (silent = false) => {
            try {
                if (!silent) setLoading(true);
                const { requests: rows } = await pickupApi.list();
                setRequests(rows || []);
            } catch (err) {
                if (!silent) onNotify?.(err.message);
            } finally {
                if (!silent) setLoading(false);
            }
        },
        [onNotify]
    );

    useEffect(() => {
        load(false);
    }, [load]);

    useEffect(() => {
        if (openWizardOnMount && user?.profileComplete) {
            setWizardOpen(true);
        }
    }, [openWizardOnMount, user?.profileComplete]);

    const startWizard = () => {
        if (!user?.profileComplete) {
            onNotify?.("Add your mobile number in Profile Settings before booking a pickup.");
            onGoProfile?.();
            return;
        }
        setWizardOpen(true);
    };

    useAutoRefresh(() => load(true), { intervalMs: REFRESH_INTERVAL_MS });

    const selected = useMemo(
        () => requests.find((r) => r.id === selectedId),
        [requests, selectedId]
    );

    const filtered = useMemo(() => {
        const active = ["pending", "accepted", "in_transit"];
        const past = ["completed", "cancelled", "rejected"];
        return requests.filter((r) =>
            filter === "active" ? active.includes(r.status) : past.includes(r.status)
        );
    }, [requests, filter]);

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1c]">My Pickups</h1>
                    <p className="text-[#72796e] mt-2 text-sm sm:text-base max-w-xl">
                        Book home pickup or drop-off. Pay service fee via GCash after a shop accepts —
                        not for your recyclables.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={startWizard}
                    className="inline-flex items-center justify-center gap-2 bg-[#154212] text-white px-5 py-3 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors"
                >
                    <Plus size={18} />
                    New pickup
                </button>
            </div>

            <div className="flex gap-2">
                {["active", "past"].map((key) => (
                    <button
                        key={key}
                        type="button"
                        onClick={() => setFilter(key)}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${filter === key
                            ? "bg-[#154212] text-white"
                            : "bg-white border border-zinc-200 text-[#72796e] hover:bg-zinc-50"
                            }`}
                    >
                        {key === "active" ? "Active" : "Past"}
                    </button>
                ))}
            </div>

            {loading ? (
                <p className="text-sm text-[#72796e] animate-pulse">Loading pickups…</p>
            ) : filtered.length === 0 ? (
                <div className="bg-white border border-zinc-200 rounded-2xl p-10 text-center">
                    <Truck className="mx-auto text-emerald-700 mb-3" size={40} />
                    <p className="font-semibold text-[#191c1c]">No {filter} pickups yet</p>
                    <p className="text-sm text-[#72796e] mt-1">Book your first scheduled pickup.</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {filtered.map((req) => (
                        <button
                            key={req.id}
                            type="button"
                            onClick={() => setSelectedId(req.id)}
                            className="text-left bg-white border border-zinc-200 rounded-2xl p-5 hover:border-emerald-300 hover:shadow-md transition-all"
                        >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                                <div>
                                    <p className="font-bold text-[#191c1c]">{getShopName(req)}</p>
                                    <p className="text-xs text-[#72796e] mt-0.5">
                                        {formatPickupSchedule(req)} · {req.requestType === "drop_off" ? "Drop-off" : "Home pickup"}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[req.status] || ""}`}
                                >
                                    {STATUS_LABELS[req.status] || req.status}
                                </span>
                            </div>
                            <p className="text-sm text-[#42493e] mt-2 line-clamp-1">
                                {materialsSummary(req.materials)} · {req.estimatedWeightKg} kg
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {wizardOpen && (
                <PickupWizard
                    user={user}
                    shops={shops}
                    onClose={() => setWizardOpen(false)}
                    onSuccess={(msg) => {
                        setWizardOpen(false);
                        onNotify?.(msg);
                        load();
                    }}
                />
            )}

            {selected && (
                <PickupDetailModal
                    request={selected}
                    onClose={() => setSelectedId(null)}
                    onRefresh={load}
                    onNotify={onNotify}
                />
            )}
        </div>
    );
}

function PickupWizard({ user, shops, onClose, onSuccess }) {
    const { materials: catalogMaterials } = useCatalogMaterials({ autoRefresh: false });
    const [step, setStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [requestType, setRequestType] = useState("home_pickup");
    const [assignmentMode, setAssignmentMode] = useState("specific");
    const [junkshopId, setJunkshopId] = useState("");
    const [selectedMaterials, setSelectedMaterials] = useState([]);
    const [estimatedWeightKg, setEstimatedWeightKg] = useState("");
    const [scheduledDate, setScheduledDate] = useState("");
    const [timeSlot, setTimeSlot] = useState("morning");
    const [contactName, setContactName] = useState(getUserFullName(user));
    const [contactPhone, setContactPhone] = useState(user?.phone || "");
    const [contactEmail, setContactEmail] = useState(user?.email || "");
    const [address, setAddress] = useState(user?.address || "");
    const [notes, setNotes] = useState("");

    const openShops = shops.filter((s) => {
        const closed = String(s.status).toLowerCase() === "closed";
        return !closed || requestType === "drop_off";
    });

    const selectedShop = shops.find(
        (s) => String(s._id || s.id) === String(junkshopId)
    );

    const materialOptions =
        assignmentMode === "specific" &&
        junkshopId &&
        selectedShop?.listingPrices?.length > 0
            ? selectedShop.listingPrices.map((m, i) => ({
                  catalogId: `shop-${m.name}-${i}`,
                  name: m.name,
                  category: m.category,
              }))
            : catalogMaterials.map((m) => ({
                  catalogId: m.id,
                  name: m.material,
                  category: m.category,
              }));

    const toggleMaterial = (item) => {
        setSelectedMaterials((prev) => {
            const exists = prev.find((m) => m.catalogId === item.catalogId);
            if (exists) return prev.filter((m) => m.catalogId !== item.catalogId);
            return [...prev, item];
        });
    };

    const validateStep = () => {
        setError("");
        if (step === 0) return true;
        if (step === 1) {
            if (assignmentMode === "specific" && !junkshopId) {
                setError("Select a junkshop or choose nearest available.");
                return false;
            }
            return true;
        }
        if (step === 2) {
            if (selectedMaterials.length === 0) {
                setError("Select at least one material.");
                return false;
            }
            return true;
        }
        if (step === 3) {
            if (!scheduledDate || !estimatedWeightKg || Number(estimatedWeightKg) < 0.1) {
                setError("Scheduled date and estimated weight (kg) are required.");
                return false;
            }
            return true;
        }
        if (step === 4) {
            if (!contactName.trim() || !address.trim()) {
                setError("Name and address are required.");
                return false;
            }
            return true;
        }
        return true;
    };

    const handleNext = () => {
        if (!validateStep()) return;
        setStep((s) => Math.min(s + 1, STEPS.length - 1));
    };

    const handleSubmit = async () => {
        if (!validateStep()) return;
        setSubmitting(true);
        try {
            await pickupApi.create({
                requestType,
                assignmentMode,
                junkshopId: assignmentMode === "specific" ? junkshopId : undefined,
                contactName: contactName.trim(),
                contactPhone: contactPhone.trim(),
                contactEmail: contactEmail.trim(),
                materials: selectedMaterials,
                estimatedWeightKg: Number(estimatedWeightKg),
                scheduledDate,
                timeSlot,
                address: address.trim(),
                notes: notes.trim(),
            });
            onSuccess("Pickup request submitted! Wait for shop acceptance.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const minDate = new Date().toISOString().slice(0, 10);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
            <div className="bg-white w-full sm:max-w-lg max-h-[92vh] rounded-t-2xl sm:rounded-2xl shadow-xl flex flex-col">
                <div className="flex items-center justify-between px-5 py-4 border-b">
                    <h2 className="font-bold text-[#191c1c]">Book pickup</h2>
                    <button type="button" onClick={onClose} className="p-2 rounded-full hover:bg-zinc-100">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-5 py-2 flex gap-1">
                    {STEPS.map((label, i) => (
                        <div
                            key={label}
                            className={`h-1 flex-1 rounded-full ${i <= step ? "bg-emerald-600" : "bg-zinc-200"}`}
                        />
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
                    {step === 0 && (
                        <>
                            <p className="text-sm text-[#72796e]">How will you hand over recyclables?</p>
                            <div className="grid grid-cols-1 gap-3">
                                {[
                                    { id: "home_pickup", label: "Home pickup", desc: "Shop comes to your address" },
                                    { id: "drop_off", label: "Drop-off at shop", desc: "Bring items to the junkshop" },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setRequestType(opt.id)}
                                        className={`text-left p-4 rounded-xl border-2 transition ${requestType === opt.id
                                            ? "border-emerald-600 bg-emerald-50"
                                            : "border-zinc-200"
                                            }`}
                                    >
                                        <p className="font-semibold">{opt.label}</p>
                                        <p className="text-xs text-[#72796e]">{opt.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </>
                    )}

                    {step === 1 && (
                        <>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: "specific", label: "Choose shop" },
                                    { id: "nearest", label: "Nearest available" },
                                ].map((opt) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => setAssignmentMode(opt.id)}
                                        className={`py-2.5 rounded-xl text-sm font-semibold border ${assignmentMode === opt.id
                                            ? "bg-[#154212] text-white border-[#154212]"
                                            : "border-zinc-200"
                                            }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                            {assignmentMode === "specific" && (
                                <select
                                    value={junkshopId}
                                    onChange={(e) => setJunkshopId(e.target.value)}
                                    className="w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm"
                                >
                                    <option value="">Select junkshop</option>
                                    {openShops.map((s) => (
                                        <option key={s.id} value={s._id || s.id}>
                                            {s.name} {s.status === "closed" ? "(closed)" : ""}
                                        </option>
                                    ))}
                                </select>
                            )}
                        </>
                    )}

                    {step === 2 && (
                        materialOptions.length === 0 ? (
                            <EmptyState
                                compact
                                title="No materials listed yet"
                                description="Choose a verified partner shop with materials, or run npm run seed for reference catalog prices."
                            />
                        ) : (
                            <div className="max-h-56 overflow-y-auto grid grid-cols-1 gap-2">
                                {materialOptions.map((item) => {
                                    const on = selectedMaterials.some(
                                        (m) => m.catalogId === item.catalogId
                                    );
                                    return (
                                        <button
                                            key={item.catalogId}
                                            type="button"
                                            onClick={() => toggleMaterial(item)}
                                            className={`text-left px-3 py-2 rounded-lg border text-sm ${on
                                                ? "border-emerald-500 bg-emerald-50 font-semibold"
                                                : "border-zinc-200"
                                                }`}
                                        >
                                            {item.name}
                                        </button>
                                    );
                                })}
                            </div>
                        )
                    )}

                    {step === 3 && (
                        <>
                            <input
                                type="date"
                                min={minDate}
                                value={scheduledDate}
                                onChange={(e) => setScheduledDate(e.target.value)}
                                className="w-full border rounded-xl px-4 py-3 text-sm"
                            />
                            <select
                                value={timeSlot}
                                onChange={(e) => setTimeSlot(e.target.value)}
                                className="w-full border rounded-xl px-4 py-3 text-sm"
                            >
                                {TIME_SLOTS.map((s) => (
                                    <option key={s.id} value={s.id}>
                                        {s.label}
                                    </option>
                                ))}
                            </select>
                            <NumberInput
                                min={0.1}
                                step={0.1}
                                placeholder="Estimated weight (kg) *"
                                value={estimatedWeightKg}
                                onChange={setEstimatedWeightKg}
                                inputClassName="w-full border rounded-xl px-4 py-3 pr-11 text-sm outline-none focus:ring-2 focus:ring-[#154212]/20"
                            />
                        </>
                    )}

                    {step === 4 && (
                        <>
                            <input
                                className="w-full border rounded-xl px-4 py-3 text-sm"
                                placeholder="Full name *"
                                value={contactName}
                                onChange={(e) => setContactName(e.target.value)}
                            />
                            <input
                                className="w-full border rounded-xl px-4 py-3 text-sm"
                                placeholder="Phone"
                                value={contactPhone}
                                onChange={(e) => setContactPhone(e.target.value)}
                            />
                            <input
                                className="w-full border rounded-xl px-4 py-3 text-sm"
                                placeholder="Email (optional)"
                                value={contactEmail}
                                onChange={(e) => setContactEmail(e.target.value)}
                            />
                            <textarea
                                rows={3}
                                className="w-full border rounded-xl px-4 py-3 text-sm resize-none"
                                placeholder={requestType === "drop_off" ? "Notes (shop address used on accept)" : "Pickup address *"}
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                            />
                            <textarea
                                rows={2}
                                className="w-full border rounded-xl px-4 py-3 text-sm resize-none"
                                placeholder="Notes for driver"
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                            />
                        </>
                    )}

                    {step === 5 && (
                        <div className="text-sm space-y-2 bg-zinc-50 rounded-xl p-4">
                            <p><strong>Type:</strong> {requestType === "drop_off" ? "Drop-off" : "Home pickup"}</p>
                            <p><strong>Shop:</strong> {assignmentMode === "nearest" ? "Nearest available" : openShops.find((s) => s.id === junkshopId)?.name}</p>
                            <p><strong>Materials:</strong> {materialsSummary(selectedMaterials)}</p>
                            <p><strong>Weight:</strong> {estimatedWeightKg} kg</p>
                            <p><strong>When:</strong> {scheduledDate} ({timeSlot})</p>
                            <p><strong>Address:</strong> {address}</p>
                            <p className="text-xs text-[#72796e] pt-2">
                                Service fee is paid via GCash after a shop accepts — not for your recyclables.
                            </p>
                        </div>
                    )}

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
                    )}
                </div>

                <div className="flex gap-2 px-5 py-4 border-t">
                    {step > 0 && (
                        <button
                            type="button"
                            onClick={() => setStep((s) => s - 1)}
                            className="flex-1 py-3 rounded-xl border font-semibold text-sm"
                        >
                            <ChevronLeft size={16} className="inline mr-1" />
                            Back
                        </button>
                    )}
                    {step < STEPS.length - 1 ? (
                        <button
                            type="button"
                            onClick={handleNext}
                            className="flex-1 py-3 rounded-xl bg-[#154212] text-white font-semibold text-sm"
                        >
                            Next
                            <ChevronRight size={16} className="inline ml-1" />
                        </button>
                    ) : (
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="flex-1 py-3 rounded-xl bg-[#154212] text-white font-semibold text-sm disabled:opacity-50"
                        >
                            {submitting ? "Submitting…" : "Submit request"}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

function PickupDetailModal({ request, onClose, onRefresh, onNotify }) {
    const [rating, setRating] = useState(request.rating?.score || 0);
    const [comment, setComment] = useState("");
    const [live, setLive] = useState(request);

    useEffect(() => {
        setLive(request);
    }, [request]);

    const refreshDetail = useCallback(async () => {
        try {
            const { request: r } = await pickupApi.get(request.id);
            setLive(r);
        } catch {
            /* ignore silent poll errors */
        }
    }, [request.id]);

    useEffect(() => {
        refreshDetail();
    }, [refreshDetail, request]);

    const detailStatus = live.status || request.status;
    const detailPollMs =
        detailStatus === "in_transit" ? REFRESH_INTERVAL_FAST_MS : REFRESH_INTERVAL_MS;

    useAutoRefresh(refreshDetail, { intervalMs: detailPollMs });

    const loc = live.providerLocation;
    const mapUrl = loc?.lat != null ? mapsLink(loc.lat, loc.lng) : null;

    const handleCancel = async () => {
        try {
            await pickupApi.updateStatus(request.id, "cancelled");
            onNotify?.("Pickup cancelled.");
            onRefresh();
            onClose();
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    const handlePaid = async () => {
        try {
            await pickupApi.markServiceFeePaid(request.id);
            onNotify?.("Marked as paid. Thank you!");
            onRefresh();
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    const handleRate = async () => {
        if (!rating) return;
        try {
            await pickupApi.rate(request.id, { score: rating, comment });
            onNotify?.("Thanks for your rating!");
            onRefresh();
            onClose();
        } catch (err) {
            onNotify?.(err.message);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40">
            <div className="bg-white w-full max-w-md h-full overflow-y-auto shadow-xl">
                <div className="sticky top-0 bg-white border-b px-5 py-4 flex justify-between items-center">
                    <h2 className="font-bold">Pickup details</h2>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-5 space-y-5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[live.status]}`}>
                        {STATUS_LABELS[live.status]}
                    </span>

                    <div className="space-y-1 text-sm">
                        <p className="font-semibold text-lg">{getShopName(live)}</p>
                        <p className="text-[#72796e]">{formatPickupSchedule(live)}</p>
                        <p>{materialsSummary(live.materials)} · {live.estimatedWeightKg} kg</p>
                        <p className="flex items-start gap-1 text-[#42493e]">
                            <MapPin size={14} className="shrink-0 mt-0.5" />
                            {live.address}
                        </p>
                    </div>

                    {live.status === "rejected" && (
                        <p className="text-sm bg-red-50 text-red-800 rounded-xl p-3 border border-red-100">
                            {live.rejectMessage || live.rejectReason}
                        </p>
                    )}

                    {live.status === "accepted" && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
                            <p className="text-sm font-semibold text-emerald-900 flex items-center gap-2">
                                <CreditCard size={18} />
                                Service fee: ₱{live.serviceFee || 0}
                            </p>
                            {live.gcashNumber && (
                                <p className="text-sm">
                                    GCash: <strong>{live.gcashNumber}</strong>
                                </p>
                            )}
                            {live.gcashQrUrl && (
                                <img src={live.gcashQrUrl} alt="GCash QR" className="max-w-[200px] rounded-lg border" />
                            )}
                            {!live.serviceFeePaid ? (
                                <button
                                    type="button"
                                    onClick={handlePaid}
                                    className="w-full py-2.5 bg-[#154212] text-white rounded-xl text-sm font-semibold"
                                >
                                    I&apos;ve sent the service fee
                                </button>
                            ) : (
                                <p className="text-xs text-emerald-700 flex items-center gap-1">
                                    <CheckCircle size={14} /> Service fee marked paid
                                </p>
                            )}
                        </div>
                    )}

                    {live.status === "in_transit" && mapUrl && (
                        <a
                            href={mapUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 text-sm font-semibold text-emerald-800 hover:underline"
                        >
                            <Navigation size={16} />
                            Track pickup on map (OpenStreetMap)
                        </a>
                    )}

                    {live.status === "completed" && !live.rating?.score && (
                        <div className="border rounded-xl p-4 space-y-3">
                            <p className="font-semibold text-sm">Rate this pickup</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <button key={n} type="button" onClick={() => setRating(n)}>
                                        <Star
                                            size={28}
                                            className={n <= rating ? "text-amber-400 fill-amber-400" : "text-zinc-300"}
                                        />
                                    </button>
                                ))}
                            </div>
                            <textarea
                                rows={2}
                                placeholder="Optional comment"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                className="w-full border rounded-lg px-3 py-2 text-sm"
                            />
                            <button
                                type="button"
                                onClick={handleRate}
                                className="w-full py-2 bg-[#154212] text-white rounded-xl text-sm font-semibold"
                            >
                                Submit rating
                            </button>
                        </div>
                    )}

                    {canCustomerCancel(live.status) && (
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="w-full py-2.5 border border-red-200 text-red-700 rounded-xl text-sm font-semibold"
                        >
                            Cancel request
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

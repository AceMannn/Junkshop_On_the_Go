import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Truck,
    Plus,
    MapPin,
    Star,
    X,
    CheckCircle,
} from "lucide-react";
import { pickupApi } from "../../services/api";
import { useCatalogJunkshops } from "../../hooks/useCatalogData";
import PickupWizard from "./PickupWizard";
import { REFRESH_INTERVAL_MS, REFRESH_INTERVAL_FAST_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    STATUS_LABELS,
    STATUS_STYLES,
    formatPickupSchedule,
    getShopName,
    materialsSummary,
    canCustomerCancel,
} from "../../utils/pickupHelpers";
import { formatReviewDate } from "../../utils/reviewFormat";
import PickupTrackingMap, { formatLastUpdated } from "../maps/PickupTrackingMap";
import PickupDetailDrawerShell from "../ui/PickupDetailDrawerShell";
import {
    estimateDropOffPoints,
    formatPoints,
    POINTS_PER_KG,
} from "../../utils/pickupPoints";

export default function CustomerPickupsTab({
    user,
    onNotify,
    onGoProfile,
    openWizardOnMount = false,
    focusPickupId = null,
    onFocusHandled,
    onUserUpdate,
    wizardPrefill = null,
    openWizardSignal = 0,
}) {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("active");
    const [wizardOpen, setWizardOpen] = useState(openWizardOnMount);
    const [wizardSeed, setWizardSeed] = useState(wizardPrefill);
    const [selectedId, setSelectedId] = useState(null);
    const { shops } = useCatalogJunkshops({ partnersOnly: true });
    const onNotifyRef = useRef(onNotify);
    onNotifyRef.current = onNotify;

    const load = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const { requests: rows } = await pickupApi.list();
            setRequests(rows || []);
        } catch (err) {
            if (!silent) onNotifyRef.current?.(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    useEffect(() => {
        if (openWizardSignal > 0) {
            setWizardSeed(wizardPrefill);
            setWizardOpen(true);
        }
    }, [openWizardSignal, wizardPrefill]);

    useEffect(() => {
        if (openWizardOnMount && user?.profileComplete) {
            setWizardOpen(true);
        }
    }, [openWizardOnMount, user?.profileComplete]);

    useEffect(() => {
        if (!focusPickupId) return;
        setSelectedId(focusPickupId);
        onFocusHandled?.();
    }, [focusPickupId, onFocusHandled]);

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
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-[#191c1c]">My Pickups</h1>
                    <p className="text-[#72796e] mt-2 text-sm sm:text-base max-w-xl">
                        Book home pickup or drop-off at a partner junkshop. Pickups are free â€” the shop pays you for your materials.
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

            {loading && requests.length === 0 ? (
                <p className="text-sm text-[#72796e] animate-pulse">Loading pickupsâ€¦</p>
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
                                        {formatPickupSchedule(req)} Â· {req.requestType === "drop_off" ? "Drop-off" : "Home pickup"}
                                    </p>
                                </div>
                                <span
                                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[req.status] || ""}`}
                                >
                                    {STATUS_LABELS[req.status] || req.status}
                                </span>
                            </div>
                            <p className="text-sm text-[#42493e] mt-2 line-clamp-1">
                                {materialsSummary(req.materials)} Â· {req.estimatedWeightKg} kg
                            </p>
                        </button>
                    ))}
                </div>
            )}

            {wizardOpen && (
                <PickupWizard
                    user={user}
                    shops={shops}
                    prefill={wizardSeed}
                    onClose={() => {
                        setWizardOpen(false);
                        setWizardSeed(null);
                    }}
                    onSuccess={(msg) => {
                        setWizardOpen(false);
                        setWizardSeed(null);
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
                    onUserUpdate={onUserUpdate}
                />
            )}
        </div>
    );
}


function PickupDetailModal({ request, onClose, onRefresh, onNotify, onUserUpdate }) {
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
            if (r.status === "completed" && r.pointsAwarded > 0) {
                onUserUpdate?.();
            }
        } catch {
            /* ignore silent poll errors */
        }
    }, [request.id, onUserUpdate]);

    useEffect(() => {
        refreshDetail();
    }, [refreshDetail, request]);

    const detailStatus = live.status || request.status;
    const detailPollMs =
        detailStatus === "in_transit" ? REFRESH_INTERVAL_FAST_MS : REFRESH_INTERVAL_MS;

    useAutoRefresh(refreshDetail, { intervalMs: detailPollMs });

    const isHomePickup = live.requestType !== "drop_off";
    const isDropOff = !isHomePickup;

    const showTrackingMap =
        isHomePickup && ["accepted", "in_transit"].includes(live.status);
    const showDropOffMap = isDropOff && live.status === "accepted";
    const showLiveRoute = live.status === "in_transit" && live.providerLocation?.lat != null;

    const loc = live.providerLocation;

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
        <PickupDetailDrawerShell onClose={onClose}>
            <div className="md:hidden flex justify-center pt-2.5 pb-1 shrink-0">
                <div className="h-1 w-10 rounded-full bg-zinc-300" aria-hidden="true" />
            </div>
            <div className="shrink-0 border-b bg-white px-5 py-4 flex justify-between items-center">
                <h2 className="font-bold">Pickup details</h2>
                <button type="button" onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full">
                    <X size={20} />
                </button>
            </div>

            <div className="scroll-y-clean min-h-0 flex-1 overflow-x-hidden p-5 space-y-5">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[live.status]}`}>
                        {STATUS_LABELS[live.status]}
                    </span>

                    <div className="space-y-1 text-sm">
                        <p className="font-semibold text-lg">{getShopName(live)}</p>
                        <p className="text-[#72796e]">{formatPickupSchedule(live)}</p>
                        <p>{materialsSummary(live.materials)} Â· {live.estimatedWeightKg} kg</p>
                        <p className="flex items-start gap-1 text-[#42493e]">
                            <MapPin size={14} className="shrink-0 mt-0.5" />
                            {live.address}
                        </p>
                    </div>

                    {showTrackingMap && (
                        <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <p className="text-sm font-semibold text-[#191c1c]">
                                    {live.status === "in_transit" ? "Live pickup tracking" : "Pickup location"}
                                </p>
                                {live.status === "in_transit" && (
                                    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-700">
                                        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                                        On the way
                                    </span>
                                )}
                            </div>
                            {live.status === "accepted" && (
                                <p className="text-xs text-[#72796e]">
                                    Your provider will share live location when they mark the pickup as in transit.
                                </p>
                            )}
                            {live.status === "in_transit" && !loc?.lat && (
                                <p className="text-xs text-[#72796e]">
                                    Waiting for provider locationâ€¦
                                </p>
                            )}
                            {loc?.updatedAt && (
                                <p className="text-xs text-[#72796e]">
                                    {formatLastUpdated(loc.updatedAt)}
                                </p>
                            )}
                            <PickupTrackingMap
                                address={live.address}
                                destination={live.pickupLocation}
                                provider={live.providerLocation}
                                showRoute={showLiveRoute}
                                minHeight="240px"
                            />
                        </div>
                    )}

                    {live.status === "rejected" && (
                        <p className="text-sm bg-red-50 text-red-800 rounded-xl p-3 border border-red-100">
                            {live.rejectMessage || live.rejectReason}
                        </p>
                    )}

                    {showDropOffMap && (
                        <div className="rounded-xl border border-zinc-200 bg-white p-3 space-y-2">
                            <p className="text-sm font-semibold text-[#191c1c]">Drop-off location</p>
                            <p className="text-xs text-[#72796e]">
                                Visit the shop during your scheduled time with your recyclables.
                            </p>
                            <PickupTrackingMap
                                address={live.address}
                                destination={live.pickupLocation}
                                minHeight="220px"
                            />
                        </div>
                    )}

                    {isDropOff && live.status === "accepted" && (
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-2">
                            <p className="text-sm font-semibold text-amber-900">Estimated reward</p>
                            <p className="text-2xl font-bold text-[#154212]">
                                ~{formatPoints(estimateDropOffPoints(live.estimatedWeightKg))} pts
                            </p>
                            <p className="text-xs text-[#72796e]">
                                {live.estimatedWeightKg} kg Ã— {POINTS_PER_KG} pts/kg â€” final points when the shop weighs your items.
                            </p>
                        </div>
                    )}

                    {isDropOff && live.status === "completed" && live.pointsAwarded > 0 && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-1">
                            <p className="text-sm font-semibold text-emerald-900">Points earned</p>
                            <p className="text-2xl font-bold text-[#154212]">
                                +{formatPoints(live.pointsAwarded)} pts
                            </p>
                            {live.actualWeightKg != null && (
                                <p className="text-xs text-[#72796e]">
                                    Based on {live.actualWeightKg} kg weighed at the shop.
                                </p>
                            )}
                        </div>
                    )}

                    {live.status === "accepted" && isHomePickup && (
                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-900">
                            <p className="font-semibold flex items-center gap-2">
                                <CheckCircle size={18} />
                                Pickup accepted
                            </p>
                            <p className="text-xs mt-1 text-emerald-800">
                                The shop accepted your request. Wait for your scheduled pickup date - no payment required from you.
                            </p>
                        </div>
                    )}

                    {live.status === "accepted" && isDropOff && (
                        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-900">
                            <p className="font-semibold">Drop-off accepted</p>
                            <p className="text-xs mt-1 text-blue-800">
                                Bring your items to the shop address above during your scheduled slot.
                            </p>
                        </div>
                    )}

                    {live.status === "completed" && live.rating?.score && (
                        <div className="border rounded-xl p-4 space-y-2 bg-amber-50/50 border-amber-100">
                            <p className="font-semibold text-sm">Your rating</p>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((n) => (
                                    <Star
                                        key={n}
                                        size={22}
                                        className={
                                            n <= live.rating.score
                                                ? "text-amber-400 fill-amber-400"
                                                : "text-zinc-300"
                                        }
                                    />
                                ))}
                            </div>
                            {live.rating.comment ? (
                                <p className="text-sm text-[#42493e]">{live.rating.comment}</p>
                            ) : null}
                            {live.rating.createdAt ? (
                                <p className="text-xs text-[#72796e]">
                                    Rated on {formatReviewDate(live.rating.createdAt)}
                                </p>
                            ) : null}
                            <p className="text-xs text-[#72796e]">
                                Ratings cannot be changed after submission.
                            </p>
                        </div>
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
        </PickupDetailDrawerShell>
    );
}

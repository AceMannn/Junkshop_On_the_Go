import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Truck,
    CheckCircle,
    XCircle,
    Clock3,
    Eye,
    MapPin,
    Star,
    X,
    TrendingUp,
} from "lucide-react";

const REQUEST_STAT_COLORS = {
    amber: { iconBg: "bg-amber-100",   iconText: "text-amber-700",   border: "border-t-amber-400"   },
    blue:  { iconBg: "bg-blue-100",    iconText: "text-blue-700",    border: "border-t-blue-400"    },
    green: { iconBg: "bg-emerald-100", iconText: "text-emerald-700", border: "border-t-emerald-400" },
    teal:  { iconBg: "bg-teal-100",    iconText: "text-teal-700",    border: "border-t-teal-400"    },
};

const REQUEST_STATUS_BORDERS = {
    "Pending":    "border-l-amber-400",
    "Accepted":   "border-l-blue-400",
    "In Transit": "border-l-indigo-400",
    "Completed":  "border-l-emerald-500",
    "Declined":   "border-l-red-300",
    "Cancelled":  "border-l-zinc-300",
};
import { pickupApi } from "../../services/api";
import { REFRESH_INTERVAL_MS, REFRESH_INTERVAL_FAST_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    STATUS_LABELS,
    STATUS_STYLES,
    formatPickupSchedule,
    formatPeso,
    materialsSummary,
    getCustomerDisplayName,
    pickupEstimatedPayout,
} from "../../utils/pickupHelpers";
import PickupTrackingMap, { formatLastUpdated } from "../maps/PickupTrackingMap";
import NumberInput from "../ui/NumberInput";
import PickupMaterialPhotosGallery from "../ui/PickupMaterialPhotosGallery";
import {
    estimateDropOffPoints,
    formatPoints,
    POINTS_PER_KG,
} from "../../utils/pickupPoints";
import PickupDetailDrawerShell from "../ui/PickupDetailDrawerShell";

function formatWeightKg(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return "—";
    return n.toFixed(2);
}

function PickupCustomerRating({ rating }) {
    const score = Number(rating?.score);
    if (!score || score < 1) {
        return <span className="text-xs text-[#72796e]">Not rated</span>;
    }

    return (
        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
            <Star size={14} className="fill-amber-400 text-amber-400" />
            {score}/5
        </span>
    );
}

function normalizeRow(req) {
    const customer = req.customer;
    return {
        id: req.id,
        customer: getCustomerDisplayName(customer),
        materials: materialsSummary(req.materials),
        weight: req.estimatedWeightKg,
        location: req.address,
        dateTime: formatPickupSchedule(req),
        status: mapStatus(req.status),
        raw: req,
    };
}

function mapStatus(apiStatus) {
    const map = {
        pending: "Pending",
        accepted: "Accepted",
        in_transit: "In Transit",
        completed: "Completed",
        cancelled: "Cancelled",
        rejected: "Declined",
    };
    return map[apiStatus] || apiStatus;
}

function toApiStatus(label) {
    const map = {
        Accepted: "accepted",
        "In Transit": "in_transit",
        Completed: "completed",
        Declined: "rejected",
    };
    return map[label];
}

export default function ProviderPickupRequests({
    focusRequestId = null,
    onFocusHandled,
}) {
    const [activeRequestTab, setActiveRequestTab] = useState("All");
    const [toast, setToast] = useState("");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [presets, setPresets] = useState([]);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectMessage, setRejectMessage] = useState("");
    const [trackingId, setTrackingId] = useState(null);
    const [detailId, setDetailId] = useState(null);
    const [detailLive, setDetailLive] = useState(null);
    const [liveGps, setLiveGps] = useState(null);

    const load = useCallback(async (silent = false) => {
        try {
            if (!silent) setLoading(true);
            const [{ requests: rows }, presetRes] = await Promise.all([
                pickupApi.list(),
                pickupApi.getRejectPresets(),
            ]);
            setRequests((rows || []).map(normalizeRow));
            setPresets(presetRes.presets || []);
            if (presetRes.presets?.length) {
                setRejectReason((prev) => prev || presetRes.presets[0]);
            }
        } catch (err) {
            if (!silent) setToast(err.message);
        } finally {
            if (!silent) setLoading(false);
        }
    }, []);

    useEffect(() => {
        load(false);
    }, [load]);

    useAutoRefresh(() => load(true), { intervalMs: REFRESH_INTERVAL_MS });

    const refreshDetail = useCallback(async () => {
        if (!detailId) return;
        try {
            const { request } = await pickupApi.get(detailId);
            setDetailLive(request);
        } catch {
            /* ignore poll errors */
        }
    }, [detailId]);

    useEffect(() => {
        if (detailId) {
            refreshDetail();
        }
    }, [detailId, refreshDetail]);

    useAutoRefresh(refreshDetail, {
        enabled: Boolean(detailId && detailLive?.status === "in_transit"),
        intervalMs: REFRESH_INTERVAL_FAST_MS,
    });

    useEffect(() => {
        if (!detailId || detailLive?.status !== "in_transit") {
            setLiveGps(null);
            return undefined;
        }
        if (!navigator.geolocation) return undefined;

        const watchId = navigator.geolocation.watchPosition(
            (pos) => {
                setLiveGps({
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude,
                });
            },
            () => {},
            { enableHighAccuracy: true, maximumAge: 15000 }
        );

        return () => navigator.geolocation.clearWatch(watchId);
    }, [detailId, detailLive?.status]);

    const openDetail = async (id) => {
        setDetailId(id);
        try {
            const { request } = await pickupApi.get(id);
            setDetailLive(request);
        } catch (err) {
            showToast(err.message);
            setDetailId(null);
        }
    };

    useEffect(() => {
        if (!focusRequestId) return;
        openDetail(focusRequestId);
        onFocusHandled?.();
    }, [focusRequestId]); // eslint-disable-line react-hooks/exhaustive-deps

    const closeDetail = () => {
        setDetailId(null);
        setDetailLive(null);
        setLiveGps(null);
    };

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 2800);
    };

    const handleAccept = async (id) => {
        try {
            await pickupApi.accept(id);
            showToast("Request accepted.");
            load();
        } catch (err) {
            showToast(err.message);
        }
    };

    const handleReject = async (id) => {
        try {
            await pickupApi.reject(id, {
                reason: rejectReason,
                message: rejectMessage,
            });
            setRejectingId(null);
            setRejectMessage("");
            showToast("Request declined.");
            load();
        } catch (err) {
            showToast(err.message);
        }
    };

    const handleCompleteDropOff = async (id, actualWeight) => {
        try {
            await pickupApi.updateStatus(id, "completed", { actualWeight });
            showToast("Drop-off completed. Points awarded to the customer.");
            setTrackingId(null);
            load();
            closeDetail();
        } catch (err) {
            showToast(err.message);
        }
    };

    const handleCompleteHomePickup = async (id, { actualWeight, totalAmount }) => {
        try {
            await pickupApi.updateStatus(id, "completed", { actualWeight, totalAmount });
            showToast("Pickup completed. Transaction recorded.");
            setTrackingId(null);
            load();
            closeDetail();
        } catch (err) {
            showToast(err.message);
        }
    };

    const handleStatus = async (id, label, extra = {}) => {
        const status = toApiStatus(label);
        if (!status) return;

        try {
            if (label === "In Transit") {
                setTrackingId(id);
                if (!navigator.geolocation) {
                    await pickupApi.updateStatus(id, status, extra);
                    showToast("Marked in transit.");
                    load();
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        await pickupApi.updateStatus(id, status, extra);
                        await pickupApi.updateLocation(
                            id,
                            pos.coords.latitude,
                            pos.coords.longitude
                        );
                        showToast("In transit — location shared with customer.");
                        load();
                    },
                    async () => {
                        await pickupApi.updateStatus(id, status, extra);
                        showToast("In transit (location unavailable).");
                        load();
                    }
                );
                return;
            }

            await pickupApi.updateStatus(id, status, extra);
            if (label === "Completed") {
                setTrackingId(null);
            }
            showToast(`Updated to ${label}.`);
            load();
        } catch (err) {
            showToast(err.message);
        }
    };

    useEffect(() => {
        if (!trackingId) return undefined;
        const interval = setInterval(() => {
            navigator.geolocation?.getCurrentPosition((pos) => {
                pickupApi
                    .updateLocation(trackingId, pos.coords.latitude, pos.coords.longitude)
                    .catch(() => {});
            });
        }, 12000);
        return () => clearInterval(interval);
    }, [trackingId]);

    const filteredRequests = useMemo(() => {
        return requests.filter((request) => {
            if (activeRequestTab === "All") return true;
            if (activeRequestTab === "Scheduled") {
                return ["Pending", "Accepted", "In Transit"].includes(request.status);
            }
            if (activeRequestTab === "History") {
                return ["Completed", "Declined", "Cancelled"].includes(request.status);
            }
            return true;
        });
    }, [requests, activeRequestTab]);

    const pendingCount = requests.filter((r) => r.status === "Pending").length;
    const inTransitCount = requests.filter((r) => r.status === "In Transit").length;
    const completedTodayCount = requests.filter((r) => r.status === "Completed").length;
    const totalVolume = requests.reduce((sum, r) => sum + (Number(r.weight) || 0), 0);
    const totalVolumeLabel = formatWeightKg(totalVolume);

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            {toast && (
                <div className="fixed top-20 right-4 left-4 sm:left-auto z-50 flex items-center gap-3 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl shadow-lg max-w-md sm:ml-auto text-sm font-semibold">
                    {toast}
                </div>
            )}

            <section>
                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#191c1c]">
                    Pickup Requests
                </h1>
                <p className="mt-1.5 text-sm text-[#72796e]">
                    Accept home pickups or drop-offs. Share location when in transit.
                </p>
            </section>

            <section className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
                <RequestStatCard title="Pending" value={pendingCount} unit="requests" icon={Clock3} accentColor="amber" />
                <RequestStatCard title="In Transit" value={inTransitCount} unit="requests" icon={Truck} accentColor="blue" />
                <RequestStatCard title="Completed" value={completedTodayCount} unit="requests" icon={CheckCircle} accentColor="green" />
                <RequestStatCard title="Total Volume" value={totalVolumeLabel} unit="kg" icon={TrendingUp} accentColor="teal" />
            </section>

            <section className="rounded-2xl border border-zinc-200 bg-white p-2 shadow-sm">
                <div className="flex flex-wrap gap-2">
                    {["All", "Scheduled", "History"].map((tab) => (
                        <button
                            key={tab}
                            type="button"
                            onClick={() => setActiveRequestTab(tab)}
                            className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${activeRequestTab === tab
                                ? "bg-[#154212] text-white"
                                : "text-[#72796e] hover:bg-[#f3f4f3]"
                                }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </section>

            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {loading ? (
                    <p className="p-8 text-sm text-[#72796e] animate-pulse">Loading requests…</p>
                ) : filteredRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                        <Truck size={32} className="mb-3 text-[#72796e]" />
                        <h3 className="text-lg font-bold text-[#191c1c]">No pickup requests found</h3>
                        <p className="mt-1 text-sm text-[#72796e]">
                            New customer pickup requests will appear here.
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="md:hidden divide-y divide-zinc-100">
                            {filteredRequests.map((request) => (
                                <div
                                    key={request.id}
                                    className={`p-4 space-y-3 border-l-4 cursor-pointer hover:bg-emerald-50/40 transition-colors active:bg-emerald-50 ${REQUEST_STATUS_BORDERS[request.status] || "border-l-zinc-200"}`}
                                    onClick={() => openDetail(request.id)}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[#191c1c]">{request.customer}</p>
                                            <p className="text-xs text-[#72796e] mt-0.5">
                                                {request.raw.requestType === "drop_off" ? "Drop-off" : "Pickup"}
                                                {" · "}
                                                {request.dateTime}
                                            </p>
                                        </div>
                                        <ProviderStatusBadge status={request.status} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Materials</p>
                                            <p className="text-[#42493e]">{request.materials}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Weight</p>
                                            <p className="font-semibold text-[#154212]">{formatWeightKg(request.weight)} kg</p>
                                        </div>
                                    </div>
                                    {request.status === "Completed" && (
                                        <div>
                                            <p className="text-[10px] uppercase tracking-wide text-[#72796e]">Rating</p>
                                            <PickupCustomerRating rating={request.raw.rating} />
                                        </div>
                                    )}
                                    <div className="flex items-start gap-2 text-sm text-[#42493e]">
                                        <MapPin size={16} className="mt-0.5 shrink-0 text-[#72796e]" />
                                        <span className="break-words">{request.location}</span>
                                    </div>
                                    <div onClick={(e) => e.stopPropagation()}>
                                        <ProviderRequestActions
                                            request={request}
                                            onAccept={handleAccept}
                                            onReject={() => setRejectingId(request.id)}
                                            onUpdateStatus={handleStatus}
                                            onViewDetails={openDetail}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block scroll-x-clean overflow-hidden">
                            <table className="w-full text-left text-sm border-separate border-spacing-0">
                                <thead>
                                    <tr className="bg-[#f3f4f3] text-[#72796e]">
                                        <th className="px-6 py-4 font-semibold rounded-tl-2xl bg-[#f3f4f3]">Customer</th>
                                        <th className="px-6 py-4 font-semibold bg-[#f3f4f3]">Materials</th>
                                        <th className="px-6 py-4 font-semibold bg-[#f3f4f3]">Weight</th>
                                        <th className="px-6 py-4 font-semibold bg-[#f3f4f3]">Location</th>
                                        <th className="px-6 py-4 font-semibold bg-[#f3f4f3]">Date & Time</th>
                                        <th className="px-6 py-4 font-semibold whitespace-nowrap bg-[#f3f4f3]">Status</th>
                                        <th className="px-6 py-4 font-semibold bg-[#f3f4f3]">Rating</th>
                                        <th className="px-6 py-4 text-right font-semibold rounded-tr-2xl bg-[#f3f4f3]">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredRequests.map((request) => (
                                        <tr
                                            key={request.id}
                                            className="cursor-pointer hover:bg-emerald-50/40 transition-colors"
                                            onClick={() => openDetail(request.id)}
                                        >
                                            <td className={`px-6 py-4 border-l-4 ${REQUEST_STATUS_BORDERS[request.status] || "border-l-zinc-200"}`}>
                                                <p className="font-semibold text-[#191c1c]">{request.customer}</p>
                                                <p className="text-xs text-[#72796e]">
                                                    {request.raw.requestType === "drop_off" ? "Drop-off" : "Pickup"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-[#42493e]">{request.materials}</td>
                                            <td className="px-6 py-4 font-semibold text-[#154212]">
                                                {formatWeightKg(request.weight)} kg
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2 text-[#42493e]">
                                                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#72796e]" />
                                                    <span>{request.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#42493e]">{request.dateTime}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <ProviderStatusBadge status={request.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                {request.status === "Completed" ? (
                                                    <PickupCustomerRating rating={request.raw.rating} />
                                                ) : (
                                                    <span className="text-xs text-[#72796e]">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                                <ProviderRequestActions
                                                    request={request}
                                                    onAccept={handleAccept}
                                                    onReject={() => setRejectingId(request.id)}
                                                    onUpdateStatus={handleStatus}
                                                    onViewDetails={openDetail}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </section>

            {detailId && detailLive && (
                <ProviderPickupDetailDrawer
                    request={detailLive}
                    liveGps={liveGps}
                    isSharingLocation={trackingId === detailId}
                    onClose={closeDetail}
                    onRefresh={refreshDetail}
                    onAccept={handleAccept}
                    onReject={() => {
                        closeDetail();
                        setRejectingId(detailId);
                    }}
                    onUpdateStatus={handleStatus}
                    onCompleteDropOff={handleCompleteDropOff}
                    onCompleteHomePickup={handleCompleteHomePickup}
                />
            )}

            {rejectingId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
                        <h3 className="font-bold text-lg">Decline request</h3>
                        <select
                            value={rejectReason}
                            onChange={(e) => setRejectReason(e.target.value)}
                            className="w-full border rounded-xl px-4 py-3 text-sm"
                        >
                            {presets.map((p) => (
                                <option key={p} value={p}>
                                    {p}
                                </option>
                            ))}
                        </select>
                        <textarea
                            rows={3}
                            placeholder="Optional note to customer"
                            value={rejectMessage}
                            onChange={(e) => setRejectMessage(e.target.value)}
                            className="w-full border rounded-xl px-4 py-3 text-sm resize-none"
                        />
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => setRejectingId(null)}
                                className="flex-1 py-2.5 border rounded-xl text-sm font-semibold"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => handleReject(rejectingId)}
                                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold"
                            >
                                Decline
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

function RequestStatCard({ title, value, unit, icon: Icon, accentColor = "green" }) {
    const c = REQUEST_STAT_COLORS[accentColor] || REQUEST_STAT_COLORS.green;
    return (
        <div className={`bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 border-t-2 ${c.border} shadow-[0_4px_12px_rgba(141,170,145,0.12)] flex flex-col gap-3`}>
            {Icon && (
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${c.iconBg} ${c.iconText}`}>
                    <Icon size={18} />
                </div>
            )}
            <div>
                <p className="text-[10px] sm:text-xs text-[#72796e] uppercase tracking-wider font-semibold">
                    {title}
                </p>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#191c1c]">
                    {value}
                    <span className="ml-1 text-xs sm:text-sm font-semibold text-[#72796e]">{unit}</span>
                </h3>
            </div>
        </div>
    );
}

function ProviderStatusBadge({ status }) {
    const key = status.toLowerCase().replace(" ", "_");
    const apiKey =
        status === "Pending"
            ? "pending"
            : status === "Accepted"
              ? "accepted"
              : status === "In Transit"
                ? "in_transit"
                : status === "Completed"
                  ? "completed"
                  : status === "Declined"
                    ? "rejected"
                    : "cancelled";

    return (
        <span
            className={`inline-flex shrink-0 whitespace-nowrap items-center rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[apiKey] || "bg-zinc-100"}`}
        >
            {status}
        </span>
    );
}

function ProviderRequestActions({ request, onAccept, onReject, onUpdateStatus, onViewDetails }) {
    const isDropOff = request.raw?.requestType === "drop_off";

    const detailsBtn = (
        <button
            type="button"
            onClick={() => onViewDetails(request.id)}
            className="inline-flex items-center gap-1 rounded-xl bg-zinc-100 px-3 py-2 text-xs font-semibold text-[#42493e] hover:bg-zinc-200"
        >
            <Eye size={14} />
            Details
        </button>
    );

    if (request.status === "Pending") {
        return (
            <div className="flex flex-wrap justify-start md:justify-end gap-2">
                {detailsBtn}
                <button
                    type="button"
                    onClick={() => onAccept(request.id)}
                    className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-200"
                >
                    <CheckCircle size={14} />
                    Accept
                </button>
                <button
                    type="button"
                    onClick={onReject}
                    className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-200"
                >
                    <XCircle size={14} />
                    Decline
                </button>
            </div>
        );
    }

    if (request.status === "Accepted") {
        if (isDropOff) {
            return (
                <div className="flex flex-wrap justify-start md:justify-end gap-2">
                    {detailsBtn}
                    <span className="inline-flex items-center text-xs font-semibold text-amber-700">
                        Complete in details
                    </span>
                </div>
            );
        }

        return (
            <div className="flex flex-wrap justify-start md:justify-end gap-2">
                {detailsBtn}
                <button
                    type="button"
                    onClick={() => onUpdateStatus(request.id, "In Transit")}
                    className="inline-flex items-center gap-1 rounded-xl bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-200"
                >
                    <Clock3 size={14} />
                    Mark In Transit
                </button>
            </div>
        );
    }

    if (request.status === "In Transit") {
        return (
            <div className="flex flex-wrap justify-start md:justify-end gap-2">
                {detailsBtn}
                <span className="inline-flex items-center text-xs font-semibold text-amber-700">
                    Complete in details
                </span>
            </div>
        );
    }

    return (
        <div className="flex justify-start md:justify-end gap-2">
            {detailsBtn}
            <span className="inline-flex items-center gap-1 text-xs text-[#72796e]">
                <Eye size={14} />
                {STATUS_LABELS[request.raw?.status] || request.status}
            </span>
        </div>
    );
}

function ProviderPickupDetailDrawer({
    request,
    liveGps,
    isSharingLocation,
    onClose,
    onRefresh,
    onAccept,
    onReject,
    onUpdateStatus,
    onCompleteDropOff,
    onCompleteHomePickup,
}) {
    const [actualWeight, setActualWeight] = useState(
        String(request.estimatedWeightKg || "")
    );
    const [cashPaid, setCashPaid] = useState("");
    const [completingDropOff, setCompletingDropOff] = useState(false);
    const [completingHomePickup, setCompletingHomePickup] = useState(false);

    const statusKey = request.status;
    const statusLabel = STATUS_LABELS[statusKey] || statusKey;
    const isHomePickup = request.requestType !== "drop_off";
    const isDropOff = !isHomePickup;
    const estimatedPoints = estimateDropOffPoints(actualWeight || request.estimatedWeightKg);
    const estimatedTotal = pickupEstimatedPayout(request);

    const showMap = isHomePickup && ["accepted", "in_transit"].includes(statusKey);
    const showDropOffMap = isDropOff && statusKey === "accepted";
    const showRoute =
        statusKey === "in_transit" &&
        (request.providerLocation?.lat != null || liveGps?.lat != null);

    const customerName = getCustomerDisplayName(request.customer);

    const handleCompleteDropOff = async () => {
        const weight = Number(actualWeight);
        if (!weight || weight < 0.1) return;
        setCompletingDropOff(true);
        try {
            await onCompleteDropOff(request.id, weight);
        } finally {
            setCompletingDropOff(false);
        }
    };

    const handleCompleteHomePickup = async () => {
        const weight = Number(actualWeight);
        const totalAmount = Number(cashPaid);
        if (!weight || weight < 0.1) return;
        if (!Number.isFinite(totalAmount) || totalAmount < 0) return;
        setCompletingHomePickup(true);
        try {
            await onCompleteHomePickup(request.id, { actualWeight: weight, totalAmount });
        } finally {
            setCompletingHomePickup(false);
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
                    <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-lg text-[#191c1c] truncate min-w-0">
                            {customerName}
                        </p>
                        <span className={`inline-flex shrink-0 whitespace-nowrap items-center text-xs font-bold px-2.5 py-1 rounded-full ${STATUS_STYLES[statusKey] || "bg-zinc-100"}`}>
                            {statusLabel}
                        </span>
                    </div>

                    {isSharingLocation && statusKey === "in_transit" && (
                        <div className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-800 flex items-center gap-2">
                            <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                            Sharing live location with customer
                        </div>
                    )}

                    <div className="space-y-1 text-sm">
                        <p className="text-[#72796e]">{formatPickupSchedule(request)}</p>
                        <p>
                            {materialsSummary(request.materials)} · {formatWeightKg(request.estimatedWeightKg)} kg
                        </p>
                        <p className="flex items-start gap-1 text-[#42493e]">
                            <MapPin size={14} className="shrink-0 mt-0.5" />
                            {request.address}
                        </p>
                        {request.contactPhone && (
                            <p className="text-[#72796e]">Phone: {request.contactPhone}</p>
                        )}
                    </div>

                    {estimatedTotal > 0 && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-1">
                            <p className="text-sm font-semibold text-emerald-900">Estimated total</p>
                            <p className="text-2xl font-bold text-[#154212]">
                                {formatPeso(estimatedTotal)}
                            </p>
                            <p className="text-xs text-[#72796e]">
                                Final amount may change after you verify weight and materials.
                            </p>
                        </div>
                    )}

                    <PickupMaterialPhotosGallery
                        photos={request.materialPhotos}
                        title="Customer material photos"
                        description="Photos submitted by the customer for this pickup."
                        showEmpty
                    />

                    {showMap && (
                        <div className="rounded-xl border border-zinc-200 bg-[#f9f9f8] p-3 space-y-2">
                            <p className="text-sm font-semibold text-[#191c1c]">
                                {statusKey === "in_transit" ? "Navigate to customer" : "Customer location"}
                            </p>
                            {statusKey === "accepted" && (
                                <p className="text-xs text-[#72796e]">
                                    Mark in transit to start live tracking for the customer.
                                </p>
                            )}
                            {request.providerLocation?.updatedAt && (
                                <p className="text-xs text-[#72796e]">
                                    {formatLastUpdated(request.providerLocation.updatedAt)}
                                </p>
                            )}
                            {request.rating?.score && (
                                <p className="text-xs font-semibold text-amber-700 flex items-center gap-1">
                                    <Star size={12} className="fill-amber-400 text-amber-400" />
                                    Customer rated {request.rating.score}/5
                                </p>
                            )}
                            <PickupTrackingMap
                                address={request.address}
                                destination={request.pickupLocation}
                                provider={request.providerLocation}
                                liveProvider={liveGps}
                                showRoute={showRoute}
                                minHeight="260px"
                            />
                        </div>
                    )}

                    {showDropOffMap && (
                        <div className="rounded-xl border border-zinc-200 bg-[#f9f9f8] p-3 space-y-2">
                            <p className="text-sm font-semibold text-[#191c1c]">Shop drop-off location</p>
                            <p className="text-xs text-[#72796e]">
                                Customer will bring items to this address during their scheduled slot.
                            </p>
                            <PickupTrackingMap
                                address={request.address}
                                destination={request.pickupLocation}
                                minHeight="220px"
                            />
                        </div>
                    )}

                    {isDropOff && statusKey === "accepted" && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                            <p className="text-sm font-semibold text-emerald-900">Complete drop-off</p>
                            <p className="text-xs text-[#72796e]">
                                Weigh the customer&apos;s items and award recycling points ({POINTS_PER_KG} pts/kg).
                            </p>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#42493e]">
                                    Actual weight (kg)
                                </label>
                                <NumberInput
                                    value={actualWeight}
                                    onChange={setActualWeight}
                                    min={0.1}
                                    step={0.1}
                                />
                            </div>
                            <p className="text-sm font-semibold text-[#154212]">
                                Points to award: {formatPoints(estimatedPoints)} pts
                            </p>
                            <button
                                type="button"
                                disabled={completingDropOff}
                                onClick={handleCompleteDropOff}
                                className="w-full py-2.5 rounded-xl bg-[#154212] text-white text-sm font-semibold disabled:opacity-50"
                            >
                                {completingDropOff ? "Completing…" : "Complete & award points"}
                            </button>
                        </div>
                    )}

                    {isHomePickup && statusKey === "in_transit" && (
                        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-3">
                            <p className="text-sm font-semibold text-emerald-900">Complete pickup</p>
                            <p className="text-xs text-[#72796e]">
                                Weigh the materials on-site and record how much cash you paid the customer.
                            </p>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#42493e]">
                                    Actual weight (kg)
                                </label>
                                <NumberInput
                                    value={actualWeight}
                                    onChange={setActualWeight}
                                    min={0.1}
                                    step={0.1}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="block text-xs font-semibold text-[#42493e]">
                                    Cash paid to customer (₱)
                                </label>
                                <NumberInput
                                    value={cashPaid}
                                    onChange={setCashPaid}
                                    min={0}
                                    step={1}
                                />
                            </div>
                            <button
                                type="button"
                                disabled={completingHomePickup}
                                onClick={handleCompleteHomePickup}
                                className="w-full py-2.5 rounded-xl bg-[#154212] text-white text-sm font-semibold disabled:opacity-50"
                            >
                                {completingHomePickup ? "Completing…" : "Complete pickup"}
                            </button>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                        {statusKey === "pending" && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => {
                                        onAccept(request.id);
                                        onRefresh();
                                    }}
                                    className="flex-1 py-2.5 rounded-xl bg-emerald-100 text-emerald-800 text-sm font-semibold"
                                >
                                    Accept
                                </button>
                                <button
                                    type="button"
                                    onClick={onReject}
                                    className="flex-1 py-2.5 rounded-xl bg-red-100 text-red-700 text-sm font-semibold"
                                >
                                    Decline
                                </button>
                            </>
                        )}
                        {statusKey === "accepted" && isHomePickup && (
                            <button
                                type="button"
                                onClick={() => {
                                    onUpdateStatus(request.id, "In Transit");
                                    onRefresh();
                                }}
                                className="w-full py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold"
                            >
                                Mark In Transit
                            </button>
                        )}
                    </div>
                </div>
        </PickupDetailDrawerShell>
    );
}

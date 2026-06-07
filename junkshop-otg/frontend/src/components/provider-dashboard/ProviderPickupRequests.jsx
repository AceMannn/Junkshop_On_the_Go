import { useCallback, useEffect, useMemo, useState } from "react";
import {
    Truck,
    CheckCircle,
    XCircle,
    Clock3,
    Eye,
    MapPin,
} from "lucide-react";
import { pickupApi } from "../../services/api";
import { REFRESH_INTERVAL_MS, useAutoRefresh } from "../../hooks/useAutoRefresh";
import {
    STATUS_LABELS,
    STATUS_STYLES,
    formatPickupSchedule,
    materialsSummary,
    getCustomerDisplayName,
} from "../../utils/pickupHelpers";

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

export default function ProviderPickupRequests() {
    const [activeRequestTab, setActiveRequestTab] = useState("All");
    const [toast, setToast] = useState("");
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [rejectingId, setRejectingId] = useState(null);
    const [presets, setPresets] = useState([]);
    const [rejectReason, setRejectReason] = useState("");
    const [rejectMessage, setRejectMessage] = useState("");
    const [trackingId, setTrackingId] = useState(null);

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

    const showToast = (message) => {
        setToast(message);
        setTimeout(() => setToast(""), 2800);
    };

    const handleAccept = async (id) => {
        try {
            await pickupApi.accept(id);
            showToast("Request accepted. Customer can pay service fee via GCash.");
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

    const handleStatus = async (id, label) => {
        const status = toApiStatus(label);
        if (!status) return;

        try {
            if (label === "In Transit") {
                setTrackingId(id);
                if (!navigator.geolocation) {
                    await pickupApi.updateStatus(id, status);
                    showToast("Marked in transit.");
                    load();
                    return;
                }
                navigator.geolocation.getCurrentPosition(
                    async (pos) => {
                        await pickupApi.updateStatus(id, status);
                        await pickupApi.updateLocation(
                            id,
                            pos.coords.latitude,
                            pos.coords.longitude
                        );
                        showToast("In transit — location shared with customer.");
                        load();
                    },
                    async () => {
                        await pickupApi.updateStatus(id, status);
                        showToast("In transit (location unavailable).");
                        load();
                    }
                );
                return;
            }

            await pickupApi.updateStatus(id, status);
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
    const totalVolume = requests.reduce((sum, r) => sum + (r.weight || 0), 0);

    return (
        <div className="space-y-6 sm:space-y-8 pb-24 lg:pb-8">
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
                <RequestStatCard title="Pending" value={pendingCount} unit="requests" />
                <RequestStatCard title="In Transit" value={inTransitCount} unit="requests" />
                <RequestStatCard title="Completed" value={completedTodayCount} unit="requests" />
                <RequestStatCard title="Total Volume" value={totalVolume} unit="kg" />
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
                                <div key={request.id} className="p-4 space-y-3">
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
                                            <p className="font-semibold text-[#154212]">{request.weight} kg</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-2 text-sm text-[#42493e]">
                                        <MapPin size={16} className="mt-0.5 shrink-0 text-[#72796e]" />
                                        <span className="break-words">{request.location}</span>
                                    </div>
                                    <ProviderRequestActions
                                        request={request}
                                        onAccept={handleAccept}
                                        onReject={() => setRejectingId(request.id)}
                                        onUpdateStatus={handleStatus}
                                    />
                                </div>
                            ))}
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-[#f3f4f3] text-[#72796e]">
                                    <tr>
                                        <th className="px-6 py-4 font-semibold">Customer</th>
                                        <th className="px-6 py-4 font-semibold">Materials</th>
                                        <th className="px-6 py-4 font-semibold">Weight</th>
                                        <th className="px-6 py-4 font-semibold">Location</th>
                                        <th className="px-6 py-4 font-semibold">Date & Time</th>
                                        <th className="px-6 py-4 font-semibold">Status</th>
                                        <th className="px-6 py-4 text-right font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100">
                                    {filteredRequests.map((request) => (
                                        <tr key={request.id} className="hover:bg-[#f9f9f8]">
                                            <td className="px-6 py-4">
                                                <p className="font-semibold text-[#191c1c]">{request.customer}</p>
                                                <p className="text-xs text-[#72796e]">
                                                    {request.raw.requestType === "drop_off" ? "Drop-off" : "Pickup"}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 text-[#42493e]">{request.materials}</td>
                                            <td className="px-6 py-4 font-semibold text-[#154212]">
                                                {request.weight} kg
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-start gap-2 text-[#42493e]">
                                                    <MapPin size={16} className="mt-0.5 shrink-0 text-[#72796e]" />
                                                    <span>{request.location}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-[#42493e]">{request.dateTime}</td>
                                            <td className="px-6 py-4">
                                                <ProviderStatusBadge status={request.status} />
                                            </td>
                                            <td className="px-6 py-4">
                                                <ProviderRequestActions
                                                    request={request}
                                                    onAccept={handleAccept}
                                                    onReject={() => setRejectingId(request.id)}
                                                    onUpdateStatus={handleStatus}
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

function RequestStatCard({ title, value, unit }) {
    return (
        <div className="bg-white p-4 sm:p-5 rounded-xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
            <p className="text-[10px] sm:text-xs text-[#72796e] uppercase tracking-wider font-semibold">
                {title}
            </p>
            <h3 className="mt-1 text-xl sm:text-2xl font-bold text-emerald-900">
                {value}
                <span className="ml-1 text-xs sm:text-sm font-semibold">{unit}</span>
            </h3>
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
        <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_STYLES[apiKey] || "bg-zinc-100"}`}>
            {status}
        </span>
    );
}

function ProviderRequestActions({ request, onAccept, onReject, onUpdateStatus }) {
    if (request.status === "Pending") {
        return (
            <div className="flex flex-wrap justify-start md:justify-end gap-2">
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
        return (
            <div className="flex justify-start md:justify-end">
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
            <div className="flex justify-start md:justify-end">
                <button
                    type="button"
                    onClick={() => onUpdateStatus(request.id, "Completed")}
                    className="inline-flex items-center gap-1 rounded-xl bg-[#154212] px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-900"
                >
                    <CheckCircle size={14} />
                    Mark Completed
                </button>
            </div>
        );
    }

    return (
        <div className="flex justify-start md:justify-end">
            <span className="inline-flex items-center gap-1 text-xs text-[#72796e]">
                <Eye size={14} />
                {STATUS_LABELS[request.raw?.status] || request.status}
            </span>
        </div>
    );
}

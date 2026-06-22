import { useCallback, useEffect, useMemo, useState } from "react";
import {
    BadgeCheck,
    ClipboardList,
    Loader2,
    LogOut,
    Mail,
    Shield,
    Users,
    X,
} from "lucide-react";
import { adminApi } from "../services/api";

const adminTabs = [
    { id: "overview", label: "Overview", icon: Shield },
    { id: "applications", label: "Applications", icon: ClipboardList },
    { id: "users", label: "Users", icon: Users },
    { id: "contact", label: "Contact", icon: Mail },
];

const applicationFilters = [
    { id: "", label: "All" },
    { id: "pending", label: "Pending" },
    { id: "approved", label: "Approved" },
    { id: "rejected", label: "Rejected" },
    { id: "draft", label: "Draft" },
];

function imageSrc(data) {
    if (!data) return "";
    if (data.startsWith("data:")) return data;
    return `data:image/jpeg;base64,${data}`;
}

function formatDate(value) {
    if (!value) return "—";
    return new Date(value).toLocaleString();
}

export default function AdminDashboard({ user, onLogout }) {
    const [activeTab, setActiveTab] = useState("overview");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [overview, setOverview] = useState(null);
    const [applications, setApplications] = useState([]);
    const [applicationFilter, setApplicationFilter] = useState("pending");
    const [selectedApplicationId, setSelectedApplicationId] = useState(null);
    const [applicationDetail, setApplicationDetail] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [rejectNote, setRejectNote] = useState("");
    const [actionLoading, setActionLoading] = useState(false);
    const [users, setUsers] = useState([]);
    const [userRoleFilter, setUserRoleFilter] = useState("");
    const [contactMessages, setContactMessages] = useState([]);
    const [badgeOptions, setBadgeOptions] = useState([]);

    const loadOverview = useCallback(async () => {
        const data = await adminApi.getOverview();
        setOverview(data.stats);
        setBadgeOptions(data.badgeOptions || []);
    }, []);

    const loadApplications = useCallback(async (status) => {
        const data = await adminApi.listApplications(status || undefined);
        setApplications(data.applications || []);
    }, []);

    const loadUsers = useCallback(async (role) => {
        const data = await adminApi.listUsers(role || undefined);
        setUsers(data.users || []);
    }, []);

    const loadContactMessages = useCallback(async () => {
        const data = await adminApi.listContactMessages();
        setContactMessages(data.messages || []);
    }, []);

    const refreshActiveTab = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            if (activeTab === "overview") {
                await loadOverview();
            } else if (activeTab === "applications") {
                await loadApplications(applicationFilter);
            } else if (activeTab === "users") {
                await loadUsers(userRoleFilter);
            } else if (activeTab === "contact") {
                await loadContactMessages();
            }
        } catch (loadError) {
            setError(loadError.message || "Could not load admin data.");
        } finally {
            setLoading(false);
        }
    }, [
        activeTab,
        applicationFilter,
        loadApplications,
        loadContactMessages,
        loadOverview,
        loadUsers,
        userRoleFilter,
    ]);

    useEffect(() => {
        refreshActiveTab();
    }, [refreshActiveTab]);

    const openApplication = async (id) => {
        setSelectedApplicationId(id);
        setApplicationDetail(null);
        setRejectNote("");
        setDetailLoading(true);
        try {
            const data = await adminApi.getApplication(id);
            setApplicationDetail(data.application);
        } catch (loadError) {
            setError(loadError.message || "Could not load application.");
            setSelectedApplicationId(null);
        } finally {
            setDetailLoading(false);
        }
    };

    const closeApplication = () => {
        setSelectedApplicationId(null);
        setApplicationDetail(null);
        setRejectNote("");
    };

    const handleApprove = async () => {
        if (!selectedApplicationId) return;
        setActionLoading(true);
        setError("");
        try {
            await adminApi.approveApplication(selectedApplicationId);
            closeApplication();
            await loadApplications(applicationFilter);
            await loadOverview();
        } catch (actionError) {
            setError(actionError.message || "Could not approve application.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async () => {
        if (!selectedApplicationId || !rejectNote.trim()) {
            setError("Enter a rejection note for the owner.");
            return;
        }
        setActionLoading(true);
        setError("");
        try {
            await adminApi.rejectApplication(selectedApplicationId, rejectNote.trim());
            closeApplication();
            await loadApplications(applicationFilter);
            await loadOverview();
        } catch (actionError) {
            setError(actionError.message || "Could not reject application.");
        } finally {
            setActionLoading(false);
        }
    };

    const handleBadgeToggle = async (userId, badgeId, currentBadges) => {
        const next = currentBadges.includes(badgeId)
            ? currentBadges.filter((item) => item !== badgeId)
            : [...currentBadges, badgeId];

        try {
            await adminApi.updateUserBadges(userId, next);
            setUsers((prev) =>
                prev.map((row) => (row.id === userId ? { ...row, badges: next } : row))
            );
        } catch (actionError) {
            setError(actionError.message || "Could not update badges.");
        }
    };

    const handleUserStatus = async (userId, status) => {
        try {
            await adminApi.updateUserStatus(userId, status);
            setUsers((prev) =>
                prev.map((row) => (row.id === userId ? { ...row, status } : row))
            );
        } catch (actionError) {
            setError(actionError.message || "Could not update account status.");
        }
    };

    const handleContactStatus = async (messageId, status) => {
        try {
            await adminApi.updateContactMessageStatus(messageId, status);
            setContactMessages((prev) =>
                prev.map((row) => (row._id === messageId ? { ...row, status } : row))
            );
            await loadOverview();
        } catch (actionError) {
            setError(actionError.message || "Could not update message status.");
        }
    };

    const statCards = useMemo(
        () => [
            { label: "Pending applications", value: overview?.pendingApplications ?? 0 },
            { label: "Approved providers", value: overview?.approvedApplications ?? 0 },
            { label: "Unread contact", value: overview?.unreadContactMessages ?? 0 },
            { label: "Total users", value: overview?.totalUsers ?? 0 },
        ],
        [overview]
    );

    return (
        <div className="min-h-screen bg-[#f9f9f8] text-[#191c1c]">
            <header className="fixed top-0 left-0 right-0 z-40 h-16 border-b border-zinc-200 bg-white">
                <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6">
                    <div className="flex items-center gap-2">
                        <Shield className="text-[#154212]" size={22} />
                        <div>
                            <p className="text-sm font-bold">JunkShop Admin</p>
                            <p className="text-xs text-zinc-500">
                                {user?.firstName} {user?.lastName}
                            </p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={onLogout}
                        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 px-3 py-2 text-sm font-semibold hover:bg-zinc-50"
                    >
                        <LogOut size={16} />
                        Log out
                    </button>
                </div>
            </header>

            <div className="mx-auto flex max-w-7xl pt-16">
                <aside className="hidden md:block w-56 shrink-0 border-r border-zinc-200 bg-zinc-50 min-h-[calc(100vh-4rem)] p-3">
                    <nav className="space-y-1">
                        {adminTabs.map((tab) => {
                            const Icon = tab.icon;
                            const isActive = activeTab === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    type="button"
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium ${
                                        isActive
                                            ? "bg-emerald-100/80 text-emerald-800"
                                            : "text-zinc-600 hover:bg-zinc-100"
                                    }`}
                                >
                                    <Icon size={18} />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </nav>
                </aside>

                <main className="flex-1 p-4 sm:p-6 pb-10">
                    <div className="mb-4 flex flex-wrap gap-2 md:hidden">
                        {adminTabs.map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setActiveTab(tab.id)}
                                className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                    activeTab === tab.id
                                        ? "bg-emerald-100 text-emerald-800"
                                        : "bg-white border border-zinc-200 text-zinc-600"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {error && (
                        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
                            {error}
                        </div>
                    )}

                    {loading ? (
                        <div className="flex items-center justify-center py-20 text-zinc-500">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Loading...
                        </div>
                    ) : (
                        <>
                            {activeTab === "overview" && (
                                <div className="space-y-6">
                                    <h1 className="text-2xl font-bold">Overview</h1>
                                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                        {statCards.map((card) => (
                                            <div
                                                key={card.label}
                                                className="rounded-2xl border border-zinc-200 bg-white p-5"
                                            >
                                                <p className="text-sm text-zinc-500">{card.label}</p>
                                                <p className="mt-2 text-3xl font-bold">{card.value}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === "applications" && (
                                <ApplicationsPanel
                                    applications={applications}
                                    filter={applicationFilter}
                                    onFilterChange={setApplicationFilter}
                                    onOpen={openApplication}
                                />
                            )}

                            {activeTab === "users" && (
                                <UsersPanel
                                    users={users}
                                    roleFilter={userRoleFilter}
                                    onRoleFilterChange={setUserRoleFilter}
                                    badgeOptions={badgeOptions}
                                    onBadgeToggle={handleBadgeToggle}
                                    onStatusChange={handleUserStatus}
                                />
                            )}

                            {activeTab === "contact" && (
                                <ContactPanel
                                    messages={contactMessages}
                                    onStatusChange={handleContactStatus}
                                />
                            )}
                        </>
                    )}
                </main>
            </div>

            {selectedApplicationId && (
                <ApplicationModal
                    loading={detailLoading}
                    application={applicationDetail}
                    rejectNote={rejectNote}
                    onRejectNoteChange={setRejectNote}
                    onClose={closeApplication}
                    onApprove={handleApprove}
                    onReject={handleReject}
                    actionLoading={actionLoading}
                />
            )}
        </div>
    );
}

function ApplicationsPanel({ applications, filter, onFilterChange, onOpen }) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Provider applications</h1>
                <div className="flex flex-wrap gap-2">
                    {applicationFilters.map((item) => (
                        <button
                            key={item.id || "all"}
                            type="button"
                            onClick={() => onFilterChange(item.id)}
                            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                                filter === item.id
                                    ? "bg-emerald-100 text-emerald-800"
                                    : "bg-white border border-zinc-200 text-zinc-600"
                            }`}
                        >
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-3 md:hidden">
                {applications.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-500">
                        No applications found.
                    </div>
                ) : (
                    applications.map((row) => (
                        <article
                            key={row.id}
                            className="rounded-2xl border border-zinc-200 bg-white p-4 space-y-3"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="font-semibold">{row.junkshopName}</p>
                                    <p className="text-sm text-zinc-500">{row.ownerName}</p>
                                </div>
                                <span className="shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold capitalize">
                                    {row.verificationStatus}
                                </span>
                            </div>
                            <div className="text-sm text-zinc-600 space-y-1">
                                <p>{row.phone || "—"}</p>
                                <p className="text-xs text-zinc-500">
                                    Submitted {formatDate(row.verificationSubmittedAt)}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => onOpen(row.id)}
                                className="flex min-h-11 w-full items-center justify-center rounded-xl border border-zinc-200 text-sm font-semibold hover:bg-zinc-50"
                            >
                                Review
                            </button>
                        </article>
                    ))
                )}
            </div>

            <div className="hidden md:block overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="scroll-x-clean">
                    <table className="min-w-full text-sm">
                        <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                            <tr>
                                <th className="px-4 py-3">Junkshop</th>
                                <th className="px-4 py-3">Owner</th>
                                <th className="px-4 py-3">Phone</th>
                                <th className="px-4 py-3">Status</th>
                                <th className="px-4 py-3">Submitted</th>
                                <th className="px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody>
                            {applications.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                                        No applications found.
                                    </td>
                                </tr>
                            ) : (
                                applications.map((row) => (
                                    <tr key={row.id} className="border-t border-zinc-100">
                                        <td className="px-4 py-3 font-medium">{row.junkshopName}</td>
                                        <td className="px-4 py-3">{row.ownerName}</td>
                                        <td className="px-4 py-3">{row.phone}</td>
                                        <td className="px-4 py-3 capitalize">{row.verificationStatus}</td>
                                        <td className="px-4 py-3">{formatDate(row.verificationSubmittedAt)}</td>
                                        <td className="px-4 py-3">
                                            <button
                                                type="button"
                                                onClick={() => onOpen(row.id)}
                                                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold hover:bg-zinc-50"
                                            >
                                                Review
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function UsersPanel({
    users,
    roleFilter,
    onRoleFilterChange,
    badgeOptions,
    onBadgeToggle,
    onStatusChange,
}) {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h1 className="text-2xl font-bold">Users</h1>
                <select
                    value={roleFilter}
                    onChange={(e) => onRoleFilterChange(e.target.value)}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                >
                    <option value="">Customers & providers</option>
                    <option value="customer">Customers</option>
                    <option value="provider">Providers</option>
                </select>
            </div>

            <div className="space-y-3">
                {users.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-500">
                        No users found.
                    </div>
                ) : (
                    users.map((row) => (
                        <div
                            key={row.id}
                            className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-3"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="font-semibold">{row.name || row.email}</p>
                                    <p className="text-sm text-zinc-500">
                                        {row.email}
                                        {row.phone ? ` · ${row.phone}` : ""}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1 capitalize">
                                        {row.role}
                                        {row.junkshopName ? ` · ${row.junkshopName}` : ""}
                                        {row.verificationStatus ? ` · ${row.verificationStatus}` : ""}
                                    </p>
                                </div>
                                <select
                                    value={row.status}
                                    onChange={(e) => onStatusChange(row.id, e.target.value)}
                                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
                                >
                                    <option value="active">Active</option>
                                    <option value="suspended">Suspended</option>
                                    <option value="banned">Banned</option>
                                </select>
                            </div>

                            {row.role === "provider" && badgeOptions.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {badgeOptions.map((badge) => {
                                        const active = (row.badges || []).includes(badge.id);
                                        return (
                                            <button
                                                key={badge.id}
                                                type="button"
                                                onClick={() =>
                                                    onBadgeToggle(row.id, badge.id, row.badges || [])
                                                }
                                                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${
                                                    active
                                                        ? "border-emerald-300 bg-emerald-50 text-emerald-800"
                                                        : "border-zinc-200 bg-zinc-50 text-zinc-600"
                                                }`}
                                            >
                                                <BadgeCheck size={14} />
                                                {badge.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ContactPanel({ messages, onStatusChange }) {
    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Contact messages</h1>
            <div className="space-y-3">
                {messages.length === 0 ? (
                    <div className="rounded-2xl border border-zinc-200 bg-white px-4 py-8 text-center text-zinc-500">
                        No contact messages yet.
                    </div>
                ) : (
                    messages.map((row) => (
                        <div
                            key={row._id}
                            className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 space-y-2"
                        >
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                <div>
                                    <p className="font-semibold">{row.subject}</p>
                                    <p className="text-sm text-zinc-500">
                                        {row.name} · {row.email}
                                    </p>
                                    <p className="text-xs text-zinc-500 mt-1">
                                        {formatDate(row.createdAt)}
                                    </p>
                                </div>
                                <select
                                    value={row.status}
                                    onChange={(e) => onStatusChange(row._id, e.target.value)}
                                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm capitalize"
                                >
                                    <option value="new">New</option>
                                    <option value="read">Read</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <p className="text-sm text-[#42493e] whitespace-pre-wrap">{row.message}</p>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}

function ApplicationModal({
    loading,
    application,
    rejectNote,
    onRejectNoteChange,
    onClose,
    onApprove,
    onReject,
    actionLoading,
}) {
    const docs = application?.verification?.documents;
    const canDecide = application?.verificationStatus === "pending";

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
            <div className="scroll-y-clean max-h-[92vh] w-full max-w-4xl rounded-t-2xl sm:rounded-2xl bg-white shadow-xl">
                <div className="sticky top-0 flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-4 sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold">Review application</h2>
                        {application && (
                            <p className="text-sm text-zinc-500">
                                {application.junkshopName} · {application.ownerName}
                            </p>
                        )}
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg p-2 hover:bg-zinc-100"
                        aria-label="Close"
                    >
                        <X size={18} />
                    </button>
                </div>

                <div className="p-4 sm:p-6 space-y-6">
                    {loading || !application ? (
                        <div className="flex items-center justify-center py-16 text-zinc-500">
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Loading application...
                        </div>
                    ) : (
                        <>
                            <div className="grid gap-4 sm:grid-cols-2">
                                <InfoRow label="Phone" value={application.phone} />
                                <InfoRow label="Email" value={application.email} />
                                <InfoRow label="Address" value={application.address} />
                                <InfoRow label="Status" value={application.verificationStatus} />
                                <InfoRow
                                    label="Submitted"
                                    value={formatDate(application.verificationSubmittedAt)}
                                />
                                <InfoRow
                                    label="Shop published"
                                    value={application.shop?.isPublished ? "Yes" : "No"}
                                />
                            </div>

                            <DocumentPreview
                                title="Government ID"
                                docType={docs?.governmentId?.docType}
                                data={docs?.governmentId?.data}
                            />
                            <DocumentPreview
                                title="Business permit"
                                docType={docs?.businessPermit?.docType}
                                data={docs?.businessPermit?.data}
                            />

                            <div>
                                <h3 className="font-semibold mb-3">Shop photos</h3>
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                    {(docs?.shopPhotos || []).map((photo) => (
                                        <div key={photo.slot} className="space-y-2">
                                            <p className="text-xs font-semibold text-zinc-500">
                                                {photo.label || `Photo ${photo.slot}`}
                                            </p>
                                            {photo.data ? (
                                                <img
                                                    src={imageSrc(photo.data)}
                                                    alt={photo.label || "Shop photo"}
                                                    className="w-full rounded-xl border border-zinc-200 object-cover max-h-56"
                                                />
                                            ) : (
                                                <div className="rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-400">
                                                    Missing
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {canDecide && (
                                <div className="space-y-3 border-t border-zinc-200 pt-4">
                                    <label className="block text-sm font-semibold">
                                        Rejection note (required to reject)
                                    </label>
                                    <textarea
                                        value={rejectNote}
                                        onChange={(e) => onRejectNoteChange(e.target.value)}
                                        rows={3}
                                        className="w-full rounded-xl border border-zinc-200 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                                        placeholder="Tell the owner what to fix..."
                                    />
                                    <div className="flex flex-col sm:flex-row gap-3 sm:justify-end">
                                        <button
                                            type="button"
                                            onClick={onReject}
                                            disabled={actionLoading}
                                            className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 disabled:opacity-60"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            type="button"
                                            onClick={onApprove}
                                            disabled={actionLoading}
                                            className="rounded-xl bg-[#154212] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0f3310] disabled:opacity-60"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">{label}</p>
            <p className="mt-1 text-sm font-medium capitalize">{value || "—"}</p>
        </div>
    );
}

function DocumentPreview({ title, docType, data }) {
    return (
        <div>
            <h3 className="font-semibold">{title}</h3>
            <p className="text-sm text-zinc-500 mt-1">{docType || "No type selected"}</p>
            {data ? (
                <img
                    src={imageSrc(data)}
                    alt={title}
                    className="mt-3 w-full max-w-md rounded-xl border border-zinc-200 object-contain max-h-72"
                />
            ) : (
                <div className="mt-3 rounded-xl border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-400 max-w-md">
                    Not uploaded
                </div>
            )}
        </div>
    );
}

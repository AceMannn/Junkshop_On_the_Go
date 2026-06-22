import { useEffect, useState } from "react";
import {
    ArrowLeft,
    User,
    Lock,
    Shield,
    AlertTriangle,
    X,
    StickyNote,
    Camera,
} from "lucide-react";
import { authApi, domainApi } from "../../services/api";
import EmptyState from "../ui/EmptyState";
import { getUserInitials } from "../../utils/userDisplay";
import { formatPoints } from "../../utils/pickupPoints";

function getDisplayName(user) {
    if (!user) return "Eco Warrior";
    return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "Eco Warrior";
}

export function AccountPageShell({ title, subtitle, onBack, children }) {
    return (
        <div className="space-y-6 sm:space-y-8 pb-24 md:pb-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <button
                        type="button"
                        onClick={onBack}
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[#154212] hover:bg-emerald-50 px-3 py-2 -ml-3 rounded-lg transition-colors mb-3"
                    >
                        <ArrowLeft size={18} />
                        Back to dashboard
                    </button>
                    <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#154212]">
                        {title}
                    </h1>
                    {subtitle && (
                        <p className="text-[#72796e] mt-2 text-sm sm:text-base max-w-2xl">
                            {subtitle}
                        </p>
                    )}
                </div>
            </div>
            {children}
        </div>
    );
}

function InputField({ label, required, type = "text", value, onChange, readOnly }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#42493e]">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <input
                className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154212] focus:border-transparent outline-none transition-all disabled:opacity-70"
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                readOnly={readOnly}
            />
        </div>
    );
}

function isProviderInternalEmail(email) {
    return String(email || "").endsWith("@provider.junkshop.internal");
}

export function ViewProfilePage({ user, onBack, onSaveSuccess, onUserUpdate }) {
    const isProvider = user?.role === "provider";
    const displayName = getDisplayName(user);
    const showEmail = user?.email && !isProviderInternalEmail(user.email);
    const emailDisplay = showEmail
        ? user.email
        : isProvider
          ? "No email on file (optional at signup)"
          : user?.email || "";
    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
        address: user?.address || "",
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            const { user: updated } = await authApi.updateMe(form);
            onUserUpdate?.(updated);
            onSaveSuccess?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AccountPageShell
            title="View Profile"
            subtitle={
                isProvider
                    ? "Your owner profile for verification, login, and shop contact details."
                    : "Your personal information used for pickups and account recovery."
            }
            onBack={onBack}
        >
            <div className="flex items-center gap-4 p-4 sm:p-5 bg-white rounded-2xl border border-zinc-200 shadow-sm">
                <span
                    className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-[#154212] text-base sm:text-lg font-bold text-white"
                    aria-hidden
                >
                    {getUserInitials(user)}
                </span>
                <div className="min-w-0">
                    <p className="font-bold text-[#191c1c] truncate">{displayName}</p>
                    <p className="text-sm text-[#72796e] truncate">
                        {isProvider ? user?.phone || emailDisplay : emailDisplay}
                    </p>
                    {isProvider && showEmail && (
                        <p className="text-xs text-[#72796e] truncate mt-0.5">{user.email}</p>
                    )}
                    <p className="text-xs text-emerald-700 font-medium mt-1 capitalize">
                        {isProvider ? "Junkshop owner" : `${user?.role || "customer"} account`}
                    </p>
                </div>
            </div>

            {!isProvider && (
                <div className="flex items-center justify-between gap-4 p-4 sm:p-5 bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl border border-amber-100 shadow-sm">
                    <div>
                        <p className="text-sm font-semibold text-[#42493e]">Recycling points</p>
                        <p className="text-2xl font-bold text-[#154212] mt-1">
                            {formatPoints(user?.recyclingPoints ?? 0)} pts
                        </p>
                        <p className="text-xs text-[#72796e] mt-1">
                            Earned from drop-offs at partner shops. Redeem rewards coming soon.
                        </p>
                    </div>
                </div>
            )}

            <section className="bg-white p-5 sm:p-8 rounded-2xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-9 h-9 rounded-full bg-[#c9e7cc] flex items-center justify-center">
                        <User size={20} className="text-[#4e6953]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold">Personal information</h2>
                </div>

                <form onSubmit={handleSave} className="space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
                        <InputField
                            label="First name"
                            required
                            value={form.firstName}
                            onChange={(v) => setForm({ ...form, firstName: v })}
                        />
                        <InputField
                            label="Last name"
                            required
                            value={form.lastName}
                            onChange={(v) => setForm({ ...form, lastName: v })}
                        />
                        <InputField
                            label="Email address"
                            required={!isProvider}
                            type="email"
                            value={emailDisplay}
                            readOnly
                        />
                        <InputField
                            label={isProvider ? "Mobile number (login)" : "Mobile number"}
                            type="tel"
                            value={form.phone}
                            onChange={(v) =>
                                setForm({
                                    ...form,
                                    phone: v.replace(/\D/g, "").slice(0, 11),
                                })
                            }
                        />
                        <p className="text-xs text-[#72796e] md:col-span-2 -mt-2">
                            {isProvider
                                ? "Used to sign in and for customer pickup contact. Format "
                                : "Required for pickup requests and account recovery. Use format "}
                            <strong>09XXXXXXXXX</strong>.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-[#42493e]">
                            {isProvider ? "Business address" : "Street address"}
                        </label>
                        <textarea
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 focus:ring-2 focus:ring-[#154212] focus:border-transparent outline-none transition-all resize-none text-sm"
                            rows={3}
                            value={form.address}
                            onChange={(e) => setForm({ ...form, address: e.target.value })}
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                            {error}
                        </p>
                    )}

                    <div className="pt-2 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-[#154212] text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl text-sm font-semibold hover:bg-emerald-900 transition-colors disabled:opacity-60"
                        >
                            {saving ? "Saving..." : "Save changes"}
                        </button>
                    </div>
                </form>
            </section>
        </AccountPageShell>
    );
}

function CustomerNotesSection() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        domainApi
            .getNotes()
            .then(({ notes: rows }) => setNotes(rows || []))
            .catch(() => setNotes([]))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <p className="text-sm text-[#72796e] animate-pulse">Loading saved notes…</p>;
    }

    if (notes.length === 0) {
        return (
            <EmptyState
                compact
                icon={StickyNote}
                title="No saved notes yet"
                description="Use Quick Add or Scan Photo from the + menu on Overview to save notes and photos here."
            />
        );
    }

    return (
        <ul className="space-y-2 max-h-64 overflow-y-auto">
            {notes.map((note) => (
                <li
                    key={note._id}
                    className="rounded-xl border border-zinc-100 bg-[#f9f9f8] px-4 py-3 text-sm"
                >
                    <div className="flex items-center gap-2 text-xs text-[#72796e] mb-1">
                        {note.type === "photo" ? (
                            <Camera size={14} />
                        ) : (
                            <StickyNote size={14} />
                        )}
                        <span className="capitalize">{note.type}</span>
                        <span>·</span>
                        <span>
                            {note.createdAt
                                ? new Date(note.createdAt).toLocaleDateString()
                                : "—"}
                        </span>
                    </div>
                    <p className="text-[#191c1c] font-medium break-words">{note.text}</p>
                    {note.type === "photo" && note.imageData && (
                        <img
                            src={note.imageData}
                            alt={note.text}
                            className="mt-2 max-h-24 rounded-lg border border-zinc-200"
                        />
                    )}
                </li>
            ))}
        </ul>
    );
}

export function AccountSettingsPage({
    user,
    onBack,
    onNotify,
    onUserUpdate,
    variant = "customer",
}) {
    const isProvider = variant === "provider";
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [saving, setSaving] = useState(false);
    const [privacySaving, setPrivacySaving] = useState(false);
    const [leaderboardVisible, setLeaderboardVisible] = useState(
        user?.leaderboardVisible !== false
    );
    const [error, setError] = useState("");

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");
        try {
            await authApi.changePassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            onNotify?.("Password updated successfully.");
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <AccountPageShell
            title="Account Settings"
            subtitle={
                isProvider
                    ? "Update your login password and account security."
                    : "Security, privacy, and account preferences."
            }
            onBack={onBack}
        >
            <div className={`grid grid-cols-1 ${isProvider ? "max-w-xl" : "lg:grid-cols-2"} gap-5 sm:gap-6`}>
                <section className="bg-white p-5 sm:p-8 rounded-2xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-9 h-9 rounded-full bg-[#c9e7cc] flex items-center justify-center">
                            <Lock size={20} className="text-[#4e6953]" />
                        </div>
                        <h2 className="text-lg sm:text-xl font-bold">Security</h2>
                    </div>

                    <form onSubmit={handlePasswordChange} className="space-y-4">
                        <h3 className="font-semibold text-sm text-[#42493e]">Change password</h3>
                        <input
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#154212] outline-none"
                            placeholder="Current password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            required
                        />
                        <input
                            className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#154212] outline-none"
                            placeholder="New password (min 8 characters)"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                        {error && (
                            <p className="text-sm text-red-600">{error}</p>
                        )}
                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-2.5 border-2 border-[#154212] text-[#154212] rounded-xl text-sm font-semibold hover:bg-emerald-50 transition-colors disabled:opacity-60"
                        >
                            {saving ? "Updating..." : "Update password"}
                        </button>
                    </form>

                    <div className="h-px bg-zinc-100 my-6" />

                    <div className="flex items-center justify-between gap-4">
                        <div>
                            <h3 className="font-semibold text-sm">Two-factor authentication</h3>
                            <p className="text-xs sm:text-sm text-[#72796e] mt-1">
                                Extra security for your account (coming soon).
                            </p>
                        </div>
                        <button
                            type="button"
                            disabled
                            className="w-11 h-6 bg-zinc-200 rounded-full relative shrink-0 cursor-not-allowed"
                            aria-label="Two-factor authentication off"
                        >
                            <div className="w-4 h-4 bg-white rounded-full absolute left-1 top-1" />
                        </button>
                    </div>
                </section>

                {!isProvider && (
                    <section className="bg-[#45544a] p-5 sm:p-6 rounded-2xl text-[#b6c7bb] flex flex-col justify-between gap-4 min-h-[200px]">
                    <div className="flex items-start gap-4">
                        <div className="p-2.5 bg-white/10 rounded-xl shrink-0">
                            <Shield size={20} />
                        </div>
                        <div>
                            <h4 className="font-semibold text-white">Privacy preference</h4>
                            <p className="text-sm opacity-80 mt-1">
                                Control who can see your recycling activity on leaderboards.
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center justify-between gap-4 w-full">
                        <p className="text-sm text-white/90">
                            {leaderboardVisible ? "Visible on leaderboards" : "Hidden from leaderboards"}
                        </p>
                        <button
                            type="button"
                            disabled={privacySaving}
                            onClick={async () => {
                                const next = !leaderboardVisible;
                                setPrivacySaving(true);
                                try {
                                    const { user: updated } = await authApi.updateMe({
                                        leaderboardVisible: next,
                                    });
                                    setLeaderboardVisible(updated.leaderboardVisible !== false);
                                    onUserUpdate?.(updated);
                                    onNotify?.("Privacy preference saved.");
                                } catch (err) {
                                    onNotify?.(err.message);
                                } finally {
                                    setPrivacySaving(false);
                                }
                            }}
                            className={`w-11 h-6 rounded-full relative shrink-0 transition-colors ${leaderboardVisible ? "bg-emerald-500" : "bg-white/30"}`}
                            aria-label="Toggle leaderboard visibility"
                        >
                            <div
                                className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-all ${leaderboardVisible ? "left-6" : "left-1"}`}
                            />
                        </button>
                    </div>
                </section>
                )}
            </div>

            {!isProvider && (
                <section className="bg-white p-5 sm:p-8 rounded-2xl border border-zinc-200 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-9 h-9 rounded-full bg-[#c9e7cc] flex items-center justify-center">
                        <StickyNote size={20} className="text-[#4e6953]" />
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold">My saved notes</h2>
                </div>
                <CustomerNotesSection />
            </section>
            )}
        </AccountPageShell>
    );
}

export function DeactivateAccountModal({ isOpen, onClose, onConfirm }) {
    const [confirmText, setConfirmText] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    if (!isOpen) return null;

    const canConfirm = confirmText.trim().toUpperCase() === "DEACTIVATE";

    const handleClose = () => {
        setConfirmText("");
        setError("");
        onClose();
    };

    const handleConfirm = async () => {
        setLoading(true);
        setError("");
        try {
            await authApi.deactivate();
            onConfirm();
            setConfirmText("");
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/40"
            role="dialog"
            aria-modal="true"
            aria-labelledby="deactivate-title"
        >
            <div className="bg-white rounded-2xl border border-zinc-200 shadow-xl w-full max-w-md p-5 sm:p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
                            <AlertTriangle size={22} className="text-red-600" />
                        </span>
                        <h2 id="deactivate-title" className="text-lg font-bold text-[#191c1c]">
                            Deactivate account?
                        </h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="p-2 rounded-lg hover:bg-zinc-100 text-zinc-500"
                        aria-label="Close"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-sm text-[#72796e] leading-relaxed">
                    This will disable your account and hide your profile. You can contact support
                    to restore it later. Type <strong>DEACTIVATE</strong> to confirm.
                </p>

                <input
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder="Type DEACTIVATE"
                    className="mt-4 w-full border border-zinc-200 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                    autoComplete="off"
                />

                {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

                <div className="mt-6 flex flex-col-reverse sm:flex-row gap-3">
                    <button
                        type="button"
                        onClick={handleClose}
                        className="flex-1 py-2.5 border border-zinc-200 rounded-xl text-sm font-semibold hover:bg-zinc-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={!canConfirm || loading}
                        onClick={handleConfirm}
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-semibold hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? "Deactivating..." : "Deactivate account"}
                    </button>
                </div>
            </div>
        </div>
    );
}

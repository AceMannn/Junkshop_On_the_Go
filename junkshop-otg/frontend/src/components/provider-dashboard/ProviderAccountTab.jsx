import { useState } from "react";
import { Lock, User } from "lucide-react";
import { authApi } from "../../services/api";
import { getUserInitials } from "../../utils/userDisplay";
import { validatePasswordStrength } from "../../utils/passwordPolicy";

function isPlaceholderEmail(email) {
    const value = String(email || "").toLowerCase();
    return (
        value.endsWith("@provider.junkshop.internal") ||
        value.endsWith("@customer.junkshop.internal")
    );
}

function getDisplayName(user) {
    if (!user) return "Junkshop owner";
    return [user.firstName, user.middleName, user.lastName].filter(Boolean).join(" ") || "Junkshop owner";
}

function InputField({ label, required, type = "text", value, onChange, readOnly, placeholder, helper }) {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold text-[#42493e]">
                {label} {required && <span className="text-red-600">*</span>}
            </label>
            <input
                className="w-full bg-[#f9f9f8] border border-[#c2c9bb] rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-[#154212] focus:border-transparent outline-none transition-all disabled:opacity-70"
                type={type}
                value={value}
                onChange={(e) => onChange?.(e.target.value)}
                readOnly={readOnly}
                placeholder={placeholder}
            />
            {helper ? <p className="text-xs text-[#72796e]">{helper}</p> : null}
        </div>
    );
}

export default function ProviderAccountTab({ user, onNotify, onUserUpdate }) {
    const hasRealEmail = Boolean(user?.email) && !isPlaceholderEmail(user.email);
    const emailDisplay = hasRealEmail ? user.email : "";

    const [form, setForm] = useState({
        firstName: user?.firstName || "",
        middleName: user?.middleName || "",
        lastName: user?.lastName || "",
        phone: user?.phone || "",
    });
    const [savingProfile, setSavingProfile] = useState(false);
    const [profileError, setProfileError] = useState("");

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [savingPassword, setSavingPassword] = useState(false);
    const [passwordError, setPasswordError] = useState("");

    const handleSaveProfile = async (event) => {
        event.preventDefault();
        setProfileError("");
        setSavingProfile(true);
        try {
            const data = await authApi.updateMe({
                firstName: form.firstName.trim(),
                middleName: form.middleName.trim(),
                lastName: form.lastName.trim(),
                phone: form.phone.trim(),
            });
            onUserUpdate?.(data.user);
            onNotify?.("Owner profile updated.");
        } catch (err) {
            setProfileError(err.message);
        } finally {
            setSavingProfile(false);
        }
    };

    const handlePasswordChange = async (event) => {
        event.preventDefault();
        setPasswordError("");
        const passwordValidation = validatePasswordStrength(newPassword);
        if (!passwordValidation.ok) {
            setPasswordError(passwordValidation.message);
            return;
        }
        setSavingPassword(true);
        try {
            await authApi.changePassword({ currentPassword, newPassword });
            setCurrentPassword("");
            setNewPassword("");
            onNotify?.("Password updated successfully.");
        } catch (err) {
            setPasswordError(err.message);
        } finally {
            setSavingPassword(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-5 shadow-sm">
                <span
                    className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-emerald-200 bg-[#154212] text-base font-bold text-white sm:h-16 sm:w-16 sm:text-lg"
                    aria-hidden
                >
                    {getUserInitials(user)}
                </span>
                <div className="min-w-0">
                    <p className="truncate font-bold text-[#191c1c]">{getDisplayName(user)}</p>
                    <p className="truncate text-sm text-[#72796e]">{user?.junkshopName || "Junkshop owner"}</p>
                    {emailDisplay ? (
                        <p className="mt-0.5 truncate text-xs text-[#72796e]">{emailDisplay}</p>
                    ) : null}
                </div>
            </div>

            <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9e7cc]">
                        <User size={20} className="text-[#4e6953]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold sm:text-xl">Owner profile</h2>
                        <p className="text-sm text-[#72796e]">
                            Your name and personal mobile — separate from the shop contact number customers see.
                        </p>
                    </div>
                </div>

                <form onSubmit={handleSaveProfile} className="max-w-xl space-y-4">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <InputField
                            label="First name"
                            required
                            value={form.firstName}
                            onChange={(value) => setForm({ ...form, firstName: value })}
                        />
                        <InputField
                            label="Last name"
                            required
                            value={form.lastName}
                            onChange={(value) => setForm({ ...form, lastName: value })}
                        />
                    </div>
                    <InputField
                        label="Middle name"
                        value={form.middleName}
                        onChange={(value) => setForm({ ...form, middleName: value })}
                        placeholder="Optional"
                    />
                    <InputField
                        label="Email address"
                        value={emailDisplay}
                        readOnly
                        helper="Login email from registration. Contact support to change it."
                    />
                    <InputField
                        label="Owner mobile number"
                        type="tel"
                        value={form.phone}
                        onChange={(value) =>
                            setForm({
                                ...form,
                                phone: value.replace(/\D/g, "").slice(0, 11),
                            })
                        }
                        placeholder="09XXXXXXXXX"
                        helper="Your personal number for account recovery and security — not shown on your public shop listing."
                    />
                    {profileError ? <p className="text-sm text-red-600">{profileError}</p> : null}
                    <button
                        type="submit"
                        disabled={savingProfile}
                        className="rounded-xl bg-[#154212] px-5 py-2.5 text-sm font-semibold text-white hover:bg-emerald-900 disabled:opacity-60"
                    >
                        {savingProfile ? "Saving..." : "Save owner profile"}
                    </button>
                </form>
            </section>

            <section className="max-w-xl rounded-2xl border border-zinc-200 bg-white p-5 sm:p-8 shadow-[0_4px_12px_rgba(141,170,145,0.12)]">
                <div className="mb-6 flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#c9e7cc]">
                        <Lock size={20} className="text-[#4e6953]" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold sm:text-xl">Security</h2>
                        <p className="text-sm text-[#72796e]">Password and sign-in protection.</p>
                    </div>
                </div>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <h3 className="text-sm font-semibold text-[#42493e]">Change password</h3>
                    <input
                        className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        placeholder="Current password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        required
                    />
                    <input
                        className="w-full rounded-xl border border-[#c2c9bb] bg-[#f9f9f8] px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-[#154212]"
                        placeholder="New password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        required
                        minLength={10}
                    />
                    {passwordError ? <p className="text-sm text-red-600">{passwordError}</p> : null}
                    <button
                        type="submit"
                        disabled={savingPassword}
                        className="w-full rounded-xl border-2 border-[#154212] py-2.5 text-sm font-semibold text-[#154212] transition-colors hover:bg-emerald-50 disabled:opacity-60"
                    >
                        {savingPassword ? "Updating..." : "Update password"}
                    </button>
                </form>

                <div className="my-6 h-px bg-zinc-100" />

                <div className="flex items-center justify-between gap-4">
                    <div>
                        <h3 className="text-sm font-semibold">Two-factor authentication</h3>
                        <p className="mt-1 text-xs text-[#72796e] sm:text-sm">
                            Extra security for your account (coming soon).
                        </p>
                    </div>
                    <button
                        type="button"
                        disabled
                        className="relative h-6 w-11 shrink-0 cursor-not-allowed rounded-full bg-zinc-200"
                        aria-label="Two-factor authentication off"
                    >
                        <div className="absolute left-1 top-1 h-4 w-4 rounded-full bg-white" />
                    </button>
                </div>
            </section>
        </div>
    );
}

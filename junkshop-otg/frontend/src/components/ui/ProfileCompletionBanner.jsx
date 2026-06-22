import { AlertCircle, CheckCircle2, Circle } from "lucide-react";

export default function ProfileCompletionBanner({
    user,
    role = "customer",
    onGoSettings,
    className = "",
}) {
    if (!user || user.profileComplete) {
        return null;
    }

    const status = user.profileStatus;
    const checklist = status?.checklist || [];
    const percent = status?.percent ?? 0;

    const title =
        role === "provider"
            ? "Complete your shop profile to go live"
            : "Complete your profile to book pickups";

    const subtitle =
        role === "provider"
            ? "Your shop stays hidden from the customer map until verification is done (like GCash full verification)."
            : "Browse shops and prices freely. Add your mobile number in Settings before booking a pickup.";

    return (
        <div
            className={`rounded-xl border border-amber-200 bg-amber-50/80 p-4 sm:p-5 md:p-6 ${className}`}
        >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-5">
                <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                        {title}
                    </h3>
                    <p className="text-xs sm:text-sm text-amber-900/80 mt-1 max-w-2xl">
                        {subtitle}
                    </p>

                    <div className="mt-3 h-2 w-full max-w-md rounded-full bg-amber-100 overflow-hidden">
                        <div
                            className="h-full rounded-full bg-[#154212] transition-all duration-300"
                            style={{ width: `${percent}%` }}
                        />
                    </div>
                    <p className="text-[11px] text-amber-800/70 mt-1">{percent}% complete</p>

                    {checklist.length > 0 && (
                        <ul className="mt-3 space-y-1.5">
                            {checklist.map((item) => (
                                <li
                                    key={item.id}
                                    className="flex items-center gap-2 text-xs sm:text-sm"
                                >
                                    {item.done ? (
                                        <CheckCircle2
                                            size={16}
                                            className="text-emerald-600 shrink-0"
                                        />
                                    ) : (
                                        <Circle
                                            size={16}
                                            className="text-amber-400 shrink-0"
                                        />
                                    )}
                                    <span
                                        className={
                                            item.done
                                                ? "text-emerald-800 line-through decoration-emerald-300/70"
                                                : "text-amber-950"
                                        }
                                    >
                                        {item.label}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <button
                    type="button"
                    onClick={onGoSettings}
                    className="w-full sm:w-auto shrink-0 rounded-xl bg-[#154212] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-emerald-900 transition-colors"
                >
                    {role === "provider" ? "Go to Shop Settings" : "Add phone in Settings"}
                </button>
            </div>
        </div>
    );
}

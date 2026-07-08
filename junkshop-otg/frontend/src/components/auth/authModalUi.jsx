import { X } from 'lucide-react';

export const authOverlayClass =
  'fixed inset-0 z-50 flex items-center justify-center px-4 py-4 bg-[#191c1c]/55 backdrop-blur-sm';

export const authInputClass =
  'h-11 w-full px-4 text-sm border border-zinc-200 rounded-xl bg-white focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20 transition-colors text-[#191c1c] placeholder:text-[#72796e]/60 disabled:opacity-60';

export const authInputWithIconClass = `${authInputClass} pr-11`;

export const authPasswordToggleButtonClass =
  'absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-charcoal/40 hover:text-charcoal/60';

export const authLabelClass = 'block text-sm font-semibold text-[#42493e] mb-1.5';

export const authSubmitClass =
  'w-full h-11 bg-[#154212] text-white rounded-xl font-semibold text-sm shadow-sm hover:bg-emerald-900 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const authRoleToggleWrapClass =
  'bg-zinc-100 rounded-xl p-1 flex items-stretch mb-2 min-h-11';

export function authRoleTabClass(isActive) {
  return `flex flex-1 min-w-0 items-center justify-center rounded-lg px-2 py-2.5 text-center text-xs sm:text-sm font-semibold leading-snug transition-colors ${
    isActive
      ? 'bg-white text-[#154212] shadow-sm ring-1 ring-zinc-200/80'
      : 'text-[#72796e] hover:text-[#191c1c]'
  }`;
}

export const authRoleHints = {
  customer: 'Customer — register with your email',
  provider: 'Junkshop Owner — Register your shop for admin verification',
};

export function AuthModalClose({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-3.5 right-3.5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-[#72796e] transition-colors hover:bg-red-600 hover:text-white"
      aria-label={label}
    >
      <X className="h-4 w-4" strokeWidth={2.5} />
    </button>
  );
}

export const authModalShellClass =
  'relative flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-white shadow-2xl rounded-2xl border border-zinc-200';

export function AuthErrorPopup({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-white/50 p-6 backdrop-blur-[3px]"
      role="presentation"
    >
      <div
        role="alert"
        className="relative w-full max-w-[17.5rem] rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-1 top-1 flex min-h-10 min-w-10 items-center justify-center rounded-full text-[#42493e] transition hover:bg-red-100/80"
          aria-label="Dismiss error"
        >
          <X className="h-3.5 w-3.5" strokeWidth={2.5} />
        </button>

        <div className="flex items-center gap-3 pr-5">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white"
            aria-hidden="true"
          >
            !
          </span>
          <p className="flex-1 text-center text-sm font-medium leading-snug text-red-800">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

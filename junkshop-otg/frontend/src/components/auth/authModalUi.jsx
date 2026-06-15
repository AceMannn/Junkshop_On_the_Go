import { X } from 'lucide-react';

export const authOverlayClass =
  'fixed inset-0 z-50 flex items-center justify-center px-4 py-4 bg-charcoal/50';

export const authInputClass =
  'h-11 w-full px-3 text-sm border border-gray-300 rounded-lg bg-white focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 disabled:opacity-60';

export const authInputWithIconClass = `${authInputClass} pr-10`;

export const authLabelClass = 'block text-sm font-medium text-charcoal mb-1.5';

export const authSubmitClass =
  'w-full h-11 bg-eco-green text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const authRoleToggleWrapClass = 'bg-light-gray rounded-lg p-1 h-11 flex mb-2';

export function authRoleTabClass(isActive) {
  return `flex-1 rounded-md font-medium transition-colors text-sm ${
    isActive
      ? 'bg-white text-charcoal shadow-sm'
      : 'text-charcoal/60 hover:text-charcoal'
  }`;
}

export const authRoleHints = {
  customer: 'Customer — Access recycling tools',
  provider: 'Provider — Manage junkshop operations',
};

export function AuthModalClose({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-3.5 right-3.5 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-light-gray text-charcoal/70 transition-colors hover:bg-red-600 hover:text-white"
      aria-label={label}
    >
      <X className="h-3.5 w-3.5" strokeWidth={2.5} />
    </button>
  );
}

export const authModalShellClass =
  'relative flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden bg-white shadow-xl';

export function AuthErrorPopup({ message, onDismiss }) {
  if (!message) return null;

  return (
    <div
      className="absolute inset-0 z-30 flex items-center justify-center bg-white/45 p-6 backdrop-blur-[4px]"
      role="presentation"
    >
      <div
        role="alert"
        className="relative w-full max-w-[17.5rem] rounded-xl border border-red-200 bg-red-50 px-4 py-3.5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onDismiss}
          className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center text-charcoal transition-opacity hover:opacity-70"
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

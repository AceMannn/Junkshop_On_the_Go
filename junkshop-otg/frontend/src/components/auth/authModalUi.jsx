import { X } from 'lucide-react';

export const authOverlayClass =
  'fixed inset-0 z-50 flex items-center justify-center px-4 py-4 bg-charcoal/50';

export const authInputClass =
  'h-11 w-full px-3 text-sm border border-gray-300 rounded-lg bg-white focus:border-eco-green focus:outline-none focus:ring-2 focus:ring-eco-green/20 transition-colors text-charcoal placeholder:text-charcoal/40 disabled:opacity-60';

export const authInputWithIconClass = `${authInputClass} pr-10`;

export const authLabelClass = 'block text-sm font-medium text-charcoal mb-1.5';

export const authSubmitClass =
  'w-full h-11 bg-eco-green text-white rounded-lg font-semibold text-sm shadow-sm hover:bg-eco-green/90 transition-colors disabled:opacity-60 disabled:cursor-not-allowed';

export const authRoleToggleWrapClass =
  'bg-light-gray rounded-lg p-1 flex items-stretch mb-2 min-h-11';

export function authRoleTabClass(isActive) {
  return `flex flex-1 min-w-0 items-center justify-center rounded-md px-2 py-2.5 text-center text-xs sm:text-sm font-medium leading-snug transition-colors ${
    isActive
      ? 'bg-white text-charcoal shadow-sm'
      : 'text-charcoal/60 hover:text-charcoal'
  }`;
}

export const authRoleHints = {
  customer: 'Customer — Log in with your mobile number',
  provider: 'Junkshop Owner — Register your shop for admin verification',
};

export function AuthModalClose({ onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="absolute top-3.5 right-3.5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-light-gray text-charcoal/70 transition-colors hover:bg-red-600 hover:text-white"
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
          className="absolute right-1 top-1 flex min-h-11 min-w-11 items-center justify-center rounded-full text-charcoal transition-opacity hover:bg-red-100/80 hover:opacity-100"
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

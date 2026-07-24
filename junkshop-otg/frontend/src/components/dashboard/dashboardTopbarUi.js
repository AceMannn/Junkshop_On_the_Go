/** Shared topbar styles for customer + provider dashboards (theme-aware). */

export const dashboardTopbarShellClass =
  'bg-[var(--dash-topbar-bg)] backdrop-blur-md fixed top-0 left-0 right-0 z-40 border-b border-[var(--dash-border)] shadow-sm h-16 overflow-visible';

export const dashboardTopbarInnerClass =
  'h-full w-full px-4 md:px-6 flex items-center justify-between gap-3 md:gap-4';

export const dashboardTopbarLogoClass =
  'h-9 w-auto max-w-[8.75rem] sm:h-10 sm:max-w-none md:h-11';

export const dashboardTopbarActionsClass =
  'flex items-center gap-1 md:gap-1.5 lg:gap-2 shrink-0';

export const dashboardIconButtonClass =
  'inline-flex min-h-11 min-w-11 items-center justify-center rounded-full p-2 text-[var(--dash-text)] hover:bg-[var(--dash-hover)] transition-colors';

/** Notification count on bell — tweak top/right in px for fine placement */
export const notificationBadgePositionClass = 'top-[-3px] right-[-5px]';

export const notificationBadgeBaseClass =
  'pointer-events-none absolute flex items-center justify-center rounded-full bg-red-500 text-[9px] font-bold leading-none text-white ring-2 ring-[var(--dash-surface)] shadow-sm';

/** Mobile: avatar only. md+: pill with border + name */
export const dashboardProfileTriggerClass =
  'flex shrink-0 items-center rounded-full transition-colors hover:bg-[var(--dash-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 md:h-10 md:gap-2 md:border md:border-[var(--dash-border)] md:bg-[var(--dash-surface)] md:pl-0.5 md:pr-3 md:hover:bg-[var(--dash-hover)]';

export const dashboardProfileNameClass =
  'hidden md:inline text-sm font-semibold text-[var(--dash-text)] max-w-[6rem] truncate leading-none';

export const dashboardAvatarClass =
  'h-9 w-9 shrink-0 rounded-full md:ring-2 md:ring-[var(--dash-surface)]';

export const dashboardMainPaddingClass =
  'max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8 py-6 sm:py-7 md:py-8';

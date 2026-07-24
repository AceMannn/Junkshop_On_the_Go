import {
  siteBtnGhostClass,
  siteBtnOutlineClass,
  siteBtnPrimaryClass,
  siteBtnSecondaryClass,
} from './siteUi';

const VARIANTS = {
  primary: siteBtnPrimaryClass,
  secondary: siteBtnSecondaryClass,
  outline: siteBtnOutlineClass,
  ghost: siteBtnGhostClass,
  dark: 'inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--site-brand-deep)] px-4 py-2.5 text-[15px] font-semibold text-[var(--site-btn-text)] shadow-sm transition hover:bg-[var(--site-btn)]',
};

export default function SiteButton({
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`${VARIANTS[variant] || VARIANTS.primary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

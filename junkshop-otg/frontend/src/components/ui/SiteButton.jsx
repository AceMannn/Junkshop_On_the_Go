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
  dark: 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#191c1c] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#154212]',
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

import { siteContainerClass } from './siteUi';

export default function SiteSectionHeader({
  title,
  description,
  align = 'center',
  className = '',
  eyebrow,
}) {
  const alignClass =
    align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center';

  return (
    <div className={`mb-10 sm:mb-12 ${alignClass} ${className}`}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-wider text-emerald-700 mb-2">{eyebrow}</p>
      )}
      <h2 className="mb-3 text-[#191c1c]">{title}</h2>
      {description && (
        <p
          className={`text-base sm:text-lg text-[#72796e] leading-relaxed ${
            align === 'center' ? 'max-w-3xl mx-auto' : 'max-w-2xl'
          }`}
        >
          {description}
        </p>
      )}
    </div>
  );
}

export function SiteSection({ children, className = '', container = true, id }) {
  return (
    <section id={id} className={className}>
      {container ? <div className={siteContainerClass}>{children}</div> : children}
    </section>
  );
}

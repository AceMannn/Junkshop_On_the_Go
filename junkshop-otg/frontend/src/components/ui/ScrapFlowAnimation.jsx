import { motion as Motion, useReducedMotion } from 'framer-motion';
import { Package, Newspaper, MapPin, Coins, Recycle } from 'lucide-react';

/**
 * Continuous on-theme hero loop: scrap → junkshop → earn.
 * Pauses automatically when prefers-reduced-motion is set.
 */
export default function ScrapFlowAnimation({ className = '', compact = false }) {
  const reduceMotion = useReducedMotion();

  const items = [
    { Icon: Package, label: 'Plastic' },
    { Icon: Newspaper, label: 'Paper' },
    { Icon: Recycle, label: 'Metal' },
  ];

  return (
    <div
      className={`relative overflow-hidden rounded-[1.75rem] border border-[var(--site-border)] bg-[var(--site-surface)]/95 backdrop-blur-md shadow-[var(--site-card-shadow)] ${className}`}
      aria-hidden
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,var(--site-orb),transparent_45%),radial-gradient(circle_at_80%_70%,var(--site-orb),transparent_40%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--site-accent)]/40 to-transparent" />

      <div
        className={`relative z-10 flex flex-col justify-center ${
          compact
            ? 'gap-3 p-3.5 sm:gap-4 sm:p-4'
            : 'min-h-[20rem] gap-6 p-6 sm:min-h-[24rem] sm:p-8'
        }`}
      >
        <div className={`flex flex-1 flex-col items-center justify-center ${compact ? 'gap-3' : 'gap-5'}`}>
          <div className="relative flex w-full max-w-sm items-center justify-between gap-2">
            {items.map((item, index) => (
              <Motion.div
                key={item.label}
                className="flex flex-col items-center gap-1.5"
                animate={
                  reduceMotion
                    ? undefined
                    : {
                        y: [0, -8, 0],
                        opacity: [0.7, 1, 0.7],
                      }
                }
                transition={{
                  duration: 2.8,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: index * 0.35,
                }}
              >
                <div
                  className={`flex items-center justify-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] text-[var(--site-accent)] shadow-sm ${
                    compact ? 'h-11 w-11' : 'h-14 w-14 sm:h-16 sm:w-16'
                  }`}
                >
                  <item.Icon size={compact ? 20 : 26} strokeWidth={1.75} />
                </div>
                {!compact && (
                  <span className="text-[10px] font-semibold uppercase tracking-wide text-[var(--site-muted)]">
                    {item.label}
                  </span>
                )}
              </Motion.div>
            ))}
          </div>

          <div className={`relative w-full max-w-xs ${compact ? 'h-7' : 'h-10'}`}>
            <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-[var(--site-border)]" />
            <Motion.div
              className="absolute top-1/2 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-[var(--site-accent)] shadow-[0_0_12px_var(--site-accent)]"
              animate={
                reduceMotion
                  ? { left: '50%' }
                  : { left: ['0%', '100%', '0%'] }
              }
              transition={
                reduceMotion
                  ? undefined
                  : { duration: 4.5, repeat: Infinity, ease: 'easeInOut' }
              }
            />
          </div>

          <div className={`flex w-full max-w-sm items-center justify-between ${compact ? 'gap-2' : 'gap-4'}`}>
            <Motion.div
              className={`flex flex-1 flex-col items-center rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface-alt)] ${
                compact ? 'gap-1.5 px-2 py-2.5' : 'gap-2 px-3 py-4'
              }`}
              animate={
                reduceMotion
                  ? undefined
                  : { scale: [1, 1.03, 1] }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <div
                className={`flex items-center justify-center rounded-xl bg-[var(--site-brand-deep)] text-[var(--site-btn-text)] ${
                  compact ? 'h-8 w-8' : 'h-11 w-11'
                }`}
              >
                <MapPin size={compact ? 14 : 20} />
              </div>
              <p className="text-center text-xs font-semibold text-[var(--site-text)]">Junkshop</p>
              {!compact && (
                <p className="text-center text-[10px] text-[var(--site-muted)]">Verified partner</p>
              )}
            </Motion.div>

            <Motion.div
              className={`flex flex-1 flex-col items-center rounded-2xl border border-[var(--site-pill-border)] bg-[var(--site-pill-bg)] ${
                compact ? 'gap-1.5 px-2 py-2.5' : 'gap-2 px-3 py-4'
              }`}
              animate={
                reduceMotion
                  ? undefined
                  : { scale: [1, 1.04, 1] }
              }
              transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
            >
              <div
                className={`flex items-center justify-center rounded-xl bg-[var(--site-btn)] text-[var(--site-btn-text)] ${
                  compact ? 'h-8 w-8' : 'h-11 w-11'
                }`}
              >
                <Coins size={compact ? 14 : 20} />
              </div>
              <Motion.p
                className="text-center text-sm font-bold text-[var(--site-accent)]"
                animate={
                  reduceMotion
                    ? undefined
                    : { opacity: [0.65, 1, 0.65] }
                }
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                ₱ earn
              </Motion.p>
              {!compact && (
                <p className="text-center text-[10px] text-[var(--site-muted)]">From scrap</p>
              )}
            </Motion.div>
          </div>
        </div>

        {!compact && (
          <p className="text-center text-xs leading-relaxed text-[var(--site-muted)]">
            Separate · Find a shop · Get paid for recyclables
          </p>
        )}
      </div>
    </div>
  );
}

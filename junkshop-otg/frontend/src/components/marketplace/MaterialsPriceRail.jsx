import { useEffect, useRef } from 'react';
import Reveal from '../ui/Reveal';
import { siteContainerClass, siteSectionPadClass } from '../ui/siteUi';

const CATEGORY_RAIL = [
  {
    id: 'plastic',
    label: 'Plastic',
    hint: 'Bottles · hard plastic · bags',
    price: '₱5–₱30',
    unit: '/kg',
    image:
      'https://images.unsplash.com/photo-1558640476-437a2b9438a2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwbGFzdGljJTIwYm90dGxlJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'metal',
    label: 'Metal',
    hint: 'Iron · aluminum · copper',
    price: '₱35–₱350',
    unit: '/kg',
    image:
      'https://images.unsplash.com/photo-1625662276901-4a7ec44fbeed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzY3JhcCUyMG1ldGFsJTIwcmVjeWNsaW5nfGVufDF8fHx8MTc2NTM4NTcwMHww&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'paper',
    label: 'Paper',
    hint: 'Newsprint · carton · office',
    price: '₱5–₱15',
    unit: '/kg',
    image:
      'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXBlciUyMHJlY3ljbGluZ3xlbnwxfHx8fDE3NjUzODU3MDB8MA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'glass',
    label: 'Glass',
    hint: 'Clear · colored bottles',
    price: '₱6–₱12',
    unit: '/kg',
    image:
      'https://images.unsplash.com/photo-1554208873-4292cf6c952d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxnbGFzcyUyMGJvdHRsZXMlMjByZWN5Y2xpbmd8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'tires',
    label: 'Tires',
    hint: 'Car · motorcycle · bike',
    price: '₱5–₱20',
    unit: '/pc',
    image:
      'https://images.unsplash.com/photo-1580274455191-1c62238fa333?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0aXJlJTIwc3RhY2t8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
  {
    id: 'ewaste',
    label: 'E-waste',
    hint: 'Phones · cables · parts',
    price: '₱50–₱800',
    unit: '/kg',
    image:
      'https://images.unsplash.com/photo-1728610996936-d93900f1886b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlbGVjdHJvbmljJTIwd2FzdGV8ZW58MXx8fHwxNzY1Mzg1NzAwfDA&ixlib=rb-4.1.0&q=80&w=1080',
  },
];

const LOOP_COPIES = 3;

function PriceCard({ item }) {
  return (
    <article className="flex h-full w-[14rem] shrink-0 flex-col overflow-hidden rounded-2xl border border-[var(--site-border)] bg-[var(--site-surface)] shadow-[var(--site-card-shadow)] transition hover:border-[var(--site-brand)] sm:w-[15.5rem]">
      <div className="relative h-28 shrink-0 overflow-hidden sm:h-32">
        <img
          src={item.image}
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
          draggable={false}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[var(--site-surface)] via-transparent to-transparent" />
      </div>
      <div className="flex flex-1 flex-col p-4 pt-3 sm:p-5 sm:pt-3">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--site-muted)]">
          {item.label}
        </p>
        <p className="mt-2 whitespace-nowrap font-[family-name:var(--font-display)] text-2xl font-bold tracking-tight text-[var(--site-text)] sm:text-[1.65rem]">
          {item.price}
          <span className="ml-1 text-sm font-semibold text-[var(--site-muted)]">{item.unit}</span>
        </p>
        <p className="mt-auto pt-3 text-xs leading-relaxed text-[var(--site-muted)]">{item.hint}</p>
      </div>
    </article>
  );
}

export default function MaterialsPriceRail({ onViewAll }) {
  const viewportRef = useRef(null);
  const trackRef = useRef(null);
  const setRef = useRef(null);
  const offsetRef = useRef(0);
  const setWidthRef = useRef(0);
  const pausedRef = useRef(false);
  const draggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragStartOffsetRef = useRef(0);
  const resumeTimerRef = useRef(null);

  useEffect(() => {
    const viewport = viewportRef.current;
    const track = trackRef.current;
    const firstSet = setRef.current;
    if (!viewport || !track || !firstSet) return undefined;

    const SPEED = 0.5; // px per frame — slow continuous drift
    let rafId = 0;

    const measure = () => {
      // One full set including trailing gap (pr-4) so wrap lines up exactly
      setWidthRef.current = firstSet.offsetWidth;
    };

    const wrapOffset = (value) => {
      const cycle = setWidthRef.current;
      if (cycle <= 0) return value;
      let next = value;
      while (next <= -cycle) next += cycle;
      while (next > 0) next -= cycle;
      return next;
    };

    const paint = () => {
      track.style.transform = `translate3d(${offsetRef.current}px, 0, 0)`;
    };

    const pause = () => {
      pausedRef.current = true;
      if (resumeTimerRef.current) {
        window.clearTimeout(resumeTimerRef.current);
        resumeTimerRef.current = null;
      }
    };

    const scheduleResume = () => {
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      resumeTimerRef.current = window.setTimeout(() => {
        pausedRef.current = false;
        resumeTimerRef.current = null;
      }, 1400);
    };

    measure();
    paint();

    const tick = () => {
      if (!pausedRef.current && !draggingRef.current && setWidthRef.current > 0) {
        offsetRef.current = wrapOffset(offsetRef.current - SPEED);
        paint();
      }
      rafId = window.requestAnimationFrame(tick);
    };
    rafId = window.requestAnimationFrame(tick);

    const onResize = () => {
      measure();
      offsetRef.current = wrapOffset(offsetRef.current);
      paint();
    };

    const onWheel = (event) => {
      if (Math.abs(event.deltaY) < Math.abs(event.deltaX) && event.deltaX === 0) return;
      const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
      pause();
      offsetRef.current = wrapOffset(offsetRef.current - delta);
      paint();
      scheduleResume();
    };

    const onPointerDown = (event) => {
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      draggingRef.current = true;
      pause();
      dragStartXRef.current = event.clientX;
      dragStartOffsetRef.current = offsetRef.current;
      viewport.setPointerCapture?.(event.pointerId);
      viewport.classList.add('cursor-grabbing');
    };

    const onPointerMove = (event) => {
      if (!draggingRef.current) return;
      const delta = event.clientX - dragStartXRef.current;
      offsetRef.current = wrapOffset(dragStartOffsetRef.current + delta);
      paint();
    };

    const onPointerUp = (event) => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      viewport.releasePointerCapture?.(event.pointerId);
      viewport.classList.remove('cursor-grabbing');
      scheduleResume();
    };

    const ro = new ResizeObserver(onResize);
    ro.observe(firstSet);
    window.addEventListener('resize', onResize);
    viewport.addEventListener('wheel', onWheel, { passive: true });
    viewport.addEventListener('pointerdown', onPointerDown);
    viewport.addEventListener('pointermove', onPointerMove);
    viewport.addEventListener('pointerup', onPointerUp);
    viewport.addEventListener('pointercancel', onPointerUp);

    return () => {
      window.cancelAnimationFrame(rafId);
      if (resumeTimerRef.current) window.clearTimeout(resumeTimerRef.current);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      viewport.removeEventListener('wheel', onWheel);
      viewport.removeEventListener('pointerdown', onPointerDown);
      viewport.removeEventListener('pointermove', onPointerMove);
      viewport.removeEventListener('pointerup', onPointerUp);
      viewport.removeEventListener('pointercancel', onPointerUp);
    };
  }, []);

  return (
    <section className={`${siteSectionPadClass} site-page-bg`}>
      <div className={siteContainerClass}>
        <Reveal className="mb-8 flex flex-col gap-4 sm:mb-10 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-[var(--site-accent)]">
              Price guide
            </p>
            <h2 className="font-[family-name:var(--font-display)] text-[var(--site-text)]">
              What your scrap can earn
            </h2>
            <p className="mt-3 text-base text-[var(--site-muted)] sm:text-lg">
              Browse local reference ranges before you visit or book a pickup.
            </p>
          </div>
          {onViewAll && (
            <button
              type="button"
              onClick={onViewAll}
              className="shrink-0 self-start text-sm font-semibold text-[var(--site-accent)] underline-offset-4 hover:underline sm:self-auto"
            >
              Open full guide
            </button>
          )}
        </Reveal>

        <div
          ref={viewportRef}
          className="cursor-grab select-none overflow-hidden active:cursor-grabbing [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          aria-label="Scrap price categories"
        >
          <div ref={trackRef} className="flex w-max will-change-transform">
            {Array.from({ length: LOOP_COPIES }, (_, copyIndex) => (
              <div
                key={`set-${copyIndex}`}
                ref={copyIndex === 0 ? setRef : undefined}
                className="flex items-stretch gap-4 pr-4"
                aria-hidden={copyIndex > 0}
              >
                {CATEGORY_RAIL.map((item) => (
                  <PriceCard key={`${copyIndex}-${item.id}`} item={item} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from 'react';

/** Default poll interval for live dashboard data (ms). */
export const REFRESH_INTERVAL_MS = 20000;

/** Faster poll while tracking an active pickup (ms). */
export const REFRESH_INTERVAL_FAST_MS = 8000;

/**
 * Polls a refetch function on an interval. Pauses when the browser tab is hidden.
 * Use silent refetch (no loading spinner) inside your callback when polling.
 */
export function useAutoRefresh(refetch, options = {}) {
  const {
    intervalMs = REFRESH_INTERVAL_MS,
    enabled = true,
    pauseWhenHidden = true,
    runOnMount = false,
  } = options;

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!enabled || !refetchRef.current) return undefined;

    let intervalId;

    const run = () => {
      refetchRef.current?.();
    };

    const start = () => {
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(run, intervalMs);
    };

    const stop = () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = undefined;
      }
    };

    if (runOnMount) run();
    start();

    if (!pauseWhenHidden || typeof document === 'undefined') {
      return () => stop();
    }

    const onVisibility = () => {
      if (document.hidden) {
        stop();
      } else {
        run();
        start();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, intervalMs, pauseWhenHidden, runOnMount]);
}

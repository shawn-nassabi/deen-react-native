import { useEffect, useRef, useState } from "react";

/**
 * useStreamingText
 *
 * JS-only typewriter scheduler. Holds a "target" string (the full text buffered
 * from the SSE stream so far) and a "displayed" string (what's actually rendered).
 * On a steady interval, advances displayed toward target by a small character
 * batch — producing a smooth, gradual reveal instead of the backend's 2-line jumps.
 *
 * Lifecycle:
 *   - While isActive=true OR displayed.length < target.length, an interval ticks.
 *   - When displayed catches up AND isActive flips to false, the interval is cleared.
 *   - If target shrinks (e.g., new message starts), displayed resets to "".
 *
 * Works in Expo Go and standalone builds — uses plain setInterval, no native deps,
 * no reanimated worklets.
 *
 * Adaptive cadence: if the buffered tail (target.length - displayed.length) grows
 * large (backend is far ahead), we advance more chars per tick to avoid lagging.
 */
export function useStreamingText(
  target: string,
  isActive: boolean,
  opts?: { charsPerTick?: number; intervalMs?: number; maxLagBeforeBoost?: number }
): string {
  const baseCharsPerTick = opts?.charsPerTick ?? 2;
  const intervalMs = opts?.intervalMs ?? 16; // ~60fps; markdown WebView only sees diffs
  const maxLagBeforeBoost = opts?.maxLagBeforeBoost ?? 120;

  const [displayed, setDisplayed] = useState("");
  const targetRef = useRef(target);
  const activeRef = useRef(isActive);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Keep refs in sync without restarting the interval on every render.
  useEffect(() => {
    targetRef.current = target;
    activeRef.current = isActive;

    // If target shrinks (e.g., new stream session began), reset displayed to ""
    // so we don't accidentally render leftover text from the previous response.
    setDisplayed((prev) => (prev.length > target.length ? "" : prev));
  }, [target, isActive]);

  useEffect(() => {
    const tick = () => {
      const t = targetRef.current;
      setDisplayed((prev) => {
        if (prev.length >= t.length) {
          // Caught up — if the producer is no longer active, stop ticking.
          if (!activeRef.current && intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          return prev;
        }

        const remaining = t.length - prev.length;
        // Adaptive: if we're falling behind, take a bigger bite this tick.
        const step =
          remaining > maxLagBeforeBoost
            ? Math.max(baseCharsPerTick, Math.ceil(remaining / 20))
            : baseCharsPerTick;

        const nextLen = Math.min(t.length, prev.length + step);
        return t.slice(0, nextLen);
      });
    };

    // Start ticking whenever we either have new text to reveal or a live stream.
    const needsTick = isActive || displayed.length < target.length;

    if (needsTick && intervalRef.current === null) {
      intervalRef.current = setInterval(tick, intervalMs);
    }

    return () => {
      if (intervalRef.current !== null) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
    // We intentionally depend on isActive and target so the effect re-evaluates
    // whether a tick loop is needed. The tick body reads via refs so we don't
    // restart the interval on every char update.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, isActive, intervalMs, baseCharsPerTick, maxLagBeforeBoost, displayed.length === 0]);

  return displayed;
}

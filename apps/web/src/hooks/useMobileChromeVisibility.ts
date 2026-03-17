import { useEffect, useRef, useState } from "react";

type UseMobileChromeVisibilityOptions = {
  disabled?: boolean;
  minY?: number;
  topRevealY?: number;
  hideDelta?: number;
  showDelta?: number;
  revealSignal?: number | string;
  holdVisibleMs?: number;
};

export function useMobileChromeVisibility(options?: UseMobileChromeVisibilityOptions) {
  const {
    disabled = false,
    minY = 72,
    topRevealY = 20,
    hideDelta = 10,
    showDelta = 10,
    revealSignal,
    holdVisibleMs = 850,
  } = options ?? {};

  const [visible, setVisible] = useState(true);
  const lastYRef = useRef(0);
  const tickingRef = useRef(false);
  const holdUntilRef = useRef(0);

  useEffect(() => {
    if (disabled) {
      setVisible(true);
      return;
    }
    if (typeof window === "undefined") return;

    lastYRef.current = window.scrollY;
    setVisible(true);

    const onScroll = () => {
      if (tickingRef.current) return;
      tickingRef.current = true;
      window.requestAnimationFrame(() => {
        const nextY = window.scrollY;
        const delta = nextY - lastYRef.current;
        const now = Date.now();

        if (now < holdUntilRef.current) {
          setVisible(true);
          lastYRef.current = nextY;
          tickingRef.current = false;
          return;
        }

        if (nextY <= topRevealY || nextY < minY) {
          setVisible(true);
        } else if (delta > hideDelta) {
          setVisible(false);
        } else if (delta < -showDelta) {
          setVisible(true);
        }

        lastYRef.current = nextY;
        tickingRef.current = false;
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [disabled, hideDelta, minY, showDelta, topRevealY]);

  useEffect(() => {
    if (disabled) return;
    holdUntilRef.current = Date.now() + holdVisibleMs;
    setVisible(true);
  }, [disabled, holdVisibleMs, revealSignal]);

  return visible;
}

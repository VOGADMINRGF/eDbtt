export const MOTION_EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const MOTION_TIMINGS = {
  fast: 0.16,
  base: 0.22,
  slow: 0.26,
} as const;

export function createRevealVariants(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
  };
}

export function createStepVariants(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 6 },
    visible: { opacity: 1, y: 0 },
  };
}

export function createPresenceVariants(reducedMotion: boolean) {
  if (reducedMotion) {
    return {
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 1, y: 0 },
    };
  }

  return {
    hidden: { opacity: 0, y: 8 },
    visible: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -6 },
  };
}

export function createMotionTransition(reducedMotion: boolean, delay = 0) {
  if (reducedMotion) {
    return { duration: 0 };
  }

  return {
    delay,
    duration: MOTION_TIMINGS.base,
    ease: MOTION_EASE,
  };
}

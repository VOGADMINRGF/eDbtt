"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { createMotionTransition, createPresenceVariants } from "./motionVariants";

type SafeDivAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
>;

type MotionPresencePanelProps = SafeDivAttributes & {
  children: ReactNode;
  present: boolean;
};

export default function MotionPresencePanel({
  children,
  className,
  present,
  ...props
}: MotionPresencePanelProps) {
  const reducedMotion = useReducedMotion();

  if (!present) {
    return null;
  }

  if (reducedMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <AnimatePresence initial={false}>
      <motion.div
        key="motion-presence-panel"
        animate="visible"
        className={className}
        exit="exit"
        initial="hidden"
        transition={createMotionTransition(false)}
        variants={createPresenceVariants(false)}
        {...props}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

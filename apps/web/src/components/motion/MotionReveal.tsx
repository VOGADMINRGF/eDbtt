"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createMotionTransition, createRevealVariants } from "./motionVariants";

type SafeDivAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
>;

type MotionRevealProps = SafeDivAttributes & {
  children: ReactNode;
  delay?: number;
};

export default function MotionReveal({
  children,
  className,
  delay = 0,
  ...props
}: MotionRevealProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <div className={className} {...props}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      animate="visible"
      className={className}
      initial="hidden"
      transition={createMotionTransition(false, delay)}
      variants={createRevealVariants(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

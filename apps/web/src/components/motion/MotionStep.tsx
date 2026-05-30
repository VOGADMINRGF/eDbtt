"use client";

import type { HTMLAttributes, ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { createMotionTransition, createStepVariants } from "./motionVariants";

type SafeDivAttributes = Omit<
  HTMLAttributes<HTMLDivElement>,
  | "onAnimationEnd"
  | "onAnimationIteration"
  | "onAnimationStart"
  | "onDrag"
  | "onDragEnd"
  | "onDragStart"
>;

type MotionStepProps = SafeDivAttributes & {
  children: ReactNode;
  stepIndex?: number;
};

export default function MotionStep({
  children,
  className,
  stepIndex = 0,
  ...props
}: MotionStepProps) {
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
      transition={createMotionTransition(false, Math.min(stepIndex * 0.04, 0.12))}
      variants={createStepVariants(false)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

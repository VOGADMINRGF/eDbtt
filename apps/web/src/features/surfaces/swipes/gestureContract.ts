import type { SwipeDecision } from "@/features/swipes/types";

type ResolveSwipeGestureDecisionInput = {
  dx: number;
  dy: number;
  cardWidth: number;
  durationMs: number;
};

export function resolveSwipeGestureDecision(
  input: ResolveSwipeGestureDecisionInput,
): SwipeDecision | null {
  const { dx, dy } = input;
  const cardWidth = Math.max(input.cardWidth, 280);
  const durationMs = Math.max(input.durationMs, 1);

  const horizontalDistance = Math.abs(dx);
  const verticalDistance = Math.abs(dy);
  const distanceThreshold = Math.min(156, Math.max(78, cardWidth * 0.24));
  const verticalDriftLimit = Math.min(120, Math.max(42, cardWidth * 0.3));
  const averageVelocity = dx / durationMs;
  const isFastFlick = Math.abs(averageVelocity) >= 0.6 && horizontalDistance >= 36;
  const hasHorizontalIntent = horizontalDistance > verticalDistance * 1.2;

  if (!hasHorizontalIntent) return null;
  if (verticalDistance > verticalDriftLimit) return null;
  if (!(horizontalDistance >= distanceThreshold || isFastFlick)) return null;

  return dx > 0 ? "agree" : "disagree";
}

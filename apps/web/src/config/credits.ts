export const SWIPES_PER_CONTRIBUTION_CREDIT = 100;
export const MAX_STORED_CONTRIBUTION_CREDITS = 50;

export const XP_PER_SWIPE = 1;

export type CreditState = {
  swipeCountTotal: number;
  creditsAvailable: number;
};

export function applySwipeForCredits(state: CreditState): CreditState {
  const previousSwipes = Number.isFinite(state.swipeCountTotal)
    ? Math.max(0, Math.floor(state.swipeCountTotal))
    : 0;
  const previousCredits = Number.isFinite(state.creditsAvailable)
    ? Math.max(0, Math.floor(state.creditsAvailable))
    : 0;

  const swipeCountTotal = previousSwipes + 1;
  const previousCreditSteps = Math.floor(previousSwipes / SWIPES_PER_CONTRIBUTION_CREDIT);
  const nextCreditSteps = Math.floor(swipeCountTotal / SWIPES_PER_CONTRIBUTION_CREDIT);
  const earnedCredits = Math.max(0, nextCreditSteps - previousCreditSteps);

  return {
    swipeCountTotal,
    creditsAvailable: Math.min(MAX_STORED_CONTRIBUTION_CREDITS, previousCredits + earnedCredits),
  };
}

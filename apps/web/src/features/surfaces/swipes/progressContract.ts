export type SwipesProgressState = {
  mode: "idle" | "active";
  swipeCount: number;
};

export function resolveSwipesProgressState(params: {
  swipeCount: number;
  decisionCount: number;
  fromDraftMode: boolean;
}): SwipesProgressState {
  const swipeCount = Math.max(0, Math.trunc(params.swipeCount));
  const decisionCount = Math.max(0, Math.trunc(params.decisionCount));
  const active = swipeCount > 0 || decisionCount > 0 || params.fromDraftMode;
  return {
    mode: active ? "active" : "idle",
    swipeCount,
  };
}

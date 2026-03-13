import type { StatementVote } from "@/components/statements/StatementCard";
import type { SwipeDecision, SwipeItem } from "@/features/swipes/types";
import { SwipeCard, SwipeableCardShell } from "./SwipeCard";

type SwipesDeckProps = {
  items: SwipeItem[];
  activeIndex: number;
  flashDecision: { id: string; decision: SwipeDecision } | null;
  onRequestActive: (index: number) => void;
  onOpen: (item: SwipeItem) => void;
  onSwipeDecision: (item: SwipeItem, decision: SwipeDecision, index: number) => void;
  onVote: (item: SwipeItem, vote: StatementVote, index: number) => void;
};

export function SwipesDeck({
  items,
  activeIndex,
  flashDecision,
  onRequestActive,
  onOpen,
  onSwipeDecision,
  onVote,
}: SwipesDeckProps) {
  return (
    <>
      {items.map((item, idx) => {
        const isActiveCard = idx === activeIndex;
        const currentFlash = flashDecision?.id === item.id ? flashDecision.decision : null;
        return (
          <SwipeableCardShell
            key={item.id}
            onRequestActive={() => onRequestActive(idx)}
            onOpen={() => onOpen(item)}
            onSwipeDecision={(decision) => onSwipeDecision(item, decision, idx)}
            onSwipeUp={() => onOpen(item)}
          >
            <SwipeCard
              item={item}
              isActive={isActiveCard}
              flashDecision={currentFlash}
              onVote={(vote) => onVote(item, vote, idx)}
              onOpenDetails={() => onOpen(item)}
              onOpenEventualities={item.hasEventualities ? () => onOpen(item) : undefined}
            />
          </SwipeableCardShell>
        );
      })}
    </>
  );
}


import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const motionState = vi.hoisted(() => ({
  reducedMotion: false,
}));

vi.mock("framer-motion", () => {
  const MotionDiv = (props: Record<string, unknown>) => {
    const {
      animate: _animate,
      children,
      exit: _exit,
      initial: _initial,
      onAnimationComplete: _onAnimationComplete,
      transition: _transition,
      variants: _variants,
      ...rest
    } = props;

    return <div {...rest}>{children}</div>;
  };

  return {
    AnimatePresence: ({ children }: { children: any }) => <>{children}</>,
    motion: {
      div: MotionDiv,
    },
    useReducedMotion: () => motionState.reducedMotion,
  };
});

import MotionPresencePanel from "@/components/motion/MotionPresencePanel";
import MotionReveal from "@/components/motion/MotionReveal";
import MotionStep from "@/components/motion/MotionStep";
import {
  createMotionTransition,
  createPresenceVariants,
  createRevealVariants,
  createStepVariants,
} from "@/components/motion/motionVariants";

describe("motion foundation render contract", () => {
  beforeEach(() => {
    motionState.reducedMotion = false;
  });

  it("renders the motion components without crashing", () => {
    const html = renderToStaticMarkup(
      <div>
        <MotionReveal className="reveal">Erster Hinweis</MotionReveal>
        <MotionStep className="step" stepIndex={2}>
          Zweiter Hinweis
        </MotionStep>
        <MotionPresencePanel className="panel" present>
          Dritter Hinweis
        </MotionPresencePanel>
      </div>,
    );

    expect(html).toContain("Erster Hinweis");
    expect(html).toContain("Zweiter Hinweis");
    expect(html).toContain("Dritter Hinweis");
    expect(html).toContain('class="reveal"');
    expect(html).toContain('class="step"');
    expect(html).toContain('class="panel"');
  });

  it("uses reduced-motion-safe variants and transitions", () => {
    motionState.reducedMotion = true;

    const html = renderToStaticMarkup(
      <div>
        <MotionReveal className="reduced-reveal">Ruhig</MotionReveal>
        <MotionPresencePanel className="reduced-panel" present>
          Ohne Bewegung
        </MotionPresencePanel>
      </div>,
    );

    expect(html).toContain("Ruhig");
    expect(html).toContain("Ohne Bewegung");
    expect(createRevealVariants(true)).toEqual({
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    });
    expect(createStepVariants(true)).toEqual({
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
    });
    expect(createPresenceVariants(true)).toEqual({
      hidden: { opacity: 1, y: 0 },
      visible: { opacity: 1, y: 0 },
      exit: { opacity: 1, y: 0 },
    });
    expect(createMotionTransition(true, 0.08)).toEqual({ duration: 0 });
  });

  it("does not render the presence panel when it is absent", () => {
    const html = renderToStaticMarkup(
      <MotionPresencePanel className="hidden-panel" present={false}>
        Unsichtbar
      </MotionPresencePanel>,
    );

    expect(html).toBe("");
  });
});

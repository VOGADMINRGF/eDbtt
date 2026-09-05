import * as React from "react";
import { chromium } from "@playwright/test";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import CreateVisualFollowup from "@/features/create/CreateVisualFollowup";
import { buildCreateIntelligentFollowup } from "@/features/create/intelligentFollowup";
import {
  CREATE_FAST_INTAKE_TIMEOUT_MS,
  CREATE_INTELLIGENT_FOLLOWUP_CLIENT_TIMEOUT_MS,
} from "@/features/create/createFastIntakeTiming";

const REGRESSION_TEXT =
  "ich bin für mindestlohn bei behindertenwerkstätten, für mehr integration innerhalb der wirtschaft aber auch für stärkere kontrollen der vorstände der jeweiligen akteure";
const EXPECTED_TOPIC =
  "Arbeitsbedingungen und Teilhabe in Behindertenwerkstätten";
const EXPECTED_ASPECTS = [
  "Faire Entlohnung / Mindestlohn",
  "Integration in den allgemeinen Arbeitsmarkt",
  "Kontrolle / Governance der Träger bzw. Vorstände",
];
const noop = () => {};

describe.runIf(process.env.CREATE_LIVE_REGRESSION_SMOKE === "1")(
  "create planner live responsive smoke",
  () => {
    it.each([
      ["desktop", 1_440, 900],
      ["mobile", 390, 844],
    ])(
      "returns and renders the canonical result on %s",
      async (device, width, height) => {
        const browser = await chromium.launch({ headless: true });
        try {
          const page = await browser.newPage({ viewport: { width, height } });
          const fastIntakeStartedAt = performance.now();
          const result = await buildCreateIntelligentFollowup({
            text: REGRESSION_TEXT,
            locale: "de",
            intent: "contribute",
            requestId: `live-regression-${device}-${Date.now()}`,
            operationId: `live-regression-${device}-${Date.now()}`,
            operationType: "create_intelligent_followup_planner",
          });
          const html = renderToStaticMarkup(
            <div data-test-viewport={`${width}x${height}`} style={{ width }}>
              <CreateVisualFollowup
                result={result}
                onConfirm={noop}
                onEdit={noop}
                onPrepareSubmission={noop}
                onPrepareAnlassraum={noop}
                onOpenDossierAppend={noop}
                onOpenDossierCreate={noop}
                onPrepareVote={noop}
                onRequestEditorialReview={noop}
                onStartOptionalService={noop}
                onSaveOnly={noop}
                continuationValue=""
                onContinuationChange={noop}
                onContinueConversation={noop}
              />
            </div>,
          );
          await page.setContent(html, { waitUntil: "domcontentloaded" });
          const visible = await page
            .locator("[data-create-understanding-aspects]")
            .isVisible();
          const fastIntakeToVisibleMs = Math.round(
            performance.now() - fastIntakeStartedAt,
          );
          const planner = result.meta?.planner;
          const evidence = {
            device: `${device} ${width}x${height}`,
            canonicalTopicCount: result.understanding.topics.length,
            mainTopic: result.understanding.topics[0]?.label ?? null,
            aspects: result.understanding.aspects ?? [],
            stance: result.understanding.statements[0]?.stance ?? null,
            provider: planner?.plannerProvider ?? null,
            model:
              planner?.providerAttempts[0]?.model ??
              planner?.plannerDebug.usedModel ??
              null,
            providerAttempts: planner?.providerAttemptCount ?? null,
            plannerMs: planner?.runtimeMs ?? null,
            postPlannerToVisibleMs:
              typeof planner?.runtimeMs === "number"
                ? Math.max(0, fastIntakeToVisibleMs - planner.runtimeMs)
                : null,
            fastIntakeToVisibleMs,
          };

          console.info(`[create-live-regression] ${JSON.stringify(evidence)}`);
          expect(result.understanding.topics.map((topic) => topic.label)).toEqual([
            EXPECTED_TOPIC,
          ]);
          expect(result.understanding.aspects).toEqual(EXPECTED_ASPECTS);
          expect(result.understanding.statements[0]?.stance).toBe("pro");
          expect(planner?.plannerProvider).toBe("openai");
          expect(planner?.providerAttemptCount).toBe(1);
          expect(planner?.runtimeMs).toBeLessThan(
            CREATE_FAST_INTAKE_TIMEOUT_MS + 300,
          );
          expect(fastIntakeToVisibleMs).toBeLessThan(
            CREATE_INTELLIGENT_FOLLOWUP_CLIENT_TIMEOUT_MS,
          );
          expect(visible).toBe(true);
          expect(html).toContain("Ich sehe einen gemeinsamen Kern.");
          expect(html).toContain("1 Thema sichtbar");
          expect(EXPECTED_ASPECTS.every((aspect) => html.includes(aspect))).toBe(true);
          expect(html).not.toMatch(/\[object Object\]|&quot;undefined&quot;|&quot;null&quot;/);
        } finally {
          await browser.close();
        }
      },
      10_000,
    );
  },
);

import { describe, expect, it } from "vitest";
import {
  hasPrimaryIntakeText,
  shouldShowCreatePostInputModules,
} from "@/app/create/CreateClient";

describe("create intake progressive disclosure", () => {
  it("treats empty or whitespace-only input as not started", () => {
    expect(hasPrimaryIntakeText("")).toBe(false);
    expect(hasPrimaryIntakeText("   \n")).toBe(false);
  });

  it("accepts free-text intake input as valid start signal", () => {
    expect(hasPrimaryIntakeText("Mein Anliegen mit Kontext und Fragen")).toBe(true);
  });

  it("shows post-input modules only after explicit progress and non-empty intake", () => {
    expect(
      shouldShowCreatePostInputModules({
        hasStarted: false,
        intakeText: "Text liegt vor",
      }),
    ).toBe(false);

    expect(
      shouldShowCreatePostInputModules({
        hasStarted: true,
        intakeText: "   ",
      }),
    ).toBe(false);

    expect(
      shouldShowCreatePostInputModules({
        hasStarted: true,
        intakeText: "Erster vollständiger Beitrag",
      }),
    ).toBe(true);
  });
});

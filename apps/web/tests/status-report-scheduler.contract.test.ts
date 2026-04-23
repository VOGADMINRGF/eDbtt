import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveDueScheduledSlots } from "@/features/ops/statusReport/scheduler";

describe("status-report-scheduler.contract", () => {
  it("detects 05:00 slot inside grace window", () => {
    const now = new Date("2026-04-19T03:05:00.000Z"); // 05:05 Europe/Berlin
    const due = resolveDueScheduledSlots(now, "Europe/Berlin", 20, ["05:00", "17:00"]);
    expect(due).toEqual(["05:00"]);
  });

  it("detects 17:00 slot inside grace window", () => {
    const now = new Date("2026-04-19T15:10:00.000Z"); // 17:10 Europe/Berlin
    const due = resolveDueScheduledSlots(now, "Europe/Berlin", 20, ["05:00", "17:00"]);
    expect(due).toEqual(["17:00"]);
  });

  it("returns empty list outside slot windows", () => {
    const now = new Date("2026-04-19T12:30:00.000Z");
    const due = resolveDueScheduledSlots(now, "Europe/Berlin", 20, ["05:00", "17:00"]);
    expect(due).toEqual([]);
  });

  it("keeps instrumentation scheduler free from static run imports", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "src/features/ops/statusReport/scheduler.ts"),
      "utf8",
    );
    expect(source).not.toMatch(/from\s+["']\.\/run["']/);
  });
});

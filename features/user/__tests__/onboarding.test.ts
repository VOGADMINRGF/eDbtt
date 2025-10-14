// features/user/__tests__/onboarding.test.ts

import { getNextOnboardingStep, getOnboardingProgress } from "../utils/onboarding";

const mockUser = (overrides: any = {}) => ({
  status: "active",
  verification: "none",
  onboardingStatus: "incomplete",
  premium: false,
  ...overrides,
});

describe("getNextOnboardingStep", () => {
  it("should prompt for login if user is null", () => {
    expect(getNextOnboardingStep(null as any)).toMatch(/einloggen/i);
  });
  it("should prompt for mail/phone verification if verification is none", () => {
    expect(getNextOnboardingStep(mockUser())).toMatch(/bestätige/i);
  });
  it("should prompt for legitimation if verified", () => {
    expect(getNextOnboardingStep(mockUser({ verification: "verified" }))).toMatch(/legitimiere/i);
  });
  it("should prompt for missing docs if onboardingStatus is pendingDocs", () => {
    expect(getNextOnboardingStep(mockUser({ onboardingStatus: "pendingDocs", verification: "verified" }))).toMatch(/dokumente/i);
  });
  it("should prompt for premium if onboarding complete but no premium", () => {
    expect(getNextOnboardingStep(mockUser({ onboardingStatus: "complete", verification: "legitimized" }))).toMatch(/premium/i);
  });
  it("should confirm completion if all done", () => {
    expect(getNextOnboardingStep(mockUser({ onboardingStatus: "complete", verification: "legitimized", premium: true }))).toMatch(/abgeschlossen/i);
  });
});

describe("getOnboardingProgress", () => {
  it("should return 0 for banned user", () => {
    expect(getOnboardingProgress(mockUser({ status: "banned" }))).toBe(0);
  });
  it("should return 20 for none verification", () => {
    expect(getOnboardingProgress(mockUser())).toBe(20);
  });
  it("should return 60 for verified", () => {
    expect(getOnboardingProgress(mockUser({ verification: "verified" }))).toBe(60);
  });
  it("should return 80 for pendingDocs", () => {
    expect(getOnboardingProgress(mockUser({ onboardingStatus: "pendingDocs", verification: "verified" }))).toBe(80);
  });
  it("should return 90 for complete, not premium", () => {
    expect(getOnboardingProgress(mockUser({ onboardingStatus: "complete", verification: "legitimized" }))).toBe(90);
  });
  it("should return 100 for complete + premium", () => {
    expect(getOnboardingProgress(mockUser({ onboardingStatus: "complete", verification: "legitimized", premium: true }))).toBe(100);
  });
});

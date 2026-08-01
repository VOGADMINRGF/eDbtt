import { vi } from "vitest";

vi.mock("@/features/create/createRouteSecurity", () => ({
  enforceCreateMutationSecurity: vi.fn(async () => null),
  verifyCreateDraftBinding: vi.fn(),
}));

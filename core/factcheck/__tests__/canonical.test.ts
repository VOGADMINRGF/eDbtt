// core/factcheck/__tests__/canonical.test.ts
import { canonicalKey } from "../canonical";

test("stable canonicalKey", () => {
  const a = canonicalKey({ text: "Berlin 2024: Mieten stiegen um 8%.", scope: "Berlin, DE", timeframe: "2024" });
  const b = canonicalKey({ text: "mieten stiegen um 8 % in berlin 2024", scope: "Berlin, DE", timeframe: "2024" });
  expect(a).toBe(b);
});

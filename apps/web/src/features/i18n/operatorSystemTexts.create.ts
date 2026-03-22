import { getOperatorSystemTexts, type OperatorLocale } from "./operatorSystemTexts.core";

export type OperatorCreateTexts = ReturnType<typeof getOperatorSystemTexts>["create"];

export function getOperatorCreateTexts(locale: OperatorLocale): OperatorCreateTexts {
  return getOperatorSystemTexts(locale).create;
}

import { getOperatorSystemTexts, type OperatorLocale } from "./operatorSystemTexts.core";

export type OperatorFeedsTexts = ReturnType<typeof getOperatorSystemTexts>["feeds"];
export type OperatorFeedDraftsTexts = ReturnType<typeof getOperatorSystemTexts>["feedDrafts"];
export type OperatorAnlassraumListTexts = ReturnType<typeof getOperatorSystemTexts>["anlassraumList"];
export type OperatorAnlassraumDetailTexts = ReturnType<typeof getOperatorSystemTexts>["anlassraumDetail"];

export function getOperatorFeedsTexts(locale: OperatorLocale): OperatorFeedsTexts {
  return getOperatorSystemTexts(locale).feeds;
}

export function getOperatorFeedDraftsTexts(locale: OperatorLocale): OperatorFeedDraftsTexts {
  return getOperatorSystemTexts(locale).feedDrafts;
}

export function getOperatorAnlassraumListTexts(locale: OperatorLocale): OperatorAnlassraumListTexts {
  return getOperatorSystemTexts(locale).anlassraumList;
}

export function getOperatorAnlassraumDetailTexts(locale: OperatorLocale): OperatorAnlassraumDetailTexts {
  return getOperatorSystemTexts(locale).anlassraumDetail;
}

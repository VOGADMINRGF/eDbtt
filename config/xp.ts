export const XP_EVENT_VALUES = {
  swipe: 1,
  eventuality_create: 10,
  question_takeover: 20,
  report_research: 35,
  stream_participation: 50,
  stream_host_quality: 200,
  council_quality_mark: 500,
} as const;

export type XpEventType = keyof typeof XP_EVENT_VALUES;

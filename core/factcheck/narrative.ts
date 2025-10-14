import type { RhetoricFlag } from "./types";

export function detectFrames(text: string): string[] {
  const frames: string[] = [];
  if (/\bsicherheit|terror|kriminal/i.test(text)) frames.push("Sicherheit");
  if (/\bkorrupt|elite|lobby/i.test(text)) frames.push("Korruption/Elite");
  if (/\bgesundheit|impf|virus|klin/i.test(text)) frames.push("Gesundheit");
  if (/\bgrenz|souver|nation|heimat/i.test(text)) frames.push("Souveränität");
  if (/\bklima|co2|energie|wärme/i.test(text)) frames.push("Klima/Energie");
  if (/\bwirtschaft|inflation|arbeitslos|bip|export/i.test(text)) frames.push("Wirtschaft");
  if (/\bmigration|asyl|flucht|integration/i.test(text)) frames.push("Migration");
  if (/\bgender|gleichstell|divers/i.test(text)) frames.push("Gender/Equality");
  return frames;
}

export function detectRhetoric(text: string): RhetoricFlag[] {
  const flags: RhetoricFlag[] = [];
  if (/\bimmer|nie|jeder|alle\b/i.test(text)) flags.push({ type: "Absolutismus", confidence: 0.7 });
  if (/whatabout|was ist mit/i.test(text)) flags.push({ type: "Whataboutism", confidence: 0.8 });
  if (/wenn.*dann.*(untergang|katastro|total)/i.test(text)) flags.push({ type: "SlipperySlope", confidence: 0.6 });
  if (/\bidiot|dumm|lügner|naiv/i.test(text)) flags.push({ type: "AdHominem", confidence: 0.85 });
  if (/(ironie|sarkasmus)/i.test(text)) flags.push({ type: "Ironie/Sarkasmus", confidence: 0.5 });
  return flags;
}

export function isFalsifiable(text: string): boolean {
  return /\b(\d+|%|jahr|seit|am \d{1,2}\.|belegt|studie|bericht|zitat|quelle|gesetz|paragraf)\b/i.test(text);
}

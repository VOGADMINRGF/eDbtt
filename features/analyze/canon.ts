// apps/web/src/features/analyze/canon.ts
import { z } from "zod";

/** Tier-1 Domains (stabil) */
export const DOMAIN_CANON = [
  "Verfassung & Grundrechte","Demokratie & Beteiligung","Wahlen & Parteienrecht",
  "Parlamente & Verfahren","Föderalismus & Kommunen","Öffentliche Verwaltung & E-Gov",
  "Transparenz & Antikorruption","Innere Sicherheit & Polizei","Justiz & Rechtsstaat",
  "Außenpolitik & Diplomatie","EU-Politik","Entwicklung & Humanitäres",
  "Wirtschaftspolitik","Finanzen & Steuern","Arbeit & Beschäftigung","Soziales & Grundsicherung",
  "Rente & Alterssicherung","Gesundheitspolitik","Pflege","Bildung","Hochschule & Forschung",
  "Digitalisierung & Netzpolitik","Datenschutz & IT-Sicherheit","Familie & Gleichstellung",
  "Kinder & Jugend","Migration & Integration","Wohnen & Stadtentwicklung",
  "Verkehr & Infrastruktur","Energiepolitik","Klima & Umweltschutz",
  "Landwirtschaft","Verbraucherschutz","Tierschutz & Tierhaltung",
  "Kultur, Medien & Sport","Handel & Außenwirtschaft","Regionalentwicklung & Ländlicher Raum",
  "Bau & Planungsrecht","Kommunalpolitik","Verteidigung & Bundeswehr",
] as const;
export const DomainCanon = z.enum(DOMAIN_CANON);

/** Tier-2 Topics (erweiterbar) */
const TOPIC_BASE = [
  "Meinungsfreiheit","Bürgerentscheide","Wahlrecht","Ausschüsse","Kommunalfinanzen",
  "Registermodernisierung","Lobbyregister","Cybercrime","Digitaljustiz","Sanktionen",
  "Binnenmarkt","Industriestrategie","Schuldenbremse","Mindestlohn","Zeitarbeit",
  "Bürgergeld","Kindergrundsicherung","Rentenniveau","Primärversorgung","KV",
  "Krankenhausplanung","GVSG","Notfallversorgung","Pflegepersonal","Lehrkräftemangel",
  "Open Science","Netzausbau","KI-Governance","Open Data","Digitale Identität",
  "DSGVO","Elterngeld","Jugendschutz","Asylverfahren","Staatsangehörigkeit",
  "Mietrecht","Sozialer Wohnungsbau","Deutschlandticket","Radwege",
  "Erneuerbare","Wasserstoff","CO₂-Bepreisung","Kreislaufwirtschaft",
  "Haltungsstufen","Produktsicherheit","Tiertransporte","Rundfunk",
  "CETA","Lieferketten","Breitband","Wärmeplanung kommunal","Bauordnung","Bürgerentscheid",
] as const;

const TOPIC_EXT = [
  "Ehrenamt","Zivilgesellschaft","Katastrophenschutz","Zivilschutz","Krisenvorsorge",
  "Drogenpolitik","Pandemievorsorge","Landarztquote","Behindertenrechte","Barrierefreiheit",
  "Geldwäschebekämpfung","Krypto-Regulierung","Bankenaufsicht","Plattformaufsicht/DSA",
  "Desinformation","Medienkompetenz digital","Klimaanpassung","Biodiversität","Lärmschutz",
  "Smart City","Obdachlosigkeit","Weiterbildung/Qualifizierung","Fachkräfteeinwanderung",
  "Wehrpflicht","Zivildienst","Rüstungsbeschaffung","NATO-2%","Tourismusförderung","Öffentliche Beschaffung",
] as const;

export const TOPIC_CANON = [...TOPIC_BASE, ...TOPIC_EXT] as const;
export const TopicCanon = z.enum(TOPIC_CANON);

/** Zusätzliche Enums */
export const ClaimType = z.enum(["Fakt","Forderung","Prognose","Wertung"]);
export const PolicyInstrument = z.enum([
  "Steuer/Abgabe","Subvention/Förderung","Verbot/Limit","Erlaubnis/Ausnahme",
  "Transparenz/Reporting","Investition","Organisation/Prozess","Standard/Norm",
]);
export const BallotDimension = z.enum([
  "Budget","Gesetz/Regel","Personal/Organisation","Infrastruktur","Symbol/Resolution",
]);

/**
 * Politisch-geografischer Bezug (Land, Kommune, Wahlkreis …)
 */
export interface PoliticalArea {
  _id?: string;
  continent?: string;
  country?: string;
  countryCode?: string;
  state?: string;
  region?: string;
  district?: string;
  municipality?: string;
  ward?: string;
  zipCode?: string;
  lat?: number;
  lng?: number;
  politicalLevel: 'global' | 'eu' | 'federal' | 'state' | 'district' | 'municipality';
  politicalAreaId?: string;
  description?: string;
  parentAreaId?: string;
  isActive?: boolean;
  population?: number;
  languageCodes?: string[];
  geoShapeUrl?: string;
  areaType?: string;
  createdAt?: string;
  updatedAt?: string;
  archived?: boolean;
  version?: number;
}

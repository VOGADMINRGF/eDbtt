export type AdminConfig = {
  limits: { newsfeedMaxPerRun: number };
  region: { defaultRegionKey: string };
  features: string[];
  roles: string[];
};

export const adminConfig: AdminConfig = {
  limits: { newsfeedMaxPerRun: 50 },
  region: { defaultRegionKey: "de-national" },
  features: [],
  roles: ["admin"],
};

export default adminConfig;

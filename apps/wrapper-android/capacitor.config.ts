import type { CapacitorConfig } from "@capacitor/cli";

const DEFAULT_SERVER_URL = "https://edebatte.org";
const rawServerUrl = process.env.WRAPPER_WEB_URL?.trim();
const serverUrl = rawServerUrl && rawServerUrl.length > 0 ? rawServerUrl : DEFAULT_SERVER_URL;
const parsedServerUrl = new URL(serverUrl);
const cleartext = parsedServerUrl.protocol === "http:";
const runtimeEntryUrl = `${parsedServerUrl.origin}/start`;

const allowNavigation = (() => {
  if (parsedServerUrl.hostname === "edebatte.org" || parsedServerUrl.hostname.endsWith(".edebatte.org")) {
    return ["edebatte.org", "*.edebatte.org"];
  }
  return [parsedServerUrl.hostname];
})();

const config: CapacitorConfig = {
  appId: "org.edebatte.app",
  appName: "eDebatte",
  webDir: "www",
  server: {
    url: runtimeEntryUrl,
    cleartext,
    allowNavigation,
  },
  plugins: {
    App: {
      disableBackButtonHandler: true,
    },
  },
};

export default config;

import { lookup as dnsLookup } from "node:dns/promises";
import type { LookupAddress } from "node:dns";
import { BlockList, isIP, type LookupFunction } from "node:net";
import { Agent, fetch as undiciFetch, type Dispatcher } from "undici";

const DEFAULT_TIMEOUT_MS = 12_000;
const DEFAULT_MAX_REDIRECTS = 3;

const blockedAddresses = new BlockList();

for (const [network, prefix] of [
  ["0.0.0.0", 8],
  ["10.0.0.0", 8],
  ["100.64.0.0", 10],
  ["127.0.0.0", 8],
  ["169.254.0.0", 16],
  ["172.16.0.0", 12],
  ["192.0.0.0", 24],
  ["192.0.2.0", 24],
  ["192.168.0.0", 16],
  ["198.18.0.0", 15],
  ["198.51.100.0", 24],
  ["203.0.113.0", 24],
  ["224.0.0.0", 4],
  ["240.0.0.0", 4],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv4");
}

for (const [network, prefix] of [
  ["::", 128],
  ["::1", 128],
  ["fc00::", 7],
  ["fe80::", 10],
  ["ff00::", 8],
  ["2001:db8::", 32],
] as const) {
  blockedAddresses.addSubnet(network, prefix, "ipv6");
}

const blockedHostnames = new Set([
  "localhost",
  "metadata.google.internal",
  "metadata.aws.internal",
  "instance-data",
]);

export type SafeExternalFetchResult = {
  buffer: Buffer;
  contentType: string;
  finalUrl: string;
  headers: Headers;
  redirectCount: number;
  status: number;
};

type LookupHost = (hostname: string) => Promise<LookupAddress[]>;
type FetchImplementation = typeof undiciFetch;

export type SafeExternalFetchDependencies = {
  createDispatcher?: (address: LookupAddress) => Dispatcher | null;
  fetchImpl?: FetchImplementation;
  lookupHost?: LookupHost;
};

export type SafeExternalFetchOptions = {
  accept: string;
  maxBytes: number | ((input: { contentType: string; finalUrl: string }) => number);
  maxRedirects?: number;
  timeoutMs?: number;
  userAgent: string;
};

function normalizeHostname(hostname: string): string {
  return hostname.toLowerCase().replace(/^\[|\]$/g, "").replace(/\.$/, "");
}

function mappedIpv4(address: string): string | null {
  const suffix = address.toLowerCase().match(/^::ffff:(.+)$/)?.[1];
  if (!suffix) return null;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(suffix)) return suffix;
  const words = suffix.split(":");
  if (words.length !== 2 || words.some((word) => !/^[0-9a-f]{1,4}$/.test(word))) return null;
  const high = Number.parseInt(words[0], 16);
  const low = Number.parseInt(words[1], 16);
  return `${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`;
}

export function isBlockedExternalAddress(address: string): boolean {
  const normalized = normalizeHostname(address);
  const mapped = mappedIpv4(normalized);
  if (mapped) return blockedAddresses.check(mapped, "ipv4");
  const family = isIP(normalized);
  if (family === 4) return blockedAddresses.check(normalized, "ipv4");
  if (family === 6) return blockedAddresses.check(normalized, "ipv6");
  return true;
}

export function assertSafeExternalUrl(rawUrl: string): URL {
  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new Error("external_source_url_invalid");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("external_source_protocol_blocked");
  }
  if (url.username || url.password) {
    throw new Error("external_source_credentials_blocked");
  }
  const hostname = normalizeHostname(url.hostname);
  if (
    !hostname ||
    blockedHostnames.has(hostname) ||
    hostname.endsWith(".localhost") ||
    hostname.endsWith(".local") ||
    hostname.endsWith(".internal") ||
    hostname.endsWith(".home.arpa")
  ) {
    throw new Error("external_source_host_blocked");
  }
  if (isIP(hostname) > 0 && isBlockedExternalAddress(hostname)) {
    throw new Error("external_source_address_blocked");
  }
  return url;
}

async function resolvePublicAddress(hostname: string, lookupHost: LookupHost): Promise<LookupAddress> {
  const normalized = normalizeHostname(hostname);
  const literalFamily = isIP(normalized);
  const addresses = literalFamily
    ? [{ address: normalized, family: literalFamily }]
    : await lookupHost(normalized);
  if (addresses.length === 0 || addresses.some((entry) => isBlockedExternalAddress(entry.address))) {
    throw new Error("external_source_address_blocked");
  }
  return addresses[0];
}

function defaultDispatcher(address: LookupAddress): Dispatcher {
  const lookup: LookupFunction = (_hostname, options, callback) => {
    if (options.all) {
      callback(null, [address]);
      return;
    }
    callback(null, address.address, address.family);
  };
  return new Agent({
    connect: { lookup },
  });
}

async function readLimitedBody(response: Awaited<ReturnType<FetchImplementation>>, maxBytes: number) {
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (Number.isFinite(declaredLength) && declaredLength > maxBytes) {
    throw new Error("external_source_too_large");
  }
  if (!response.body) return Buffer.alloc(0);

  const chunks: Buffer[] = [];
  let total = 0;
  for await (const chunk of response.body) {
    const next = Buffer.from(chunk);
    total += next.length;
    if (total > maxBytes) {
      await response.body.cancel().catch(() => undefined);
      throw new Error("external_source_too_large");
    }
    chunks.push(next);
  }
  return Buffer.concat(chunks, total);
}

export async function safeExternalFetch(
  rawUrl: string,
  options: SafeExternalFetchOptions,
  dependencies: SafeExternalFetchDependencies = {},
): Promise<SafeExternalFetchResult> {
  const lookupHost = dependencies.lookupHost ?? ((hostname) => dnsLookup(hostname, { all: true, verbatim: true }));
  const fetchImpl = dependencies.fetchImpl ?? undiciFetch;
  const createDispatcher = dependencies.createDispatcher ?? defaultDispatcher;
  const maxRedirects = options.maxRedirects ?? DEFAULT_MAX_REDIRECTS;
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  let currentUrl = assertSafeExternalUrl(rawUrl);

  for (let redirectCount = 0; redirectCount <= maxRedirects; redirectCount += 1) {
    const address = await resolvePublicAddress(currentUrl.hostname, lookupHost);
    const dispatcher = createDispatcher(address);
    try {
      const response = await fetchImpl(currentUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(timeoutMs),
        headers: {
          accept: options.accept,
          "user-agent": options.userAgent,
        },
        ...(dispatcher ? { dispatcher } : {}),
      });

      if ([301, 302, 303, 307, 308].includes(response.status)) {
        const location = response.headers.get("location");
        if (!location) throw new Error("external_source_redirect_invalid");
        if (redirectCount >= maxRedirects) throw new Error("external_source_redirect_limit");
        currentUrl = assertSafeExternalUrl(new URL(location, currentUrl).href);
        continue;
      }
      if (!response.ok) throw new Error(`external_source_http_${response.status}`);

      const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
      const maxBytes =
        typeof options.maxBytes === "function"
          ? options.maxBytes({ contentType, finalUrl: currentUrl.href })
          : options.maxBytes;
      const buffer = await readLimitedBody(response, maxBytes);
      if (buffer.length === 0) throw new Error("external_source_empty");
      return {
        buffer,
        contentType,
        finalUrl: currentUrl.href,
        headers: new Headers(response.headers),
        redirectCount,
        status: response.status,
      };
    } finally {
      await dispatcher?.close().catch(() => undefined);
    }
  }

  throw new Error("external_source_redirect_limit");
}

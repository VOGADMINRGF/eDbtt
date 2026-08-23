import { describe, expect, it, vi } from "vitest";
import {
  assertSafeExternalUrl,
  safeExternalFetch,
  type SafeExternalFetchDependencies,
} from "@/lib/net/safeExternalFetch";

const publicAddress = { address: "93.184.216.34", family: 4 } as const;

function dependencies(
  fetchImpl: ReturnType<typeof vi.fn>,
  lookupHost: SafeExternalFetchDependencies["lookupHost"] = async () => [publicAddress],
): SafeExternalFetchDependencies {
  return {
    createDispatcher: () => null,
    fetchImpl: fetchImpl as never,
    lookupHost,
  };
}

const options = {
  accept: "text/html,application/pdf",
  maxBytes: 128,
  timeoutMs: 1_000,
  userAgent: "eDebatte security contract",
};

describe("safeExternalFetch SSRF and resource boundary", () => {
  it.each([
    "http://localhost/source",
    "http://service.local/source",
    "http://127.0.0.1/source",
    "http://127.255.255.254/source",
    "http://[::1]/source",
    "http://[::ffff:127.0.0.1]/source",
    "http://10.0.0.1/source",
    "http://172.16.0.1/source",
    "http://172.31.255.254/source",
    "http://192.168.1.1/source",
    "http://169.254.169.254/latest/meta-data",
    "http://[fe80::1]/source",
    "http://metadata.google.internal/computeMetadata/v1/",
  ])("blocks local, private, link-local or metadata URL %s before fetching", async (url) => {
    const fetchImpl = vi.fn();
    await expect(safeExternalFetch(url, options, dependencies(fetchImpl))).rejects.toThrow(
      /external_source_(?:host|address)_blocked/,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("rejects a public hostname when any resolved address is private", async () => {
    const fetchImpl = vi.fn();
    await expect(
      safeExternalFetch(
        "https://public.example/source",
        options,
        dependencies(fetchImpl, async () => [publicAddress, { address: "10.1.2.3", family: 4 }]),
      ),
    ).rejects.toThrow("external_source_address_blocked");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("revalidates every redirect and stops a public-to-private redirect before the second request", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "http://169.254.169.254/latest/meta-data" },
      }),
    );

    await expect(
      safeExternalFetch("https://public.example/source", options, dependencies(fetchImpl)),
    ).rejects.toThrow("external_source_address_blocked");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("revalidates redirected host DNS and rejects rebinding to RFC1918", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response(null, {
        status: 302,
        headers: { location: "https://redirect.example/internal" },
      }),
    );
    const lookupHost = vi.fn(async (hostname: string) =>
      hostname === "public.example"
        ? [publicAddress]
        : [{ address: "192.168.10.20", family: 4 }],
    );

    await expect(
      safeExternalFetch(
        "https://public.example/source",
        options,
        dependencies(fetchImpl, lookupHost),
      ),
    ).rejects.toThrow("external_source_address_blocked");
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("rejects oversized declared and streamed bodies", async () => {
    const declared = vi.fn().mockResolvedValueOnce(
      new Response("short", { headers: { "content-length": "129", "content-type": "text/html" } }),
    );
    await expect(
      safeExternalFetch("https://public.example/declared", options, dependencies(declared)),
    ).rejects.toThrow("external_source_too_large");

    const streamed = vi.fn().mockResolvedValueOnce(
      new Response("x".repeat(129), { headers: { "content-type": "application/pdf" } }),
    );
    await expect(
      safeExternalFetch("https://public.example/streamed", options, dependencies(streamed)),
    ).rejects.toThrow("external_source_too_large");
  });

  it("uses the post-response MIME to select an HTML or PDF byte ceiling", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response("x".repeat(129), { headers: { "content-type": "text/html" } }),
    );
    await expect(
      safeExternalFetch(
        "https://public.example/source",
        { ...options, maxBytes: ({ contentType }) => (contentType.includes("pdf") ? 256 : 128) },
        dependencies(fetchImpl),
      ),
    ).rejects.toThrow("external_source_too_large");
  });

  it("pins a validated public address and returns only a bounded successful body", async () => {
    const fetchImpl = vi.fn().mockResolvedValueOnce(
      new Response("public source", { status: 200, headers: { "content-type": "text/plain" } }),
    );
    const result = await safeExternalFetch(
      "https://public.example/source",
      options,
      dependencies(fetchImpl),
    );

    expect(result.buffer.toString("utf8")).toBe("public source");
    expect(result.finalUrl).toBe("https://public.example/source");
    expect(result.redirectCount).toBe(0);
    expect(assertSafeExternalUrl(result.finalUrl).hostname).toBe("public.example");
  });
});

type EnvSource = Record<string, string | undefined>;

function readEnv(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

export function resolveCoreMongoRuntimeConfig(source: EnvSource = process.env) {
  const coreUri = readEnv(source.CORE_MONGODB_URI);
  const coreDbName = readEnv(source.CORE_DB_NAME);
  const legacyUri = readEnv(source.MONGODB_URI);
  const legacyDbName = readEnv(source.MONGODB_DB);

  return {
    uri: coreUri ?? legacyUri,
    dbName: coreDbName ?? legacyDbName,
    usedLegacyUri: !coreUri && Boolean(legacyUri),
    usedLegacyDbName: !coreDbName && Boolean(legacyDbName),
  };
}

export function hasCoreMongoRuntimeConfig(source: EnvSource = process.env): boolean {
  const resolved = resolveCoreMongoRuntimeConfig(source);
  return Boolean(resolved.uri && resolved.dbName);
}

export function resolveMongoUriForZone(
  zone: "core" | "votes" | "pii",
  source: EnvSource = process.env,
): string | null {
  const legacyUri = readEnv(source.MONGODB_URI);
  if (zone === "core") {
    return readEnv(source.CORE_MONGODB_URI) ?? legacyUri;
  }
  if (zone === "votes") {
    return readEnv(source.VOTES_MONGODB_URI) ?? legacyUri;
  }
  return readEnv(source.PII_MONGODB_URI) ?? legacyUri;
}


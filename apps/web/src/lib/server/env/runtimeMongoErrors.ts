type MongoRuntimeErrorKind = "srv" | "dns" | "conn_refused" | "unknown";

export type MongoRuntimeErrorClassification = {
  kind: MongoRuntimeErrorKind;
  code: string | null;
  message: string;
};

type ErrorLike = {
  code?: unknown;
  message?: unknown;
  cause?: unknown;
};

function readErrorCode(value: unknown): string | null {
  if (value == null) return null;
  const code = String(value).trim();
  return code ? code.toUpperCase() : null;
}

function readErrorMessage(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (value instanceof Error) return value.message.trim();
  if (value && typeof value === "object" && "message" in value) {
    return String((value as ErrorLike).message ?? "").trim();
  }
  return "";
}

function flattenErrorChain(error: unknown, maxDepth = 4): ErrorLike[] {
  const out: ErrorLike[] = [];
  let current = error;
  let depth = 0;
  while (current && depth < maxDepth) {
    if (typeof current === "object") {
      const next = current as ErrorLike;
      out.push(next);
      current = next.cause;
      depth += 1;
      continue;
    }
    break;
  }
  return out;
}

function classifyKind(code: string | null, message: string): MongoRuntimeErrorKind {
  const normalized = message.toLowerCase();
  if (
    normalized.includes("querysrv") ||
    normalized.includes("_mongodb._tcp") ||
    normalized.includes("srv lookup")
  ) {
    return "srv";
  }
  if (
    code === "ENOTFOUND" ||
    code === "EAI_AGAIN" ||
    normalized.includes("getaddrinfo") ||
    normalized.includes("dns")
  ) {
    return "dns";
  }
  if (code === "ECONNREFUSED" || normalized.includes("econnrefused")) {
    return "conn_refused";
  }
  return "unknown";
}

export function classifyMongoRuntimeError(error: unknown): MongoRuntimeErrorClassification {
  const chain = flattenErrorChain(error);
  const message = chain
    .map((entry) => readErrorMessage(entry))
    .filter(Boolean)
    .join(" | ");
  const code = chain.map((entry) => readErrorCode(entry.code)).find(Boolean) ?? null;
  const fallbackMessage = message || readErrorMessage(error) || "Mongo runtime error";
  return {
    kind: classifyKind(code, fallbackMessage),
    code,
    message: fallbackMessage,
  };
}

export function toMongoRuntimeError(error: unknown, context: string): Error {
  const classification = classifyMongoRuntimeError(error);
  const wrapped = new Error(
    `Mongo runtime failure [${classification.kind}] (${context}): ${classification.message}`,
  );
  (wrapped as Error & { cause?: unknown }).cause = error;
  (wrapped as Error & { mongoRuntime?: MongoRuntimeErrorClassification }).mongoRuntime =
    classification;
  return wrapped;
}

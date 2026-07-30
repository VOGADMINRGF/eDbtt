type EnvSource = Record<string, string | undefined>;

export type WebRuntimeEnvIssueCode =
  | "mail_from_missing"
  | "mail_from_conflict"
  | "mail_from_not_canonical"
  | "mail_reply_to_missing"
  | "mail_reply_to_not_canonical"
  | "web_database_url_missing"
  | "database_url_without_web_database_url"
  | "web_database_url_conflict"
  | "jwt_secret_missing";

export type WebRuntimeEnvIssue = {
  code: WebRuntimeEnvIssueCode;
  message: string;
};

export type MailFromResolution = {
  value: string | null;
  source: "MAIL_FROM" | "SMTP_FROM" | null;
  usesLegacyAlias: boolean;
  issues: WebRuntimeEnvIssue[];
};

export const CANONICAL_MAIL_FROM = "eDebatte <members@edebatte.org>";
export const CANONICAL_MAIL_REPLY_TO = "eDebatte Team <members@edebatte.org>";

export type MailEnvelopeResolution = {
  from: string;
  replyTo: string;
  fromSource: "MAIL_FROM" | "SMTP_FROM" | "canonical_fallback";
  replyToSource: "MAIL_REPLY_TO" | "canonical_fallback";
  usesLegacyAlias: boolean;
  issues: WebRuntimeEnvIssue[];
};

export type WebDatabaseResolution = {
  value: string | null;
  usesLegacyAlias: false;
  issues: WebRuntimeEnvIssue[];
};

function readTrimmed(env: EnvSource, key: string) {
  const value = env[key];
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function resolveCanonicalMailFrom(env: EnvSource = process.env): MailFromResolution {
  const mailFrom = readTrimmed(env, "MAIL_FROM");
  const smtpFrom = readTrimmed(env, "SMTP_FROM");
  const issues: WebRuntimeEnvIssue[] = [];

  if (mailFrom && smtpFrom && mailFrom !== smtpFrom) {
    issues.push({
      code: "mail_from_conflict",
      message:
        "MAIL_FROM und SMTP_FROM unterscheiden sich. MAIL_FROM ist kanonisch; SMTP_FROM bleibt nur als Legacy-Alias erlaubt.",
    });
  }

  const value = mailFrom ?? smtpFrom ?? null;
  if (!value) {
    issues.push({
      code: "mail_from_missing",
      message:
        "MAIL_FROM fehlt. SMTP_FROM wird nur noch als rückwärtskompatibler Legacy-Alias unterstützt.",
    });
  }

  return {
    value,
    source: mailFrom ? "MAIL_FROM" : smtpFrom ? "SMTP_FROM" : null,
    usesLegacyAlias: !mailFrom && Boolean(smtpFrom),
    issues,
  };
}

export function resolveCanonicalMailEnvelope(
  env: EnvSource = process.env,
): MailEnvelopeResolution {
  const fromResolution = resolveCanonicalMailFrom(env);
  const configuredReplyTo = readTrimmed(env, "MAIL_REPLY_TO");
  const issues = [...fromResolution.issues];

  if (fromResolution.value && fromResolution.value !== CANONICAL_MAIL_FROM) {
    issues.push({
      code: "mail_from_not_canonical",
      message:
        "MAIL_FROM muss exakt der kanonischen eDebatte-Absenderidentität entsprechen.",
    });
  }

  if (!configuredReplyTo) {
    issues.push({
      code: "mail_reply_to_missing",
      message: "MAIL_REPLY_TO fehlt für die eDebatte-Mailkommunikation.",
    });
  } else if (configuredReplyTo !== CANONICAL_MAIL_REPLY_TO) {
    issues.push({
      code: "mail_reply_to_not_canonical",
      message:
        "MAIL_REPLY_TO muss exakt der kanonischen eDebatte-Antwortadresse entsprechen.",
    });
  }

  return {
    from:
      fromResolution.value === CANONICAL_MAIL_FROM
        ? fromResolution.value
        : CANONICAL_MAIL_FROM,
    replyTo:
      configuredReplyTo === CANONICAL_MAIL_REPLY_TO
        ? configuredReplyTo
        : CANONICAL_MAIL_REPLY_TO,
    fromSource: fromResolution.source ?? "canonical_fallback",
    replyToSource: configuredReplyTo
      ? "MAIL_REPLY_TO"
      : "canonical_fallback",
    usesLegacyAlias: fromResolution.usesLegacyAlias,
    issues,
  };
}

export function resolveCanonicalWebDatabaseUrl(env: EnvSource = process.env): WebDatabaseResolution {
  const webDatabaseUrl = readTrimmed(env, "WEB_DATABASE_URL");
  const databaseUrl = readTrimmed(env, "DATABASE_URL");
  const issues: WebRuntimeEnvIssue[] = [];

  if (!webDatabaseUrl) {
    issues.push({
      code: databaseUrl
        ? "database_url_without_web_database_url"
        : "web_database_url_missing",
      message: databaseUrl
        ? "WEB_DATABASE_URL fehlt. Der Web-Runtime-Fallback auf DATABASE_URL ist deaktiviert."
        : "WEB_DATABASE_URL fehlt.",
    });
  }

  if (webDatabaseUrl && databaseUrl && webDatabaseUrl !== databaseUrl) {
    issues.push({
      code: "web_database_url_conflict",
      message:
        "WEB_DATABASE_URL und DATABASE_URL unterscheiden sich. Die Web-Runtime akzeptiert nur WEB_DATABASE_URL.",
    });
  }

  return {
    value: webDatabaseUrl,
    usesLegacyAlias: false,
    issues,
  };
}

export function resolveMailFromForRuntime(
  env: EnvSource = process.env,
) {
  return resolveMailEnvelopeForRuntime(env).from;
}

export function resolveMailEnvelopeForRuntime(
  env: EnvSource = process.env,
): Pick<MailEnvelopeResolution, "from" | "replyTo"> {
  const resolution = resolveCanonicalMailEnvelope(env);
  const production = readTrimmed(env, "NODE_ENV") === "production";
  const fatalIssues = production
    ? resolution.issues
    : resolution.issues.filter((issue) =>
        [
          "mail_from_conflict",
          "mail_from_not_canonical",
          "mail_reply_to_not_canonical",
        ].includes(issue.code),
      );
  if (fatalIssues.length > 0) {
    throw new CriticalProductionWebRuntimeEnvError(fatalIssues);
  }
  return {
    from: resolution.from,
    replyTo: resolution.replyTo,
  };
}

export function hasSmtpTransportConfig(env: EnvSource = process.env) {
  return Boolean(
    readTrimmed(env, "SMTP_URL") ||
      readTrimmed(env, "SMTP_HOST") ||
      readTrimmed(env, "SMTP_USER"),
  );
}

export function collectCriticalProductionWebRuntimeIssues(
  env: EnvSource = process.env,
): WebRuntimeEnvIssue[] {
  const issues = [...resolveCanonicalWebDatabaseUrl(env).issues];

  if (!readTrimmed(env, "JWT_SECRET")) {
    issues.push({
      code: "jwt_secret_missing",
      message: "JWT_SECRET fehlt für die Production-Web-Runtime.",
    });
  }

  return issues;
}

export class CriticalProductionWebRuntimeEnvError extends Error {
  readonly issues: WebRuntimeEnvIssue[];

  constructor(issues: WebRuntimeEnvIssue[]) {
    super(
      `Critical production web runtime env invalid: ${issues
        .map((issue) => issue.code)
        .join(", ")}`,
    );
    this.name = "CriticalProductionWebRuntimeEnvError";
    this.issues = issues;
  }
}

export function assertCriticalProductionWebRuntimeEnv(env: EnvSource = process.env) {
  const issues = collectCriticalProductionWebRuntimeIssues(env);
  if (issues.length > 0) {
    throw new CriticalProductionWebRuntimeEnvError(issues);
  }
}

export function shouldValidateProductionStartupEnv(env: EnvSource = process.env) {
  const nodeEnv = readTrimmed(env, "NODE_ENV");
  if (nodeEnv !== "production") return false;
  return readTrimmed(env, "NEXT_PHASE") !== "phase-production-build";
}

export function validateProductionStartupEnv(env: EnvSource = process.env) {
  if (!shouldValidateProductionStartupEnv(env)) return;
  assertCriticalProductionWebRuntimeEnv(env);
}

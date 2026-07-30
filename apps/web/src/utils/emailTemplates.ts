import type { BankDetails } from "@/config/banking";
import {
  legacyMailHtml,
  renderTransactionalMail,
  renderLegacyTransactionalMail,
  resolveMailLocale,
  type LegacyMailHtml,
  type TransactionalMail,
} from "@/utils/mailRenderer";
import type { MembershipRhythm } from "@core/memberships/types";

function finalizeMail(input: {
  subject: string;
  html: LegacyMailHtml;
  text: string;
  locale?: string | null;
  preheader?: string;
  reason?: string;
}): TransactionalMail {
  return renderLegacyTransactionalMail(input);
}

type VerificationTemplateInput = {
  verifyUrl: string;
  displayName?: string | null;
  locale?: string;
};

export function buildVerificationMail({ verifyUrl, displayName, locale }: VerificationTemplateInput) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "Please confirm your email address"
      : "Bitte bestätige deine E-Mail-Adresse",
    preheader: isEnglish
      ? "Confirm your email address to activate your eDebatte account."
      : "Bestätige deine E-Mail-Adresse, um dein eDebatte-Konto zu aktivieren.",
    title: isEnglish ? "Confirm your email address" : "E-Mail-Adresse bestätigen",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Please confirm your email address so that we can activate your eDebatte account."
          : "Bitte bestätige deine E-Mail-Adresse, damit wir dein eDebatte-Konto aktivieren können.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Confirm email address" : "E-Mail-Adresse bestätigen",
        url: verifyUrl,
      },
      {
        kind: "notice",
        title: isEnglish ? "Security note" : "Sicherheitshinweis",
        text: isEnglish
          ? "If you did not create an account, you can ignore this message."
          : "Falls du kein Konto angelegt hast, kannst du diese Nachricht ignorieren.",
      },
    ],
    reason: isEnglish
      ? "an email address was added to an eDebatte account."
      : "eine E-Mail-Adresse zu einem eDebatte-Konto hinzugefügt wurde.",
  });
}

type AccountWelcomeTemplateInput = {
  accountUrl: string;
  identityUrl?: string;
  displayName?: string | null;
  locale?: string | null;
};

export function buildAccountWelcomeMail({ accountUrl, identityUrl, displayName, locale }: AccountWelcomeTemplateInput) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish ? "Welcome to eDebatte" : "Herzlich willkommen bei eDebatte",
    preheader: isEnglish
      ? "Your eDebatte account is ready."
      : "Dein eDebatte-Konto ist eingerichtet.",
    title: isEnglish ? "Welcome to eDebatte" : "Willkommen bei eDebatte",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Thank you for registering. Your account is ready and you can now complete your profile."
          : "Danke für deine Registrierung. Dein Konto ist eingerichtet und du kannst jetzt dein Profil vervollständigen.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Open profile" : "Profil öffnen",
        url: accountUrl,
      },
      ...(identityUrl
        ? [
            {
              kind: "cta" as const,
              label: isEnglish
                ? "Continue identity verification"
                : "Identitätsprüfung fortsetzen",
              url: identityUrl,
            },
          ]
        : []),
    ],
    reason: isEnglish
      ? "your eDebatte account was confirmed."
      : "dein eDebatte-Konto bestätigt wurde.",
  });
}

export function buildSetPasswordMail({
  resetUrl,
  displayName,
  locale,
}: {
  resetUrl: string;
  displayName?: string | null;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "Set the password for your account"
      : "Passwort für dein Konto setzen",
    preheader: isEnglish
      ? "Use this secure link to set your eDebatte password."
      : "Setze dein eDebatte-Passwort über diesen sicheren Link.",
    title: isEnglish ? "Set your password" : "Passwort setzen",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Your account has been created. Set your password to sign in."
          : "Dein Konto wurde angelegt. Setze jetzt dein Passwort, um dich anzumelden.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Set password" : "Passwort setzen",
        url: resetUrl,
      },
      {
        kind: "notice",
        title: isEnglish ? "Security note" : "Sicherheitshinweis",
        text: isEnglish
          ? "If you did not request this access, you can ignore this message."
          : "Falls du diesen Zugang nicht angefordert hast, kannst du diese Nachricht ignorieren.",
      },
    ],
    reason: isEnglish
      ? "a password link was requested for your eDebatte account."
      : "für dein eDebatte-Konto ein Passwort-Link angefordert wurde.",
  });
}

export function buildPasswordResetMail({
  resetUrl,
  displayName,
  locale,
}: {
  resetUrl: string;
  displayName?: string | null;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish ? "Reset your eDebatte password" : "eDebatte-Passwort zurücksetzen",
    preheader: isEnglish
      ? "Use this secure link to choose a new password."
      : "Lege über diesen sicheren Link ein neues Passwort fest.",
    title: isEnglish ? "Reset password" : "Passwort zurücksetzen",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "A password reset was requested for your eDebatte account."
          : "Für dein eDebatte-Konto wurde ein neues Passwort angefordert.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Choose new password" : "Neues Passwort festlegen",
        url: resetUrl,
      },
      {
        kind: "notice",
        title: isEnglish ? "Security note" : "Sicherheitshinweis",
        text: isEnglish
          ? "The link expires after 60 minutes. If you did not request it, ignore this message."
          : "Der Link läuft nach 60 Minuten ab. Falls du ihn nicht angefordert hast, ignoriere die Nachricht.",
      },
    ],
    reason: isEnglish
      ? "a password reset was requested for your eDebatte account."
      : "für dein eDebatte-Konto das Zurücksetzen des Passworts angefordert wurde.",
  });
}

export function buildOrgInviteMail({
  resetUrl,
  orgName,
  role,
  displayName,
  expiresAt,
  locale,
}: {
  resetUrl: string;
  orgName: string;
  role: string;
  displayName?: string | null;
  expiresAt?: string | null;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish ? `Invitation to ${orgName}` : `Einladung zu ${orgName}`,
    preheader: isEnglish
      ? `You have been invited to ${orgName} on eDebatte.`
      : `Du wurdest auf eDebatte zu ${orgName} eingeladen.`,
    title: isEnglish ? "Organization invitation" : "Einladung zur Organisation",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? `You have been invited to the organization ${orgName} with the role ${role}.`
          : `Du wurdest zur Organisation ${orgName} mit der Rolle ${role} eingeladen.`,
      },
      ...(expiresAt
        ? [
            {
              kind: "details" as const,
              rows: [
                {
                  label: isEnglish ? "Valid until" : "Gültig bis",
                  value: expiresAt,
                },
              ],
            },
          ]
        : []),
      {
        kind: "cta",
        label: isEnglish ? "Accept invitation" : "Einladung annehmen",
        url: resetUrl,
      },
      {
        kind: "notice",
        text: isEnglish
          ? "If you did not expect this invitation, you can ignore this message."
          : "Falls du diese Einladung nicht erwartet hast, kannst du die Nachricht ignorieren.",
      },
    ],
    reason: isEnglish
      ? "you were invited to an organization on eDebatte."
      : "du zu einer Organisation auf eDebatte eingeladen wurdest.",
  });
}

export function buildOrgAccessMail({
  accessUrl,
  orgName,
  role,
  displayName,
  locale,
}: {
  accessUrl: string;
  orgName: string;
  role: string;
  displayName?: string | null;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish ? `Access to ${orgName}` : `Zugriff auf ${orgName}`,
    preheader: isEnglish
      ? `Your access to ${orgName} is ready.`
      : `Dein Zugriff auf ${orgName} ist eingerichtet.`,
    title: isEnglish ? "Organization access" : "Organisationszugriff",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? `You now have access to the organization ${orgName} with the role ${role}.`
          : `Du hast jetzt Zugriff auf die Organisation ${orgName} mit der Rolle ${role}.`,
      },
      {
        kind: "cta",
        label: isEnglish ? "Sign in" : "Anmelden",
        url: accessUrl,
      },
    ],
    reason: isEnglish
      ? "organization access was granted to your eDebatte account."
      : "dir Organisationszugriff auf eDebatte erteilt wurde.",
  });
}

type IdentityResumeTemplateInput = {
  resumeUrl: string;
  displayName?: string | null;
  locale?: string | null;
};

export function buildIdentityResumeMail({ resumeUrl, displayName, locale }: IdentityResumeTemplateInput) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "Continue your identity verification"
      : "Identitätsprüfung fortsetzen",
    preheader: isEnglish
      ? "Continue your identity verification securely."
      : "Setze deine Identitätsprüfung sicher fort.",
    title: isEnglish ? "Continue identity verification" : "Identitätsprüfung fortsetzen",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "You can continue your identity verification at any time."
          : "Du kannst deine Identitätsprüfung jederzeit fortsetzen.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Continue verification" : "Prüfung fortsetzen",
        url: resumeUrl,
      },
      {
        kind: "notice",
        text: isEnglish
          ? "If you are signed out, sign in first."
          : "Falls du abgemeldet bist, melde dich zuerst an.",
      },
    ],
    reason: isEnglish
      ? "you requested a link to continue your identity verification."
      : "du einen Link zum Fortsetzen deiner Identitätsprüfung angefordert hast.",
  });
}

export function buildTwoFactorCodeMail({ code, locale }: { code: string; locale?: string | null }) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish ? "Your eDebatte login code" : "Dein Login-Code für eDebatte",
    preheader: isEnglish
      ? "Use this one-time code to complete your sign-in."
      : "Verwende diesen einmaligen Code, um deine Anmeldung abzuschließen.",
    title: isEnglish ? "Complete sign-in" : "Anmeldung abschließen",
    greeting: isEnglish ? "Hello," : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Enter this code in the eDebatte sign-in window:"
          : "Gib diesen Code im eDebatte-Anmeldefenster ein:",
      },
      {
        kind: "code",
        label: isEnglish ? "One-time login code" : "Einmaliger Login-Code",
        value: code,
      },
      {
        kind: "notice",
        title: isEnglish ? "Security note" : "Sicherheitshinweis",
        text: isEnglish
          ? "The code is valid for a few minutes. If you did not start this sign-in, ignore this message."
          : "Der Code ist nur wenige Minuten gültig. Falls du diese Anmeldung nicht gestartet hast, ignoriere die Nachricht.",
      },
    ],
    reason: isEnglish
      ? "a sign-in with an email code was started for your eDebatte account."
      : "ein Login mit E-Mail-Code für dein eDebatte-Konto gestartet wurde.",
  });
}

export function buildIdentityEmailCodeMail({ code, locale }: { code: string; locale?: string | null }) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "Your identity confirmation code"
      : "Dein Code zur Identitätsbestätigung",
    preheader: isEnglish
      ? "Use this one-time code to confirm your identity."
      : "Verwende diesen einmaligen Code zur Identitätsbestätigung.",
    title: isEnglish ? "Confirm your identity" : "Identität bestätigen",
    greeting: isEnglish ? "Hello," : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Enter this code in the eDebatte verification window:"
          : "Gib diesen Code im eDebatte-Prüffenster ein:",
      },
      {
        kind: "code",
        label: isEnglish ? "One-time confirmation code" : "Einmaliger Bestätigungscode",
        value: code,
      },
      {
        kind: "notice",
        title: isEnglish ? "Security note" : "Sicherheitshinweis",
        text: isEnglish
          ? "The code is valid for a few minutes. If you did not start this step, ignore this message."
          : "Der Code ist nur wenige Minuten gültig. Falls du diesen Schritt nicht gestartet hast, ignoriere die Nachricht.",
      },
    ],
    reason: isEnglish
      ? "identity confirmation was started for your eDebatte account."
      : "eine Identitätsbestätigung für dein eDebatte-Konto gestartet wurde.",
  });
}

export function buildSupportTicketReceivedMail({
  displayName,
  category,
  requestSubject,
  locale,
}: {
  displayName?: string | null;
  category: string;
  requestSubject?: string | null;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "We received your message"
      : "Wir haben deine Nachricht erhalten",
    preheader: isEnglish
      ? "The eDebatte team will review your request."
      : "Das eDebatte-Team prüft dein Anliegen.",
    title: isEnglish ? "Message received" : "Nachricht eingegangen",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "Thank you for contacting eDebatte. Our team will review your request and get back to you."
          : "Danke für deine Nachricht an eDebatte. Unser Team prüft dein Anliegen und meldet sich bei dir.",
      },
      {
        kind: "details",
        rows: [
          { label: isEnglish ? "Category" : "Kategorie", value: category },
          ...(requestSubject
            ? [
                {
                  label: isEnglish ? "Subject" : "Betreff",
                  value: requestSubject,
                },
              ]
            : []),
        ],
      },
    ],
    reason: isEnglish
      ? "you sent a message to the eDebatte support team."
      : "du dem eDebatte-Support eine Nachricht gesendet hast.",
  });
}

export function buildSupportStatusMail({
  displayName,
  ticketReference,
  status,
  resolution,
  supportUrl,
  locale,
}: {
  displayName?: string | null;
  ticketReference: string;
  status: string;
  resolution?: string | null;
  supportUrl?: string | null;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  const isResolved = Boolean(resolution);
  return renderTransactionalMail({
    locale,
    subject: isResolved
      ? isEnglish
        ? `Your support request ${ticketReference} was resolved`
        : `Dein Support-Anliegen ${ticketReference} wurde gelöst`
      : isEnglish
        ? `Update for support request ${ticketReference}`
        : `Update zu deinem Support-Anliegen ${ticketReference}`,
    preheader: isResolved
      ? isEnglish
        ? "A resolution is available for your support request."
        : "Für dein Support-Anliegen liegt eine Lösung vor."
      : isEnglish
        ? "The status of your support request changed."
        : "Der Status deines Support-Anliegens hat sich geändert.",
    title: isResolved
      ? isEnglish
        ? "Support request resolved"
        : "Support-Anliegen gelöst"
      : isEnglish
        ? "Support status updated"
        : "Support-Status aktualisiert",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "details",
        rows: [
          { label: isEnglish ? "Reference" : "Referenz", value: ticketReference },
          { label: isEnglish ? "Status" : "Status", value: status },
        ],
      },
      ...(resolution
        ? [
            {
              kind: "notice" as const,
              title: isEnglish ? "Resolution" : "Lösung",
              text: resolution,
            },
          ]
        : []),
      ...(supportUrl
        ? [
            {
              kind: "cta" as const,
              label: isEnglish ? "Open support request" : "Support-Anliegen öffnen",
              url: supportUrl,
            },
          ]
        : []),
    ],
    reason: isEnglish
      ? "the status of your eDebatte support request changed."
      : "sich der Status deines eDebatte-Support-Anliegens geändert hat.",
  });
}

type MembershipMailInput = {
  firstName?: string | null;
  planLabel: string;
  monthlyAmount: number;
  reference: string;
  bank: BankDetails;
  locale?: string | null;
};

export function buildMembershipConfirmationMail({
  firstName,
  planLabel,
  monthlyAmount,
  reference,
  bank,
  locale,
}: MembershipMailInput) {
  const isEnglish = resolveMailLocale(locale) === "en";
  const amount = formatEuro(monthlyAmount);
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "eDebatte – Membership application received"
      : "eDebatte – Mitgliedsantrag eingegangen",
    preheader: isEnglish
      ? "We received your eDebatte membership application."
      : "Wir haben deinen eDebatte-Mitgliedsantrag erhalten.",
    title: isEnglish ? "Application received" : "Mitgliedsantrag eingegangen",
    greeting: firstName
      ? `${isEnglish ? "Hello" : "Hallo"} ${firstName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? `Thank you for applying for the eDebatte membership plan ${planLabel}.`
          : `Danke für deinen Antrag auf die eDebatte-Mitgliedschaft ${planLabel}.`,
      },
      {
        kind: "details",
        rows: [
          { label: isEnglish ? "Monthly amount" : "Monatlicher Beitrag", value: amount },
          { label: isEnglish ? "Recipient" : "Empfänger", value: bank.recipient },
          { label: isEnglish ? "Bank" : "Bank", value: bank.bankName },
          { label: "IBAN", value: bank.iban },
          { label: "BIC", value: bank.bic },
          { label: isEnglish ? "Reference" : "Verwendungszweck", value: reference },
        ],
      },
      {
        kind: "notice",
        title: isEnglish ? "Important" : "Wichtig",
        text: isEnglish
          ? "This is a membership contribution, not a donation, and no donation receipt is issued."
          : "Dies ist ein Mitgliedsbeitrag, keine Spende; eine Spendenquittung wird nicht ausgestellt.",
      },
      {
        kind: "paragraph",
        text: isEnglish
          ? "You will receive confirmation once the first contribution has been received."
          : "Sobald der erste Beitrag eingegangen ist, erhältst du die Bestätigung deiner Mitgliedschaft.",
      },
    ],
    reason: isEnglish
      ? "your eDebatte membership application was received."
      : "dein Mitgliedsantrag bei eDebatte eingegangen ist.",
  });
}

export function buildMembershipActivationMail({
  displayName,
  accountUrl,
  locale,
}: {
  displayName?: string | null;
  accountUrl: string;
  locale?: string | null;
}) {
  const isEnglish = resolveMailLocale(locale) === "en";
  return renderTransactionalMail({
    locale,
    subject: isEnglish
      ? "Your eDebatte membership is active"
      : "Deine eDebatte-Mitgliedschaft ist aktiv",
    preheader: isEnglish
      ? "Your membership contribution was received."
      : "Dein Mitgliedsbeitrag ist eingegangen.",
    title: isEnglish ? "Membership activated" : "Mitgliedschaft aktiviert",
    greeting: displayName
      ? `${isEnglish ? "Hello" : "Hallo"} ${displayName},`
      : isEnglish
        ? "Hello,"
        : "Hallo,",
    blocks: [
      {
        kind: "paragraph",
        text: isEnglish
          ? "We received your first contribution and activated your eDebatte membership."
          : "Wir haben deinen ersten Beitrag erhalten und deine eDebatte-Mitgliedschaft aktiviert.",
      },
      {
        kind: "cta",
        label: isEnglish ? "Open account" : "Konto öffnen",
        url: accountUrl,
      },
    ],
    reason: isEnglish
      ? "your first membership contribution was received."
      : "dein erster Mitgliedsbeitrag eingegangen ist.",
  });
}

function formatEuro(value: number) {
  return new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(value);
}

function formatIban(value?: string | null) {
  if (!value) return "n/a";
  const cleaned = value.replace(/\s+/g, "").toUpperCase();
  return cleaned.match(/.{1,4}/g)?.join(" ") ?? cleaned;
}

type EdebatePreorderMailInput = {
  displayName?: string | null;
  planLabel: string;
  monthlyPrice?: number | null;
  accountUrl?: string;
  locale?: string;
};

const EURO_EDEB = new Intl.NumberFormat("de-DE", {
  style: "currency",
  currency: "EUR",
  minimumFractionDigits: 2,
});

function formatEuroEdeb(amount: number) {
  return EURO_EDEB.format(amount);
}

function formatIbanEdeb(iban: string) {
  return iban.replace(/\s+/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export function buildEdebatePreorderMail({
  displayName,
  planLabel,
  monthlyPrice,
  accountUrl,
  locale,
}: EdebatePreorderMailInput) {
  const isEnglish = typeof locale === "string" && locale.toLowerCase().startsWith("en");
  const greeting = displayName
    ? isEnglish
      ? `Hello ${displayName}`
      : `Hallo ${displayName}`
    : isEnglish
      ? "Hello"
      : "Hallo";
  const amount =
    typeof monthlyPrice === "number"
      ? monthlyPrice === 0
        ? isEnglish
          ? "Free"
          : "Kostenfrei"
        : formatEuroEdeb(monthlyPrice)
      : isEnglish
        ? "Price follows"
        : "Preis folgt";

  const accountBlock = accountUrl
    ? legacyMailHtml`<p style="margin:12px 0 0 0;">
        <a href="${accountUrl}" style="display:inline-flex;padding:10px 16px;border-radius:999px;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:12px;">${isEnglish ? "Open account" : "Zum Konto"}</a>
      </p>`
    : null;

  const html = legacyMailHtml`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family: system-ui, -apple-system, Segoe UI, sans-serif; color:#0f172a; background:#f8fafc; padding:24px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:20px 24px;background:#0f172a;">
                <div style="font-size:11px;letter-spacing:0.3em;text-transform:uppercase;color:#94a3b8;">eDebatte</div>
                <div style="margin-top:6px;font-size:22px;font-weight:700;color:#ffffff;">${isEnglish ? "Package start confirmed" : "Paketstart bestätigt"}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px;">
                <p style="margin:0 0 10px 0;font-size:15px;">${greeting},</p>
                <p style="margin:0 0 14px 0;font-size:14px;line-height:1.6;color:#334155;">
                  ${
                    isEnglish
                      ? "thank you, your package order was received. Here is your summary:"
                      : "danke, dein Paketstart ist eingegangen. Hier die Zusammenfassung:"
                  }
                </p>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                  <tr>
                    <td style="padding:14px;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">${isEnglish ? "Package" : "Paket"}</td>
                          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;color:#0f172a;">${planLabel}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">${isEnglish ? "Price" : "Preis"}</td>
                          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;color:#0f172a;">${amount}${typeof monthlyPrice === "number" && monthlyPrice > 0 ? isEnglish ? " / month" : " / Monat" : ""}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <p style="margin:14px 0 0 0;font-size:12px;color:#64748b;line-height:1.6;">
                  ${
                    isEnglish
                      ? "Next, we coordinate activation, roles and onboarding to match your operating context."
                      : "Als Nächstes stimmen wir Freischaltung, Rollen und Einführung passend zum Nutzungskontext ab."
                  }
                </p>

                ${accountBlock}
                <p style="margin:14px 0 0 0;font-size:13px;color:#0f172a;font-weight:600;">${
                  isEnglish ? "– Your eDebatte team" : "– Dein eDebatte Team"
                }</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `${greeting},

${isEnglish ? "thank you, your package order was received." : "danke, dein Paketstart ist eingegangen."}

${isEnglish ? "Package" : "Paket"}: ${planLabel}
${isEnglish ? "Price" : "Preis"}: ${amount}${typeof monthlyPrice === "number" && monthlyPrice > 0 ? isEnglish ? " / month" : " / Monat" : ""}

${isEnglish
    ? "Next, we coordinate activation, roles and onboarding to match your operating context."
    : "Als Nächstes stimmen wir Freischaltung, Rollen und Einführung passend zum Nutzungskontext ab."}

${accountUrl ? `${isEnglish ? "Open account" : "Zum Konto"}: ${accountUrl}` : ""}

${isEnglish ? "– Your eDebatte team" : "– Dein eDebatte Team"}`;

  return finalizeMail({
    subject: isEnglish
      ? "eDebatte – Package start confirmed"
      : "eDebatte – Paketstart bestätigt",
    html,
    text,
    locale,
    reason: isEnglish
      ? "your requested eDebatte package start was recorded."
      : "dein angefragter eDebatte-Paketstart erfasst wurde.",
  });
}

export function buildEdebatePreorderPledgeUserMail(args: {
  displayName?: string | null;
  planLabel: string;
  amount: number;
  reference: string;
  bank: {
    recipient: string;
    iban: string;
    bic?: string | null;
    bankName?: string | null;
    accountMode?: string | null;
  };
  locale?: string | null;
}) {
  if (resolveMailLocale(args.locale) === "en") {
    const amount = formatEuro(args.amount);
    return renderTransactionalMail({
      locale: args.locale,
      subject: `Payment pledge: ${args.planLabel}`,
      preheader: "We recorded your eDebatte payment pledge.",
      title: "Payment pledge recorded",
      greeting: args.displayName ? `Hello ${args.displayName},` : "Hello,",
      blocks: [
        {
          kind: "paragraph",
          text: `Thank you for your payment pledge for ${args.planLabel}. Please transfer ${amount} once using the reference below.`,
        },
        {
          kind: "details",
          rows: [
            { label: "Reference", value: args.reference },
            { label: "Recipient", value: args.bank.recipient },
            { label: "Bank", value: args.bank.bankName || "not available" },
            { label: "IBAN", value: formatIban(args.bank.iban) },
            ...(args.bank.bic ? [{ label: "BIC", value: args.bank.bic }] : []),
          ],
        },
        {
          kind: "notice",
          text: "Membership contributions remain separate from this one-time payment pledge.",
        },
      ],
      reason: "your payment pledge for an eDebatte package was recorded.",
    });
  }

  const greeting = args.displayName ? `Hallo ${args.displayName},` : "Hallo,";
  const amount = formatEuro(args.amount);
  const bankIban = formatIban(args.bank.iban);
  const bankBic = args.bank.bic ?? "";
  const bankName = args.bank.bankName ?? "";
  const accountMode = args.bank.accountMode ?? "private_preUG";
  const accountNote =
    accountMode === "private_preUG"
      ? "Hinweis: Aufbauphase (Privatkonto), keine Spendenquittung."
      : "Hinweis: Geschäftskonto nach Gründung.";

  const html = legacyMailHtml`
    <p>${greeting}</p>
    <p>danke für deine Zahlungszusage für <strong>${args.planLabel}</strong>.</p>
    <p>Bitte überweise den Betrag <strong>${amount}</strong> einmalig mit folgendem Verwendungszweck:</p>
    <p><strong>${args.reference}</strong></p>
    <p>Bankverbindung:</p>
    <ul>
      <li><strong>Empfänger:</strong> ${args.bank.recipient}</li>
      <li><strong>Bank:</strong> ${bankName || "n/a"}</li>
      <li><strong>IBAN:</strong> ${bankIban}</li>
      ${
        bankBic
          ? legacyMailHtml`<li><strong>BIC:</strong> ${bankBic}</li>`
          : null
      }
    </ul>
    <p>${accountNote}</p>
    <p>Mitgliedschaftsbeiträge bleiben von dieser einmaligen Zahlungszusage getrennt.</p>
    <p>– Dein eDebatte Team</p>
  `;

  const text = `${greeting}

danke für deine Zahlungszusage für ${args.planLabel}.
Bitte überweise den Betrag ${amount} einmalig mit dem Verwendungszweck:
${args.reference}

Bankverbindung:
Empfänger: ${args.bank.recipient}
Bank: ${bankName || "n/a"}
IBAN: ${bankIban}
${bankBic ? `BIC: ${bankBic}` : ""}

${accountNote}
Mitgliedschaftsbeiträge bleiben von dieser einmaligen Zahlungszusage getrennt.

– Dein eDebatte Team`;

  return finalizeMail({
    subject: `Zahlungszusage: ${args.planLabel}`,
    html,
    text,
    locale: args.locale,
    reason: "deine Zahlungszusage für ein eDebatte-Paket erfasst wurde.",
  });
}

export function buildEdebatePreorderPledgeAdminMail(args: {
  displayName?: string | null;
  email: string;
  userId: string;
  planLabel: string;
  amount: number;
  reference: string;
  bank: {
    recipient: string;
    iban: string;
    bic?: string | null;
    bankName?: string | null;
    accountMode?: string | null;
  };
  locale?: string | null;
}) {
  if (resolveMailLocale(args.locale) === "en") {
    return renderTransactionalMail({
      locale: args.locale,
      subject: `Payment pledge confirmed: ${args.planLabel}`,
      preheader: "A payment pledge was recorded in eDebatte.",
      title: "New payment pledge",
      blocks: [
        {
          kind: "details",
          rows: [
            { label: "User", value: `${args.displayName || "—"} (${args.email})` },
            { label: "User ID", value: args.userId },
            { label: "Package", value: args.planLabel },
            { label: "Amount", value: formatEuro(args.amount) },
            { label: "Reference", value: args.reference },
          ],
        },
      ],
      reason: "a payment pledge was recorded in the eDebatte system.",
    });
  }

  const amount = formatEuro(args.amount);
  const bankIban = formatIban(args.bank.iban);
  const bankBic = args.bank.bic ?? "";
  const bankName = args.bank.bankName ?? "";

  const html = legacyMailHtml`
    <p>Neue Zahlungszusage (eDebatte)</p>
    <ul>
      <li><strong>User:</strong> ${args.displayName || "–"} (${args.email})</li>
      <li><strong>User-ID:</strong> ${args.userId}</li>
      <li><strong>Paket:</strong> ${args.planLabel}</li>
      <li><strong>Betrag:</strong> ${amount}</li>
      <li><strong>Verwendungszweck:</strong> ${args.reference}</li>
    </ul>
    <p>Bankverbindung (zur Orientierung):</p>
    <ul>
      <li><strong>Empfänger:</strong> ${args.bank.recipient}</li>
      <li><strong>Bank:</strong> ${bankName || "n/a"}</li>
      <li><strong>IBAN:</strong> ${bankIban}</li>
      ${
        bankBic
          ? legacyMailHtml`<li><strong>BIC:</strong> ${bankBic}</li>`
          : null
      }
    </ul>
  `;

  const text = `Neue Zahlungszusage (eDebatte)

User: ${args.displayName || "–"} (${args.email})
User-ID: ${args.userId}
Paket: ${args.planLabel}
Betrag: ${amount}
Verwendungszweck: ${args.reference}

Bankverbindung (zur Orientierung):
Empfänger: ${args.bank.recipient}
Bank: ${bankName || "n/a"}
IBAN: ${bankIban}
${bankBic ? `BIC: ${bankBic}` : ""}`;

  return finalizeMail({
    subject: `Zahlungszusage bestätigt: ${args.planLabel}`,
    html,
    text,
    locale: args.locale,
    reason: "eine Zahlungszusage im eDebatte-System erfasst wurde.",
  });
}

export function buildMembershipApplyUserMail(args: {
  displayName: string;
  amountPerPeriod: number;
  rhythm: MembershipRhythm;
  householdSize: number;
  membershipId: string;
  accountUrl?: string;
  profileUrl?: string;
  bankDetails?: {
    recipient: string;
    iban: string;
    bic?: string | null;
    bankName?: string | null;
    accountMode?: string | null;
  };
  edebatte?: {
    enabled: boolean;
    planKey?: string;
    finalPricePerMonth?: number;
    billingMode?: "monthly" | "yearly";
    discountPercent?: number;
  };
  paymentMethod?: "sepa" | "bank_transfer" | "paypal" | "other";
  paymentReference?: string;
  paymentInfo?: {
    bankRecipient?: string;
    bankIban?: string;
    bankIbanMasked?: string;
    bankBic?: string | null;
    bankName?: string | null;
    accountMode?: string | null;
    mandateStatus?: string | null;
  };
  locale?: string | null;
}) {
  if (resolveMailLocale(args.locale) === "en") {
    const bankRecipient =
      args.bankDetails?.recipient ??
      args.paymentInfo?.bankRecipient ??
      "eDebatte";
    const bankIban =
      args.bankDetails?.iban ??
      args.paymentInfo?.bankIban ??
      args.paymentInfo?.bankIbanMasked ??
      "IBAN pending";
    const bankBic = args.bankDetails?.bic ?? args.paymentInfo?.bankBic ?? "";
    const bankName = args.bankDetails?.bankName ?? args.paymentInfo?.bankName ?? "";
    const rhythmLabel =
      args.rhythm === "monthly"
        ? "monthly"
        : args.rhythm === "yearly"
          ? "yearly"
          : "one-time";
    return renderTransactionalMail({
      locale: args.locale,
      subject: "Your eDebatte membership application",
      preheader: "We received your eDebatte membership application.",
      title: "Membership application received",
      greeting: `Hello ${args.displayName || "member"},`,
      blocks: [
        {
          kind: "paragraph",
          text: "We received your application. Here are the key details.",
        },
        {
          kind: "details",
          rows: [
            {
              label: "Contribution",
              value: `${formatEuro(args.amountPerPeriod)} (${rhythmLabel})`,
            },
            { label: "Household", value: `${args.householdSize} person(s)` },
            { label: "Application ID", value: args.membershipId },
            { label: "Recipient", value: bankRecipient },
            { label: "Bank", value: bankName || "not available" },
            { label: "IBAN", value: bankIban },
            ...(bankBic ? [{ label: "BIC", value: bankBic }] : []),
            {
              label: "Reference",
              value: args.paymentReference ?? "Membership contribution",
            },
          ],
        },
        ...(args.paymentInfo?.mandateStatus === "pending_microtransfer"
          ? [
              {
                kind: "notice" as const,
                title: "Account verification",
                text: "We will transfer EUR 0.01 with a confirmation code in the payment reference. Enter that code in your payment profile.",
              },
            ]
          : []),
        ...(args.accountUrl
          ? [
              {
                kind: "cta" as const,
                label: "Open payment profile",
                url: args.accountUrl,
              },
            ]
          : []),
        {
          kind: "notice",
          title: "Transparency",
          text: "Membership contributions are not donations and no donation receipt is issued. Your membership becomes active after the first contribution is received.",
        },
      ],
      reason: "your eDebatte membership application was received.",
    });
  }

  const {
    displayName,
    amountPerPeriod,
    rhythm,
    householdSize,
    membershipId,
    accountUrl,
    profileUrl,
    bankDetails,
    edebatte,
    paymentReference,
    paymentInfo,
  } = args;
  const subject = "Dein Mitgliedsantrag bei eDebatte";
  const greeting = `Hallo ${displayName || "Mitglied"}`;
  const rhythmLabel =
    rhythm === "monthly" ? "monatlich" : rhythm === "yearly" ? "jährlich" : "einmalig";
  const amount = formatEuro(amountPerPeriod);
  const bankRecipient = bankDetails?.recipient ?? paymentInfo?.bankRecipient ?? "eDebatte";
  const bankIban =
    bankDetails?.iban ??
    paymentInfo?.bankIban ??
    paymentInfo?.bankIbanMasked ??
    "IBAN folgt";
  const bankBic = bankDetails?.bic ?? paymentInfo?.bankBic ?? "";
  const bankName = bankDetails?.bankName ?? paymentInfo?.bankName ?? "";
  const accountMode = bankDetails?.accountMode ?? paymentInfo?.accountMode ?? "private_preUG";
  const showMicroTransfer = paymentInfo?.mandateStatus === "pending_microtransfer";
  const shareUrl = profileUrl?.trim() || "";
  const shareText = "Ich bin jetzt Mitglied bei eDebatte.";
  const encodedShareUrl = shareUrl ? encodeURIComponent(shareUrl) : "";
  const encodedShareText = encodeURIComponent(shareText);
  const shareLinks = shareUrl
    ? {
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedShareUrl}`,
        x: `https://x.com/intent/post?url=${encodedShareUrl}&text=${encodedShareText}`,
        reddit: `https://www.reddit.com/submit?url=${encodedShareUrl}&title=${encodedShareText}`,
        instagram: shareUrl,
        tiktok: shareUrl,
      }
    : null;
  const iconStyle =
    "display:inline-block;width:28px;height:28px;border-radius:999px;background:#0f172a;color:#ffffff;font-size:11px;font-weight:700;line-height:28px;text-align:center;text-decoration:none;";
  const socialLink = (label: string, text: string, href: string, isLast = false) =>
    legacyMailHtml`
      <td style="padding-right:${isLast ? "0" : "8px"};">
        <a href="${href}" style="${iconStyle}" aria-label="${label}" target="_blank" rel="noopener noreferrer">${text}</a>
      </td>`;
  const shareIcons = shareLinks
    ? legacyMailHtml`
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr>
          ${socialLink("LinkedIn", "IN", shareLinks.linkedin)}
          ${socialLink("TikTok", "TT", shareLinks.tiktok)}
          ${socialLink("Instagram", "IG", shareLinks.instagram)}
          ${socialLink("X", "X", shareLinks.x)}
          ${socialLink("Reddit", "RD", shareLinks.reddit, true)}
        </tr>
      </table>
    `
    : null;

  const hasEdebate = Boolean(edebatte?.enabled && edebatte.finalPricePerMonth);
  const edebatteDiscount = edebatte?.discountPercent ? ` (inkl. ${edebatte.discountPercent}% eDebatte-Rabatt)` : "";
  const edebatteLine = hasEdebate
    ? `${edebatte?.planKey || "unbekannt"} ${formatEuro(edebatte?.finalPricePerMonth || 0)} ${
        edebatte?.billingMode || "monatlich"
      }${edebatteDiscount}`
    : "";
  const edebatteRow = hasEdebate
    ? legacyMailHtml`
        <tr>
          <td style="padding:6px 0;font-size:12px;color:#64748b;">eDebatte</td>
          <td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;color:#0f172a;">${edebatteLine}</td>
        </tr>
      `
    : null;
  const edebatteNote = hasEdebate
    ? legacyMailHtml`
      <p style="margin:12px 0 0 0;font-size:12px;line-height:1.6;color:#64748b;">
        Während der Pilotphase ist das eine unverbindliche Vormerkung; die konkrete Buchung klären wir separat.
      </p>
    `
    : null;
  const accountPaymentLink = accountUrl
    ? legacyMailHtml`<p style="margin:12px 0 0 0;">
        <a href="${accountUrl}" style="display:inline-block;padding:10px 16px;border-radius:999px;background:#0ea5e9;color:#ffffff;text-decoration:none;font-weight:700;font-size:12px;">Zahlungsprofil öffnen</a>
      </p>`
    : null;
  const microTransferBlock = showMicroTransfer
    ? legacyMailHtml`
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;border:1px solid #bae6fd;background:#ecfeff;border-radius:16px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 6px 0;font-size:14px;font-weight:600;color:#0f172a;">Konto-Verifikation</p>
            <p style="margin:0;font-size:13px;line-height:1.6;color:#0f172a;">
              Wir überweisen dir in den nächsten Tagen 0,01 EUR mit einem TAN-Code im Verwendungszweck. Bitte gib den Code im Zahlungsprofil ein.
            </p>
            ${accountPaymentLink}
          </td>
        </tr>
      </table>
    `
    : null;
  const profileBlock = shareLinks
    ? legacyMailHtml`
      <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:18px;border:1px dashed #e2e8f0;border-radius:16px;">
        <tr>
          <td style="padding:16px;">
            <p style="margin:0 0 6px 0;font-size:14px;font-weight:600;color:#0f172a;">Dein Profil-Link (optional)</p>
            <p style="margin:0 0 10px 0;font-size:13px;line-height:1.6;color:#475569;">
              Wenn du möchtest, kannst du dein Profil teilen.
            </p>
            <p style="margin:0 0 12px 0;font-size:13px;">
              <a href="${shareUrl}" style="color:#0ea5e9;text-decoration:none;font-weight:600;">${shareUrl}</a>
            </p>
            ${shareIcons}
            <p style="margin:10px 0 0 0;font-size:11px;color:#94a3b8;">
              Tipp: Für Instagram/TikTok einfach den Link kopieren und posten.
            </p>
          </td>
        </tr>
      </table>
    `
    : null;
  const bankBicRow = bankBic
    ? legacyMailHtml`<tr>
        <td style="padding:6px 0;font-size:12px;color:#64748b;">BIC</td>
        <td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;color:#0f172a;">${bankBic}</td>
      </tr>`
    : null;

  const html = legacyMailHtml`
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="font-family:'Inter',system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;color:#0f172a;">
      <tr>
        <td align="center" style="padding:24px 12px;">
          <table width="600" cellpadding="0" cellspacing="0" role="presentation" style="width:100%;max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:20px;overflow:hidden;">
            <tr>
              <td style="padding:22px 24px;background:#0f172a;">
                <div style="font-size:11px;letter-spacing:0.36em;text-transform:uppercase;color:#94a3b8;">eDebatte</div>
                <div style="margin-top:6px;font-size:24px;font-weight:700;color:#ffffff;">Mitgliedsantrag eingegangen</div>
                <div style="margin-top:6px;font-size:13px;color:#cbd5f5;">Danke, dass du die Bewegung möglich machst.</div>
              </td>
            </tr>
            <tr>
              <td style="padding:22px 24px;">
                <p style="margin:0 0 10px 0;font-size:16px;font-weight:600;color:#0f172a;">${greeting},</p>
                <p style="margin:0 0 18px 0;font-size:14px;line-height:1.6;color:#475569;">
                  wir haben deinen Mitgliedsantrag erhalten. Die wichtigsten Daten auf einen Blick:
                </p>
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:16px;">
                  <tr>
                    <td style="padding:16px;">
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">Betrag</td>
                          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;color:#0f172a;">${amount} (${rhythmLabel})</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">Haushalt</td>
                          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;color:#0f172a;">${householdSize} Person(en)</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">Antrags-ID</td>
                          <td style="padding:6px 0;font-size:12px;font-weight:600;text-align:right;color:#0f172a;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">
                            ${membershipId}
                          </td>
                        </tr>
                        ${edebatteRow}
                      </table>
                      ${edebatteNote}
                    </td>
                  </tr>
                </table>

                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:16px;border:1px solid #e2e8f0;border-radius:16px;">
                  <tr>
                    <td style="padding:16px;">
                      <p style="margin:0 0 8px 0;font-size:14px;font-weight:600;color:#0f172a;">Zahlungsinfo</p>
                      <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">Empfänger</td>
                          <td style="padding:6px 0;font-size:14px;font-weight:600;text-align:right;color:#0f172a;">${bankRecipient}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">Bank</td>
                          <td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;color:#0f172a;">${bankName || "n/a"}</td>
                        </tr>
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">IBAN</td>
                          <td style="padding:6px 0;font-size:13px;font-weight:600;text-align:right;color:#0f172a;">${bankIban}</td>
                        </tr>
                        ${bankBicRow}
                        <tr>
                          <td style="padding:6px 0;font-size:12px;color:#64748b;">Verwendungszweck</td>
                          <td style="padding:6px 0;font-size:13px;font-weight:700;text-align:right;color:#0f172a;">${paymentReference ?? "Mitgliedsbeitrag"}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                ${microTransferBlock}

                <p style="margin:18px 0 8px 0;font-size:14px;font-weight:600;color:#0f172a;">Transparenz</p>
                <ul style="margin:0;padding-left:18px;font-size:13px;line-height:1.6;color:#475569;">
                  <li>eDebatte befindet sich in der Gründungsphase (${accountMode === "private_preUG" ? "Privatkonto Aufbauphase" : "Org-Konto nach Gründung"}).</li>
                  <li>Mitgliedsbeiträge sind Gutschriften für die Bewegung – keine Spendenquittung, üblicherweise nicht absetzbar.</li>
                  <li>Die Mitgliedschaft bezieht sich auf eDebatte, nicht nur auf die eDebatte-App.</li>
                  <li>Wir folgen "eine Person, eine Stimme" – daher brauchen wir klare Zuordnung und Double-Opt-In.</li>
                </ul>
                ${profileBlock}
                <p style="margin:18px 0 0 0;font-size:13px;line-height:1.6;color:#475569;">
                  Du kannst eDebatte direkt im Free-Modus nutzen. Sobald dein Beitrag eingegangen ist, bestätigen wir deine Mitgliedschaft.
                </p>
                <p style="margin:14px 0 0 0;font-size:14px;font-weight:600;color:#0f172a;">Danke für deine Unterstützung!</p>
                <p style="margin:10px 0 0 0;font-size:13px;color:#0f172a;font-weight:600;">– Dein eDebatte Team</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  `;

  const text = `${greeting},

wir haben deinen Mitgliedsantrag erhalten. Details:
- Betrag: ${amount} (${rhythmLabel})
- Haushalt: ${householdSize} Person(en)
- Antrags-ID: ${membershipId}
${hasEdebate ? `- eDebatte: ${edebatteLine}` : ""}

Zahlung:
Bitte Dauer-/Einzelüberweisung einrichten.
Empfänger: ${bankRecipient}
Bank: ${bankName || "n/a"}
IBAN: ${bankIban}
${bankBic ? `BIC: ${bankBic}` : ""}
Verwendungszweck: ${paymentReference ?? "Mitgliedsbeitrag"}
${
  showMicroTransfer
    ? `\nKonto-Verifikation:\nWir überweisen dir in den nächsten Tagen 0,01 EUR mit einem TAN-Code im Verwendungszweck. Bitte gib den Code im Zahlungsprofil ein${accountUrl ? `: ${accountUrl}` : "."}`
    : ""
}

Transparenz:
- Aufbauphase (${accountMode === "private_preUG" ? "Privatkonto" : "Org-Konto"}), keine Spendenquittung, i.d.R. nicht absetzbar.
- Mitgliedschaft bezieht sich auf eDebatte, nicht nur eDebatte.
- Eine Person, eine Stimme – daher Double-Opt-In.

${shareLinks ? `\nProfil-Link (optional): ${shareUrl}\nLinkedIn: ${shareLinks.linkedin}\nX: ${shareLinks.x}\nReddit: ${shareLinks.reddit}\nInstagram/TikTok: Link kopieren und posten.` : ""}

Du kannst eDebatte im Free-Modus nutzen. Sobald dein Beitrag eingeht, bestätigen wir deine Mitgliedschaft.

Danke für deine Unterstützung!
– Dein eDebatte Team`;

  return finalizeMail({
    subject,
    html,
    text,
    locale: args.locale,
    reason: "dein Mitgliedsantrag bei eDebatte eingegangen ist.",
  });
}

export function buildMembershipApplyAdminMail(args: {
  membershipId: string;
  userId: string;
  email: string;
  amountPerPeriod: number;
  rhythm: string;
  householdSize: number;
  paymentMethod?: string;
  paymentReference?: string;
  payerName?: string;
  payerIban?: string;
  microTransferCode?: string;
  locale?: string | null;
}) {
  if (resolveMailLocale(args.locale) === "en") {
    return renderTransactionalMail({
      locale: args.locale,
      subject: "New membership application",
      preheader: "A membership application was submitted in eDebatte.",
      title: "New membership application",
      blocks: [
        {
          kind: "details",
          rows: [
            { label: "Application ID", value: args.membershipId },
            { label: "User ID", value: args.userId },
            { label: "Email", value: args.email },
            {
              label: "Contribution",
              value: `${formatEuro(args.amountPerPeriod)} (${args.rhythm})`,
            },
            { label: "Household", value: String(args.householdSize) },
            ...(args.paymentMethod
              ? [{ label: "Payment method", value: args.paymentMethod }]
              : []),
            ...(args.paymentReference
              ? [{ label: "Reference", value: args.paymentReference }]
              : []),
          ],
        },
      ],
      reason: "a membership application was submitted in the eDebatte system.",
    });
  }

  const subject = "Neuer Mitgliedsantrag";
  const payerIban = formatIban(args.payerIban);
  const optionalRows = [
    args.paymentMethod
      ? legacyMailHtml`<li>Zahlungsweg: ${args.paymentMethod}</li>`
      : null,
    args.paymentReference
      ? legacyMailHtml`<li>Verwendungszweck: ${args.paymentReference}</li>`
      : null,
    args.payerName
      ? legacyMailHtml`<li>Zahlungsname: ${args.payerName}</li>`
      : null,
    args.payerIban
      ? legacyMailHtml`<li>IBAN (für 0,01 €): ${payerIban}</li>`
      : null,
    args.microTransferCode
      ? legacyMailHtml`<li>TAN-Code (0,01 €): ${args.microTransferCode}</li>`
      : null,
  ];
  const html = legacyMailHtml`
    <p>Neuer Antrag eingegangen:</p>
    <ul>
      <li>ID: ${args.membershipId}</li>
      <li>User: ${args.userId}</li>
      <li>E-Mail: ${args.email}</li>
      <li>Betrag: ${formatEuro(args.amountPerPeriod)} (${args.rhythm})</li>
      <li>Haushalt: ${args.householdSize}</li>
      ${optionalRows}
    </ul>
  `;
  const text = `Neuer Antrag:
- ID: ${args.membershipId}
- User: ${args.userId}
- E-Mail: ${args.email}
- Betrag: ${formatEuro(args.amountPerPeriod)} (${args.rhythm})
- Haushalt: ${args.householdSize}
${args.paymentMethod ? `- Zahlungsweg: ${args.paymentMethod}` : ""}
${args.paymentReference ? `- Verwendungszweck: ${args.paymentReference}` : ""}
${args.payerName ? `- Zahlungsname: ${args.payerName}` : ""}
${args.payerIban ? `- IBAN (für 0,01 €): ${payerIban}` : ""}
${args.microTransferCode ? `- TAN-Code (0,01 €): ${args.microTransferCode}` : ""}`;
  return finalizeMail({
    subject,
    html,
    text,
    locale: args.locale,
    reason: "ein Mitgliedsantrag im eDebatte-System eingegangen ist.",
  });
}

export function buildHouseholdInviteMail(args: {
  targetName?: string | null;
  inviteUrl: string;
  inviterName: string;
  locale?: string | null;
}) {
  if (resolveMailLocale(args.locale) === "en") {
    return renderTransactionalMail({
      locale: args.locale,
      subject: "Invitation to join eDebatte",
      preheader: `${args.inviterName} invited you to join eDebatte as part of a household.`,
      title: "Household invitation",
      greeting: args.targetName ? `Hello ${args.targetName},` : "Hello,",
      blocks: [
        {
          kind: "paragraph",
          text: `${args.inviterName} invited you to participate in eDebatte as part of a household.`,
        },
        {
          kind: "cta",
          label: "Accept invitation",
          url: args.inviteUrl,
        },
        {
          kind: "notice",
          text: "The invitation gives you your own access after double opt-in. Each person has one vote.",
        },
      ],
      reason: "you were invited to a household on eDebatte.",
    });
  }

  const subject = "Einladung zur Teilnahme bei eDebatte";
  const greeting = args.targetName ? `Hallo ${args.targetName},` : "Hallo,";
  const html = legacyMailHtml`
    <p>${greeting}</p>
    <p>${args.inviterName} hat dich eingeladen, im Rahmen eines Haushalts an eDebatte teilzunehmen.</p>
    <p>
      <a href="${args.inviteUrl}" style="display:inline-flex;padding:10px 16px;border-radius:999px;background:#0ea5e9;color:#fff;text-decoration:none;font-weight:600;">Einladung annehmen</a>
    </p>
    <p>Mit der Einladung erhältst du später eigenen Zugang (Double-Opt-In, eine Person – eine Stimme).</p>
    <p>Danke für dein Interesse an einer offenen, direkten Demokratie.</p>
  `;
  const text = `${greeting}

${args.inviterName} hat dich eingeladen, im Rahmen eines Haushalts an eDebatte teilzunehmen.
Einladung annehmen: ${args.inviteUrl}

Die Einladung ermöglicht dir eigenen Zugang (Double-Opt-In, eine Person – eine Stimme).

Danke für dein Interesse!`;

  return finalizeMail({
    subject,
    html,
    text,
    locale: args.locale,
    reason: "du zu einem Haushalt auf eDebatte eingeladen wurdest.",
  });
}

export function buildMembershipReminderMail(
  level: 1 | 2 | 3,
  args: {
    displayName: string;
    amountPerPeriod: number;
    rhythm: MembershipRhythm;
    householdSize: number;
    paymentInfo?: {
      bankRecipient?: string;
      bankIban?: string;
      bankIbanMasked?: string;
      bankBic?: string | null;
      bankName?: string | null;
      reference?: string;
    };
    reference: string;
    locale?: string | null;
  },
) {
  if (resolveMailLocale(args.locale) === "en") {
    const subject =
      level === 3
        ? "Final reminder – eDebatte membership application"
        : "Reminder – eDebatte membership contribution";
    const intro =
      level === 1
        ? "We have not yet recorded your payment."
        : level === 2
          ? "Please check your membership contribution; no payment has been recorded yet."
          : "We have not been able to match a payment. The application will be cancelled if no payment is received.";
    return renderTransactionalMail({
      locale: args.locale,
      subject,
      preheader: intro,
      title: "Membership contribution reminder",
      greeting: `Hello ${args.displayName},`,
      blocks: [
        { kind: "paragraph", text: intro },
        {
          kind: "details",
          rows: [
            { label: "Contribution", value: formatEuro(args.amountPerPeriod) },
            { label: "Household", value: String(args.householdSize) },
            {
              label: "Recipient",
              value: args.paymentInfo?.bankRecipient ?? "eDebatte",
            },
            {
              label: "Bank",
              value: args.paymentInfo?.bankName ?? "not available",
            },
            {
              label: "IBAN",
              value:
                args.paymentInfo?.bankIban ??
                args.paymentInfo?.bankIbanMasked ??
                "IBAN pending",
            },
            { label: "Reference", value: args.reference },
          ],
        },
        {
          kind: "notice",
          text:
            level === 3
              ? "If no payment is received, the application will be cancelled. You can apply again later."
              : "Use the reference exactly as shown so that we can match the payment.",
        },
      ],
      reason: "we could not yet match a payment to your membership application.",
    });
  }

  const subject =
    level === 3
      ? "Letzte Erinnerung – eDebatte-Mitgliedsantrag"
      : "Erinnerung – eDebatte-Mitgliedsbeitrag";
  const amount = formatEuro(args.amountPerPeriod);
  const rhythmLabel =
    args.rhythm === "once" ? "einmalig" : args.rhythm === "yearly" ? "jährlich" : "monatlich";
  const bankRecipient = args.paymentInfo?.bankRecipient ?? "eDebatte";
  const bankIban =
    args.paymentInfo?.bankIban ??
    args.paymentInfo?.bankIbanMasked ??
    "IBAN folgt";
  const bankBic = args.paymentInfo?.bankBic ?? "";
  const bankName = args.paymentInfo?.bankName ?? "";

  const intro =
    level === 1
      ? "wir haben noch keinen Zahlungseingang gesehen."
      : level === 2
        ? "bitte prüfe deinen Mitgliedsbeitrag – uns liegt noch keine Zahlung vor."
        : "wir konnten bisher keinen Zahlungseingang zuordnen. Der Antrag wird storniert, wenn keine Zahlung erfolgt.";
  const bankBicLine = bankBic
    ? legacyMailHtml`BIC: ${bankBic}<br/>`
    : null;
  const finalReminderNotice =
    level === 3
      ? legacyMailHtml`<p>Hinweis: Wenn keine Zahlung eingeht, wird der Antrag storniert und der Haushalt gesperrt. Du kannst später jederzeit neu beantragen.</p>`
      : null;

  const html = legacyMailHtml`
    <p>Hallo ${args.displayName},</p>
    <p>${intro}</p>
    <p><strong>Dein Beitrag:</strong> ${amount} (${rhythmLabel}), Haushalt: ${args.householdSize}</p>
    <p><strong>Zahlung per Überweisung</strong><br/>
    Empfänger: ${bankRecipient}<br/>
    Bank: ${bankName}<br/>
    IBAN: ${bankIban}<br/>
    ${bankBicLine}Verwendungszweck: ${args.reference}</p>
    <p>Bitte nutze den Verwendungszweck exakt so, damit wir die Zahlung eindeutig zuordnen können.</p>
    ${finalReminderNotice}
    <p>Danke für deine Unterstützung.</p>
  `;
  const text = `Hallo ${args.displayName},

${intro}

Beitrag: ${amount} (${rhythmLabel}), Haushalt: ${args.householdSize}
Zahlung per Überweisung:
Empfänger: ${bankRecipient}
Bank: ${bankName}
IBAN: ${bankIban}
${bankBic ? `BIC: ${bankBic}\n` : ""}Verwendungszweck: ${args.reference}

Bitte den Verwendungszweck genau so nutzen.
${level === 3 ? "Ohne Zahlung wird der Antrag storniert und der Haushalt gesperrt. Später kannst du neu beantragen.\n" : ""}Danke für deine Unterstützung.`;

  return finalizeMail({
    subject,
    html,
    text,
    locale: args.locale,
    reason: "zu deinem Mitgliedsantrag noch kein Zahlungseingang zugeordnet werden konnte.",
  });
}

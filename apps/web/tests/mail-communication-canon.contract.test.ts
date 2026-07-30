import { describe, expect, it } from "vitest";
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import {
  buildAccountWelcomeMail,
  buildEdebatePreorderMail,
  buildEdebatePreorderPledgeAdminMail,
  buildEdebatePreorderPledgeUserMail,
  buildHouseholdInviteMail,
  buildIdentityEmailCodeMail,
  buildIdentityResumeMail,
  buildMembershipActivationMail,
  buildMembershipApplyAdminMail,
  buildMembershipApplyUserMail,
  buildMembershipConfirmationMail,
  buildMembershipReminderMail,
  buildOrgAccessMail,
  buildOrgInviteMail,
  buildPasswordResetMail,
  buildSetPasswordMail,
  buildSupportStatusMail,
  buildSupportTicketReceivedMail,
  buildTwoFactorCodeMail,
  buildVerificationMail,
} from "@/utils/emailTemplates";
import {
  ensureTransactionalMail,
  escapeMailHtml,
  legacyMailHtml,
  renderLegacyTransactionalMail,
  renderTransactionalMail,
} from "@/utils/mailRenderer";

const ROOT = path.resolve(process.cwd(), "../..");
const URL = "https://www.edebatte.org/account/action?token=sensitive-token";
const BANK = {
  recipient: "eDebatte",
  iban: "DE00 0000 0000 0000 0000 00",
  bic: "BANKDEFFXXX",
  bankName: "Hausbank",
  referenceHint: "eDebatte Beitrag",
};

function expectCanonicalMail(mail: {
  subject: string;
  preheader?: string;
  html: string;
  text: string;
}) {
  expect(mail.subject.trim()).not.toBe("");
  expect(mail.html).toContain('<body data-edebatte-mail="transactional"');
  expect(mail.html).toContain("members@edebatte.org");
  expect(mail.html).toContain("eDebatte");
  expect(mail.text.trim()).not.toBe("");
  expect(mail.text).toContain("members@edebatte.org");
  expect(mail.html).not.toMatch(/voiceopengov|no-?reply/i);
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory).flatMap((entry) => {
    const fullPath = path.join(directory, entry);
    return statSync(fullPath).isDirectory() ? sourceFiles(fullPath) : [fullPath];
  });
}

describe("mail communication canon", () => {
  it("renders equivalent German and English messages with a controlled fallback", () => {
    const de = buildTwoFactorCodeMail({ code: "123456", locale: "de-DE" });
    const en = buildTwoFactorCodeMail({ code: "123456", locale: "en-GB" });
    const fallback = buildTwoFactorCodeMail({ code: "123456", locale: "fr" });

    expectCanonicalMail(de);
    expectCanonicalMail(en);
    expect(de.html).toContain('lang="de"');
    expect(de.text).toContain("Einmaliger Login-Code");
    expect(en.html).toContain('lang="en"');
    expect(en.text).toContain("One-time login code");
    expect(fallback.locale).toBe("de");
    expect(fallback.text).toContain("gültig");
    expect(de.html).toContain("123456");
    expect(de.text).toContain("123456");
  });

  it("couples Euro formatting to the resolved mail locale", () => {
    const de = buildMembershipConfirmationMail({
      firstName: "Alex",
      planLabel: "Basis",
      monthlyAmount: 5,
      reference: "MEM-DE",
      bank: BANK,
      locale: "de-DE",
    });
    const en = buildMembershipConfirmationMail({
      firstName: "Alex",
      planLabel: "Basic",
      monthlyAmount: 5,
      reference: "MEM-EN",
      bank: BANK,
      locale: "en-GB",
    });

    expect(de.text).toMatch(/5,00\s€/);
    expect(en.text).toContain("€5.00");
    expect(en.text).not.toMatch(/5,00\s€/);
  });

  it("escapes dynamic content and removes unsafe legacy markup and URLs", () => {
    const malicious = '<img src=x onerror="alert(1)"><script>alert(2)</script>';
    const mail = buildOrgInviteMail({
      resetUrl: URL,
      orgName: malicious,
      role: 'Admin"><svg onload=alert(3)>',
      displayName: malicious,
      locale: "de",
    });
    const legacy = renderLegacyTransactionalMail({
      subject: "Legacy",
      html: legacyMailHtml`<p>${malicious}</p><a href="${"javascript:alert(4)"}">bad</a>`,
      text: "Legacy text",
    });
    const migratedLegacyTemplate = buildMembershipApplyAdminMail({
      membershipId: '<a href="https://attacker.example">MEM-42</a>',
      userId: '<span style="position:fixed">user-42</span>',
      email: "member@edebatte.org",
      amountPerPeriod: 5,
      rhythm: "monthly",
      householdSize: 1,
      locale: "de",
    });

    expect(escapeMailHtml(malicious)).toContain("&lt;script&gt;");
    expect(mail.html).not.toMatch(/<(?:script|svg|img)\b/i);
    expect(mail.html).toContain("&lt;img");
    expect(legacy.html).not.toMatch(
      /<(?:script|img)\b|<[^>]+\sonerror=|href=["']javascript:/i,
    );
    expect(migratedLegacyTemplate.html).toContain("&lt;a href=");
    expect(migratedLegacyTemplate.html).toContain("&lt;span style=");
    expect(migratedLegacyTemplate.html).not.toMatch(
      /<a\b[^>]*href="https:\/\/attacker\.example"/i,
    );
  });

  it("escapes every legacy interpolation and normalizes allowed link attributes", () => {
    const foreignUrl = "https://foreign.example/path?q=1";
    const mailtoUrl = "mailto:team@edebatte.org";
    const injectedAnchor =
      '<a href="https://attacker.example" target="_self">Nutzerlink</a>';
    const injectedStyle =
      '<span style="position:fixed;inset:0">Nutzerstil</span>';
    const manipulatedTarget = '_self" onclick="alert(1)';
    const manipulatedRel = 'opener" data-secret="x';

    const mail = renderLegacyTransactionalMail({
      subject: "Legacy-Link-Contract",
      html: legacyMailHtml`
        <a href="${foreignUrl}">Fremder HTTPS-Link</a>
        <a href="${mailtoUrl}">Mail-Link</a>
        <p>${injectedAnchor}</p>
        <p>${injectedStyle}</p>
        <a href="${"javascript:alert(1)"}">JavaScript</a>
        <a href="${"data:text/html,boom"}">Data</a>
        <a href="${"//attacker.example/path"}">Protocol relative</a>
        <a href="${foreignUrl}" target="${manipulatedTarget}" rel="${manipulatedRel}">Manipuliert</a>
      `,
    });

    expect(mail.html).toContain('href="https://foreign.example/path?q=1"');
    expect(mail.html).toContain('href="mailto:team@edebatte.org"');
    expect(mail.html).toContain("&lt;a href=");
    expect(mail.html).toContain("&lt;span style=");
    expect(mail.html).not.toMatch(
      /href=["'](?:javascript:|data:|\/\/attacker\.example)/i,
    );
    expect(mail.html).not.toContain("onclick");
    expect(mail.html).not.toContain("data-secret");

    const anchors = Array.from(mail.html.matchAll(/<a\b([^>]*)>/g)).map(
      (match) => match[1] ?? "",
    );
    expect(anchors.length).toBeGreaterThanOrEqual(3);
    for (const attributes of anchors) {
      expect(attributes).toContain('target="_blank"');
      expect(attributes).toContain('rel="noopener noreferrer"');
      expect(attributes).not.toContain("_self");
    }
  });

  it("requires immutable runtime provenance at the canonical mail boundary", () => {
    const genuine = renderTransactionalMail({
      subject: "Genuine",
      preheader: "Genuine",
      title: "Genuine",
      blocks: [{ kind: "paragraph", text: "Safe" }],
      reason: "eine echte Renderer-Mail geprüft wird.",
    });
    const spoof = {
      subject: "Spoof",
      preheader: "Spoof",
      locale: "de",
      text: "Spoof",
      html: `<body data-edebatte-mail="transactional">
        <a href="javascript:alert(1)" target="_self" rel="opener">JavaScript</a>
        <a href="data:text/html,boom">Data</a>
        <a href="//attacker.example/path">Protocol relative</a>
        <img src="https://tracker.example/pixel.gif" width="1" height="1">
      </body>`,
    };

    expect(() =>
      ensureTransactionalMail(spoof),
    ).toThrow("mail_content_provenance_invalid");
    expect(ensureTransactionalMail(genuine)).toBe(genuine);
    expect(Object.isFrozen(genuine)).toBe(true);
  });

  it("renders code and CTA components without exposing tokenized URLs as link text", () => {
    const mail = renderTransactionalMail({
      locale: "en",
      subject: "Security action",
      preheader: "Complete the action.",
      title: "Security action",
      blocks: [
        { kind: "code", value: "987654", label: "One-time code" },
        { kind: "cta", label: "Continue", url: URL },
      ],
      reason: "you requested this action.",
    });

    expect(mail.html).toContain("987654");
    expect(mail.text).toContain("987654");
    expect(mail.html).toContain("Continue");
    expect(mail.html).toContain("https://www.edebatte.org/account/action");
    expect(mail.html).not.toContain(">sensitive-token<");
    expect(mail.text).toContain(URL);
  });

  it("uses the shared renderer for every inventoried template family", () => {
    const mails = [
      buildVerificationMail({ verifyUrl: URL, displayName: "Alex", locale: "en" }),
      buildAccountWelcomeMail({ accountUrl: URL, displayName: "Alex", locale: "en" }),
      buildSetPasswordMail({ resetUrl: URL, displayName: "Alex", locale: "en" }),
      buildPasswordResetMail({ resetUrl: URL, displayName: "Alex", locale: "en" }),
      buildOrgInviteMail({
        resetUrl: URL,
        orgName: "Civic Lab",
        role: "Editor",
        locale: "en",
      }),
      buildOrgAccessMail({
        accessUrl: URL,
        orgName: "Civic Lab",
        role: "Editor",
        locale: "en",
      }),
      buildIdentityResumeMail({ resumeUrl: URL, locale: "en" }),
      buildTwoFactorCodeMail({ code: "123456", locale: "en" }),
      buildIdentityEmailCodeMail({ code: "654321", locale: "en" }),
      buildSupportTicketReceivedMail({
        category: "Account",
        requestSubject: "Help",
        locale: "en",
      }),
      buildSupportStatusMail({
        ticketReference: "SUP-42",
        status: "resolved",
        resolution: "Access restored.",
        supportUrl: URL,
        locale: "en",
      }),
      buildMembershipConfirmationMail({
        firstName: "Alex",
        planLabel: "Basis",
        monthlyAmount: 5,
        reference: "MEM-42",
        bank: BANK,
        locale: "en",
      }),
      buildMembershipActivationMail({
        displayName: "Alex",
        accountUrl: URL,
        locale: "en",
      }),
      buildEdebatePreorderMail({
        displayName: "Alex",
        planLabel: "Start",
        monthlyPrice: 10,
        accountUrl: URL,
        locale: "en",
      }),
      buildEdebatePreorderPledgeUserMail({
        displayName: "Alex",
        planLabel: "Start",
        amount: 10,
        reference: "PRE-42",
        bank: BANK,
        locale: "en",
      }),
      buildEdebatePreorderPledgeAdminMail({
        displayName: "Alex",
        email: "alex@edebatte.org",
        userId: "user-42",
        planLabel: "Start",
        amount: 10,
        reference: "PRE-42",
        bank: BANK,
        locale: "en",
      }),
      buildMembershipApplyUserMail({
        displayName: "Alex",
        amountPerPeriod: 5,
        rhythm: "monthly",
        householdSize: 1,
        membershipId: "membership-42",
        accountUrl: URL,
        bankDetails: BANK,
        locale: "en",
      }),
      buildMembershipApplyAdminMail({
        membershipId: "membership-42",
        userId: "user-42",
        email: "alex@edebatte.org",
        amountPerPeriod: 5,
        rhythm: "monthly",
        householdSize: 1,
        locale: "en",
      }),
      buildHouseholdInviteMail({
        inviteUrl: URL,
        inviterName: "Alex",
        locale: "en",
      }),
      buildMembershipReminderMail(1, {
        displayName: "Alex",
        amountPerPeriod: 5,
        rhythm: "monthly",
        householdSize: 1,
        reference: "MEM-42",
        locale: "en",
      }),
    ];

    expect(mails).toHaveLength(20);
    for (const mail of mails) expectCanonicalMail(mail);
  });

  it("keeps all real send paths on the shared mailer and one Nodemailer runtime", () => {
    const sourceRoot = path.join(ROOT, "apps/web/src");
    const files = sourceFiles(sourceRoot).filter((file) => /\.(ts|tsx)$/.test(file));
    const senders = files.filter((file) => {
      if (file.endsWith("/utils/mailer.ts") || file.endsWith("/utils/email.ts")) return false;
      return readFileSync(file, "utf8").includes("sendMail(");
    });
    const nodemailerUsers = files.filter((file) =>
      readFileSync(file, "utf8").includes('from "nodemailer"'),
    );
    const legacyHtmlCallers = files.filter((file) => {
      if (file.endsWith("/utils/mailRenderer.ts")) return false;
      return readFileSync(file, "utf8").includes(
        "renderLegacyTransactionalMail",
      );
    });

    expect(senders.length).toBeGreaterThan(20);
    for (const file of senders) {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/@\/utils\/(mailer|email)/);
    }
    expect(nodemailerUsers).toEqual([path.join(sourceRoot, "utils/mailer.ts")]);
    for (const file of legacyHtmlCallers) {
      expect(readFileSync(file, "utf8")).toContain("legacyMailHtml");
    }
    expect(
      readFileSync(path.join(sourceRoot, "utils/email.ts"), "utf8"),
    ).not.toMatch(/export\s+async\s+function\s+sendMail\s*\(/);
  });

  it("contains no forbidden sender identity or placeholder domain in real mail code", () => {
    const mailFiles = [
      "apps/web/src/utils/emailTemplates.ts",
      "apps/web/src/utils/mailRenderer.ts",
      "apps/web/src/utils/mailer.ts",
      "apps/web/src/utils/email.ts",
    ];
    const source = mailFiles
      .map((file) => readFileSync(path.join(ROOT, file), "utf8"))
      .join("\n");

    expect(source).not.toMatch(/voiceopengov|no-?reply/i);
    expect(source).not.toMatch(/@example\.(org|com)/i);

    const envExample = readFileSync(
      path.join(ROOT, "apps/web/.env.example"),
      "utf8",
    );
    const senderLines = envExample
      .split("\n")
      .filter((line) => /^(?:# )?(?:MAIL_FROM|MAIL_REPLY_TO|SMTP_FROM)=/.test(line))
      .join("\n");
    expect(senderLines).not.toMatch(/voiceopengov|no-?reply|example\.(org|com)/i);
  });
});

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
  escapeMailHtml,
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
      html: `<p>${malicious}</p><a href="javascript:alert(4)">bad</a>`,
      text: "Legacy text",
    });

    expect(escapeMailHtml(malicious)).toContain("&lt;script&gt;");
    expect(mail.html).not.toMatch(/<(?:script|svg|img)\b/i);
    expect(mail.html).toContain("&lt;img");
    expect(legacy.html).not.toMatch(/<script|<img|javascript:|onerror/i);
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

    expect(senders.length).toBeGreaterThan(20);
    for (const file of senders) {
      const source = readFileSync(file, "utf8");
      expect(source).toMatch(/@\/utils\/(mailer|email)/);
    }
    expect(nodemailerUsers).toEqual([path.join(sourceRoot, "utils/mailer.ts")]);
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

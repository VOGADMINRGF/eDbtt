// apps/web/src/utils/mailer.ts
// Robust: SMTP wenn vorhanden, sonst Console-Log. Kein Build-Fehler, kein Crash.

let _tx: any = null;

export async function sendMail(opts: {
  to: string;
  subject: string;
  html: string;
  text?: string;
}) {
  const { to, subject, html, text } = opts;
  const from = process.env.MAIL_FROM || "no-reply@localhost";
  const wantsSmtp = !!(
    process.env.SMTP_URL ||
    process.env.SMTP_HOST ||
    process.env.SMTP_USER
  );

  // Helper: sicher in die Konsole loggen (Dev-Fallback)
  const logToConsole = (reason?: string) => {
    if (reason) console.warn("[mailer] SMTP-Fallback:", reason);
    console.log(`[MAIL->${to}] ${subject}\n${html}\n`);
    return { ok: true, dev: true, fallback: true as const };
  };

  if (!wantsSmtp) {
    // Kein SMTP konfiguriert → Console
    return logToConsole();
  }

  // SMTP gewünscht → nodemailer nur *zur Laufzeit* laden (ohne Webpack-Analyse)
  try {
    // Trick: verhindert, dass Webpack 'nodemailer' build-time auflöst
    const nm = await new Function('return import("nodemailer")')();

    if (!_tx) {
      _tx = process.env.SMTP_URL
        ? nm.createTransport(process.env.SMTP_URL as string)
        : nm.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT || 587),
            secure:
              String(process.env.SMTP_SECURE || "").toLowerCase() === "true",
            auth: process.env.SMTP_USER
              ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
              : undefined,
          });
    }

    await _tx.sendMail({
      from,
      to,
      subject,
      html,
      text: text ?? html.replace(/<[^>]+>/g, ""),
    });

    return { ok: true, smtp: true };
  } catch (e: any) {
    // nodemailer fehlt oder Transport schlägt fehl → sauberer Fallback
    return logToConsole(e?.message || String(e));
  }
}

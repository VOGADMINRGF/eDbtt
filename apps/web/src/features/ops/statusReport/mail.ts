import type { StatusReportSummary } from "./contracts";
import {
  legacyMailHtml,
  renderLegacyTransactionalMail,
  type LegacyMailHtml,
} from "@/utils/mailRenderer";

function statusLabel(status: string): string {
  if (status === "green") return "GRÜN";
  if (status === "yellow") return "GELB";
  if (status === "red") return "ROT";
  return "GRAU";
}

function statusTone(status: string): { bg: string; border: string; text: string } {
  if (status === "green") return { bg: "#dcfce7", border: "#86efac", text: "#166534" };
  if (status === "yellow") return { bg: "#fef3c7", border: "#fcd34d", text: "#92400e" };
  if (status === "red") return { bg: "#fee2e2", border: "#fca5a5", text: "#991b1b" };
  return { bg: "#e2e8f0", border: "#cbd5e1", text: "#334155" };
}

function summarizeExecutiveStatus(summary: StatusReportSummary): string {
  if (summary.overallStatus === "green") return "Betrieb stabil. Keine kritischen Auffälligkeiten.";
  if (summary.overallStatus === "yellow") return "Betrieb eingeschränkt. Beobachtung und Nachverfolgung empfohlen.";
  return "Kritische Auffälligkeiten erkannt. Operatives Eingreifen erforderlich.";
}

function metaItem(label: string, value: string): LegacyMailHtml {
  return legacyMailHtml`<span style="display:inline-block;margin-right:12px;color:#475569;font-size:13px;">
    <strong style="color:#0f172a;">${label}:</strong> ${value}
  </span>`;
}

function sectionToText(section: StatusReportSummary["sections"][number]): string[] {
  const lines: string[] = [];
  lines.push(`${section.label}:`);
  if (section.checks.length === 0) {
    lines.push("- Keine Checks in diesem Abschnitt.");
    return lines;
  }
  for (const check of section.checks) {
    const suffix = check.error ? ` | Fehler: ${check.error}` : "";
    const latency = typeof check.latencyMs === "number" ? ` (${check.latencyMs} ms)` : "";
    lines.push(`- [${statusLabel(check.status)}] ${check.label}${latency}: ${check.detail}${suffix}`);
  }
  return lines;
}

function sectionToHtml(
  section: StatusReportSummary["sections"][number],
): LegacyMailHtml {
  if (section.checks.length === 0) {
    return legacyMailHtml`<section style="margin-top:16px;">
      <div style="border:1px solid #dbe4ee;border-radius:12px;background:#ffffff;overflow:hidden;">
        <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;background:#f8fafc;">
          <h3 style="margin:0;font-size:15px;color:#0f172a;">${section.label}</h3>
        </div>
        <div style="padding:12px 14px;color:#64748b;font-size:13px;">Keine Checks in diesem Abschnitt.</div>
      </div>
    </section>`;
  }

  const rows = section.checks
    .map((check) => {
      const latency = typeof check.latencyMs === "number" ? ` (${check.latencyMs} ms)` : "";
      const tone = statusTone(check.status);
      const errorLine = check.error
        ? legacyMailHtml`<div style="margin-top:4px;color:#991b1b;font-size:12px;">Fehler: ${check.error}</div>`
        : null;

      return legacyMailHtml`<tr>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;white-space:nowrap;vertical-align:top;">
          <span style="display:inline-block;padding:3px 9px;border-radius:999px;border:1px solid ${tone.border};background:${tone.bg};color:${tone.text};font-weight:700;font-size:11px;letter-spacing:0.02em;">
            ${statusLabel(check.status)}
          </span>
        </td>
        <td style="padding:10px 12px;border-bottom:1px solid #eef2f7;vertical-align:top;">
          <div style="font-size:14px;font-weight:600;color:#0f172a;">${check.label}${latency}</div>
          <div style="margin-top:3px;font-size:13px;color:#334155;">${check.detail}</div>
          ${errorLine}
        </td>
      </tr>`;
    });

  return legacyMailHtml`<section style="margin-top:16px;">
    <div style="border:1px solid #dbe4ee;border-radius:12px;background:#ffffff;overflow:hidden;">
      <div style="padding:12px 14px;border-bottom:1px solid #eef2f7;background:#f8fafc;">
        <h3 style="margin:0;font-size:15px;color:#0f172a;">${section.label}</h3>
      </div>
      <table role="presentation" style="width:100%;border-collapse:collapse;">
        ${rows}
      </table>
    </div>
  </section>`;
}

export function buildStatusReportSubject(params: {
  summary: StatusReportSummary;
  subjectPrefix?: string;
}): string {
  const prefix = params.subjectPrefix ? `${params.subjectPrefix.trim()} ` : "";
  const datePart = params.summary.generatedAt.slice(0, 10);
  return `${prefix}Ops Statusbericht | ${statusLabel(params.summary.overallStatus)} | ${datePart} | Slot ${params.summary.slot}`.trim();
}

export function renderStatusReportMail(
  summary: StatusReportSummary,
  subject = `Ops Statusbericht: ${statusLabel(summary.overallStatus)}`,
) {
  const textLines: string[] = [];
  textLines.push(`Ops Statusbericht: ${statusLabel(summary.overallStatus)}`);
  textLines.push(`Slot: ${summary.slot}`);
  textLines.push(`Zeitpunkt: ${summary.generatedAt} (${summary.timezone})`);
  textLines.push(`Kurzlage: ${summarizeExecutiveStatus(summary)}`);
  textLines.push(`Checks: ${summary.totals.green} grün, ${summary.totals.yellow} gelb, ${summary.totals.red} rot, ${summary.totals.grey} grau`);
  textLines.push("");
  textLines.push("Executive Summary:");
  for (const point of summary.summaryPoints) {
    textLines.push(`- ${point}`);
  }

  for (const section of summary.sections) {
    textLines.push("");
    textLines.push(...sectionToText(section));
  }

  const htmlSections = summary.sections.map(sectionToHtml);
  const htmlSummary = summary.summaryPoints
    .map(
      (point) =>
        legacyMailHtml`<li style="margin:0 0 6px 0;color:#334155;">${point}</li>`,
    );

  const overallTone = statusTone(summary.overallStatus);
  const html = legacyMailHtml`<div style="background:#f3f6fb;padding:24px 12px;font-family:Inter,Segoe UI,Arial,sans-serif;line-height:1.45;color:#0f172a;">
    <div style="max-width:760px;margin:0 auto;">
      <div style="border:1px solid #dbe4ee;border-radius:14px;overflow:hidden;background:#ffffff;">
        <div style="padding:14px 16px;border-bottom:1px solid #eef2f7;background:#f8fafc;">
          <span style="display:inline-block;padding:4px 10px;border-radius:999px;border:1px solid ${overallTone.border};background:${overallTone.bg};color:${overallTone.text};font-weight:700;font-size:11px;letter-spacing:0.03em;">
            ${statusLabel(summary.overallStatus)}
          </span>
          <h2 style="margin:8px 0 8px 0;font-size:20px;color:#0f172a;">Ops Statusbericht</h2>
          <div>
            ${metaItem("Zeitpunkt", `${summary.generatedAt} (${summary.timezone})`)}
            ${metaItem("Slot", summary.slot)}
            ${metaItem("Checks", `${summary.totals.green} grün · ${summary.totals.yellow} gelb · ${summary.totals.red} rot · ${summary.totals.grey} grau`)}
          </div>
        </div>
        <div style="padding:14px 16px;">
          <div style="border:1px solid #dbe4ee;border-radius:12px;background:#ffffff;padding:12px 14px;">
            <h3 style="margin:0 0 6px 0;font-size:15px;color:#0f172a;">Executive Summary</h3>
            <p style="margin:0 0 8px 0;font-size:14px;color:#334155;">${summarizeExecutiveStatus(summary)}</p>
            <ul style="margin:0;padding-left:18px;">${htmlSummary}</ul>
          </div>
          ${htmlSections}
        </div>
      </div>
    </div>
  </div>`;

  const rendered = renderLegacyTransactionalMail({
    subject,
    preheader: summarizeExecutiveStatus(summary),
    html,
    text: textLines.join("\n"),
    reason: "der interne eDebatte-Statusbericht für diesen Zeitslot erzeugt wurde.",
  });

  return rendered;
}

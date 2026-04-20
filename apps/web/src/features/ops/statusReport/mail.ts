import type { StatusReportSummary } from "./contracts";

function statusLabel(status: string): string {
  if (status === "green") return "GRUEN";
  if (status === "yellow") return "GELB";
  if (status === "red") return "ROT";
  return "GRAU";
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function statusColor(status: string): string {
  if (status === "green") return "#15803d";
  if (status === "yellow") return "#b45309";
  if (status === "red") return "#b91c1c";
  return "#64748b";
}

function sectionToText(section: StatusReportSummary["sections"][number]): string[] {
  const lines: string[] = [];
  lines.push(`${section.label}:`);
  for (const check of section.checks) {
    const suffix = check.error ? ` | Fehler: ${check.error}` : "";
    const latency = typeof check.latencyMs === "number" ? ` (${check.latencyMs}ms)` : "";
    lines.push(`- [${statusLabel(check.status)}] ${check.label}${latency}: ${check.detail}${suffix}`);
  }
  return lines;
}

function sectionToHtml(section: StatusReportSummary["sections"][number]): string {
  const rows = section.checks
    .map((check) => {
      const latency = typeof check.latencyMs === "number" ? ` (${check.latencyMs} ms)` : "";
      const error = check.error
        ? `<div style="color:#b91c1c;font-size:12px;margin-top:4px;">${escapeHtml(check.error)}</div>`
        : "";

      return `<tr>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;white-space:nowrap;">
          <span style="display:inline-block;padding:2px 8px;border-radius:999px;background:${statusColor(
            check.status,
          )};color:#fff;font-weight:700;font-size:11px;">${statusLabel(check.status)}</span>
        </td>
        <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;">
          <div style="font-weight:600;">${escapeHtml(check.label)}${escapeHtml(latency)}</div>
          <div style="font-size:13px;color:#1f2937;">${escapeHtml(check.detail)}</div>
          ${error}
        </td>
      </tr>`;
    })
    .join("");

  return `<section style="margin-top:18px;">
    <h3 style="margin:0 0 8px 0;font-size:16px;">${escapeHtml(section.label)}</h3>
    <table role="presentation" style="width:100%;border-collapse:collapse;background:#fff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
      ${rows}
    </table>
  </section>`;
}

export function buildStatusReportSubject(params: {
  summary: StatusReportSummary;
  subjectPrefix?: string;
}): string {
  const prefix = params.subjectPrefix ? `${params.subjectPrefix.trim()} ` : "";
  const datePart = params.summary.generatedAt.slice(0, 10);
  return `${prefix}[${statusLabel(params.summary.overallStatus)}] Plattformstatus ${datePart} ${params.summary.slot}`.trim();
}

export function renderStatusReportMail(summary: StatusReportSummary): {
  text: string;
  html: string;
} {
  const textLines: string[] = [];
  textLines.push(`Plattformstatus: ${statusLabel(summary.overallStatus)}`);
  textLines.push(`Slot: ${summary.slot}`);
  textLines.push(`Zeitpunkt: ${summary.generatedAt} (${summary.timezone})`);
  textLines.push(
    `Checks: ${summary.totals.green} gruen, ${summary.totals.yellow} gelb, ${summary.totals.red} rot, ${summary.totals.grey} grau`,
  );
  textLines.push("");
  textLines.push("Zusammenfassung:");
  for (const point of summary.summaryPoints) {
    textLines.push(`- ${point}`);
  }

  for (const section of summary.sections) {
    textLines.push("");
    textLines.push(...sectionToText(section));
  }

  const htmlSections = summary.sections.map(sectionToHtml).join("\n");
  const htmlSummary = summary.summaryPoints
    .map((point) => `<li style="margin:0 0 6px 0;">${escapeHtml(point)}</li>`)
    .join("");

  const html = `<div style="font-family:Inter,Segoe UI,Arial,sans-serif;color:#0f172a;line-height:1.45;">
    <h2 style="margin:0 0 8px 0;">Plattformstatus ${escapeHtml(statusLabel(summary.overallStatus))}</h2>
    <p style="margin:0 0 2px 0;font-size:14px;"><strong>Slot:</strong> ${escapeHtml(summary.slot)}</p>
    <p style="margin:0 0 2px 0;font-size:14px;"><strong>Zeitpunkt:</strong> ${escapeHtml(summary.generatedAt)} (${escapeHtml(summary.timezone)})</p>
    <p style="margin:0 0 10px 0;font-size:14px;"><strong>Checks:</strong> ${summary.totals.green} gruen, ${summary.totals.yellow} gelb, ${summary.totals.red} rot, ${summary.totals.grey} grau</p>
    <ul style="margin:0 0 16px 16px;padding:0;">${htmlSummary}</ul>
    ${htmlSections}
  </div>`;

  return {
    text: textLines.join("\n"),
    html,
  };
}

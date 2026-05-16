import type { Evidence } from "@/engine/types";

/** Basename only; must stay inside the case `printables/` folder. */
const PRINTABLE_HTML_BASENAME = /^[A-Za-z0-9][A-Za-z0-9._-]*\.html$/;

export function getEvidencePrintableUrl(caseId: string, evidence: Evidence): string | null {
  const file = evidence.printableHtml?.trim();
  if (!file || !PRINTABLE_HTML_BASENAME.test(file)) {
    return null;
  }
  const safeCase = encodeURIComponent(caseId);
  const safeFile = encodeURIComponent(file);
  return `/api/cases/${safeCase}/printables/${safeFile}#${encodeURIComponent(evidence.id)}`;
}

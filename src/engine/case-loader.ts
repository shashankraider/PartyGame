import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";
import { parse } from "jsonc-parser";
import type { Case } from "./types";

export type CaseSummary = {
  id: string;
  title: string;
  tagline?: string;
  estimatedDurationMinutes?: number;
  playerCount?: {
    min?: number;
    max?: number;
  };
  ageRating?: string;
};

const repoRoot = process.cwd();
const casesRoot = path.join(repoRoot, "cases");

function getCaseFile(caseId: string) {
  return path.join(casesRoot, caseId, "case.json");
}

function toCaseSummary(caseData: Case): CaseSummary {
  return {
    id: caseData.id,
    title: caseData.meta.title,
    tagline: caseData.meta.tagline,
    estimatedDurationMinutes: caseData.meta.estimatedDurationMinutes,
    playerCount: caseData.meta.recommendedPlayers,
    ageRating: caseData.meta.ageRating,
  };
}

export async function loadCase(caseId: string): Promise<Case> {
  const file = getCaseFile(caseId);
  const source = await readFile(file, "utf8");
  return parse(source) as Case;
}

export async function getPlayableCaseIds(): Promise<string[]> {
  const entries = await readdir(casesRoot, { withFileTypes: true });
  const ids = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory() && !entry.name.startsWith("_"))
      .map(async (entry) => {
        const caseFile = getCaseFile(entry.name);

        try {
          const fileStat = await stat(caseFile);
          return fileStat.isFile() ? entry.name : null;
        } catch {
          return null;
        }
      }),
  );

  return ids.filter((id): id is string => Boolean(id)).sort();
}

export async function loadCaseSummaries(): Promise<CaseSummary[]> {
  const ids = await getPlayableCaseIds();
  const summaries = await Promise.all(ids.map(async (id) => toCaseSummary(await loadCase(id))));
  return summaries;
}

export async function loadConfiguredCaseSummaries(): Promise<CaseSummary[]> {
  const configuredCaseId = process.env.CASE_ID?.trim();

  if (!configuredCaseId) {
    return loadCaseSummaries();
  }

  return [toCaseSummary(await loadCase(configuredCaseId))];
}

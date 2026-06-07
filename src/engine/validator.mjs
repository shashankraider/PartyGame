/**
 * Pure case-validator logic. Importable by the CLI script
 * (`scripts/validate-case.mjs`) and by tests.
 *
 * Conventions:
 *   - All checks return arrays of issue objects: { level: "error" | "warn", message }.
 *   - Pure functions take inputs and return outputs; no file I/O.
 *   - File-I/O helpers are exported separately so tests can avoid the disk
 *     by passing an in-memory case object directly to `validateCase`.
 */
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, isAbsolute, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { parse as parseJsonc } from "jsonc-parser";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
export const PROJECT_ROOT = join(__dirname, "..", "..");
export const SCHEMA_PATH = join(PROJECT_ROOT, "src/engine/schema/case.schema.json");
export const CASES_ROOT = join(PROJECT_ROOT, "cases");
export const ENGINE_VERSION = "1.0.0";

export function error(message) {
  return { level: "error", message };
}
export function warn(message) {
  return { level: "warn", message };
}

// ---------------------------------------------------------------------------
// JSONC + schema loading
// ---------------------------------------------------------------------------

export function parseCaseText(text) {
  const errors = [];
  const value = parseJsonc(text, errors, { allowTrailingComma: true });
  if (errors.length > 0) {
    const detail = errors.map((e) => `offset ${e.offset}: ${e.error}`).join("; ");
    throw new Error(`JSONC parse error: ${detail}`);
  }
  return value;
}

export async function loadCaseFromFile(path) {
  const text = await readFile(path, "utf8");
  return parseCaseText(text);
}

export async function loadSchema(path = SCHEMA_PATH) {
  const text = await readFile(path, "utf8");
  return JSON.parse(text);
}

export function buildSchemaValidator(schema) {
  const ajv = new Ajv2020.default({
    strict: false,
    allErrors: true,
    allowUnionTypes: true,
  });
  addFormats.default(ajv);
  return ajv.compile(schema);
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

/**
 * Minimal semver-range check.
 * Supports: exact "X.Y.Z" and caret "^X.Y.Z".
 * Returns true if `version` satisfies `range`.
 */
export function semverSatisfies(version, range) {
  const parts = (v) => v.split(".").map((n) => parseInt(n, 10));
  if (!/^\d+\.\d+\.\d+$/.test(version)) return false;
  if (range.startsWith("^")) {
    const r = range.slice(1);
    if (!/^\d+\.\d+\.\d+$/.test(r)) return false;
    const [vMaj, vMin, vPatch] = parts(version);
    const [rMaj, rMin, rPatch] = parts(r);
    if (vMaj !== rMaj) return false;
    if (vMaj === 0) {
      // ^0.x.y: only the patch is flexible within the same minor
      if (vMin !== rMin) return false;
      return vPatch >= rPatch;
    }
    if (vMin < rMin) return false;
    if (vMin === rMin && vPatch < rPatch) return false;
    return true;
  }
  if (/^\d+\.\d+\.\d+$/.test(range)) {
    return version === range;
  }
  return false;
}

export function detectChapterCycles(chapters) {
  const byId = new Map(chapters.map((c) => [c.id, c]));
  const visited = new Set();
  const stack = new Set();
  const issues = [];

  function dfs(id, path) {
    if (stack.has(id)) {
      issues.push(`chapter dependency cycle: ${[...path, id].join(" -> ")}`);
      return;
    }
    if (visited.has(id)) return;
    visited.add(id);
    stack.add(id);
    const chapter = byId.get(id);
    for (const prereq of chapter?.prerequisites ?? []) {
      if (!byId.has(prereq)) {
        issues.push(`chapter "${id}" references unknown prerequisite "${prereq}"`);
        continue;
      }
      dfs(prereq, [...path, id]);
    }
    stack.delete(id);
  }

  for (const c of chapters) dfs(c.id, []);
  return issues;
}

export function assetPathExists(caseDir, relative) {
  if (!relative) return true;
  if (isAbsolute(relative)) return true;
  if (/^https?:\/\//.test(relative)) return true;
  return existsSync(join(caseDir, relative));
}

// ---------------------------------------------------------------------------
// Cross-reference checks (pure given a case object)
// ---------------------------------------------------------------------------

export function crossReferenceChecks(caseObj, options = {}) {
  const { caseDir = null, checkAssets = caseDir !== null } = options;
  const issues = [];

  if (!caseObj || typeof caseObj !== "object") {
    return [error("case is not an object")];
  }

  const suspectIds = new Set((caseObj.suspects ?? []).map((s) => s.id));
  const evidenceIds = new Set((caseObj.evidence ?? []).map((e) => e.id));
  const chapterIds = new Set((caseObj.chapters ?? []).map((c) => c.id));
  const locationIds = new Set((caseObj.locations ?? []).map((l) => l.id));
  const roundNumbers = new Set((caseObj.rounds ?? []).map((r) => r.number));
  const printableOwners = new Map();

  function checkRef(kind, set, value, ctx) {
    if (value == null) return;
    if (!set.has(value)) {
      issues.push(error(`${ctx} references unknown ${kind} "${value}"`));
    }
  }

  function checkUnlockCondition(cond, ctx) {
    if (!cond || typeof cond !== "object") return;
    switch (cond.type) {
      case "evidence":
        checkRef("evidence id", evidenceIds, cond.evidenceId, ctx);
        break;
      case "chapter":
        checkRef("chapter id", chapterIds, cond.chapterId, ctx);
        break;
      case "round":
        if (!roundNumbers.has(cond.roundNumber)) {
          issues.push(error(`${ctx} references unknown round number ${cond.roundNumber}`));
        }
        break;
      case "all":
      case "any":
        for (const c of cond.conditions ?? []) checkUnlockCondition(c, ctx);
        break;
    }
  }

  // Engine version check.
  if (caseObj.engineVersion && !semverSatisfies(ENGINE_VERSION, caseObj.engineVersion)) {
    issues.push(
      error(
        `case targets engineVersion "${caseObj.engineVersion}" but this engine is ${ENGINE_VERSION}`
      )
    );
  }

  // Suspects.
  for (const s of caseObj.suspects ?? []) {
    const ctx = `suspect "${s.id}"`;
    checkRef("chapter id", chapterIds, s.introducedAtChapter, `${ctx}.introducedAtChapter`);
    for (const t of s.trueTimeline ?? []) {
      checkRef("location id", locationIds, t.locationId, `${ctx}.trueTimeline[].locationId`);
      checkUnlockCondition(t.revealCondition, `${ctx}.trueTimeline[].revealCondition`);
    }
    for (const sec of s.secrets ?? []) {
      checkUnlockCondition(sec.revealOnlyIf, `${ctx}.secrets[${sec.id}].revealOnlyIf`);
    }
    for (const bp of s.breakingPoints ?? []) {
      checkUnlockCondition(bp.trigger, `${ctx}.breakingPoints[${bp.id}].trigger`);
    }
  }

  // Evidence.
  for (const e of caseObj.evidence ?? []) {
    const ctx = `evidence "${e.id}"`;
    checkRef("chapter id", chapterIds, e.unlockedAtChapter, `${ctx}.unlockedAtChapter`);
    checkRef("location id", locationIds, e.locationId, `${ctx}.locationId`);
    checkRef("chapter id", chapterIds, e.triggersChapter, `${ctx}.triggersChapter`);
    if (e.revealedInRound != null && !roundNumbers.has(e.revealedInRound)) {
      issues.push(error(`${ctx} references unknown round number ${e.revealedInRound}`));
    }
    for (const sid of e.relatesToSuspectIds ?? []) {
      checkRef("suspect id", suspectIds, sid, `${ctx}.relatesToSuspectIds`);
    }
    if (e.printableHtml) {
      const existingOwner = printableOwners.get(e.printableHtml);
      if (existingOwner) {
        issues.push(
          error(
            `${ctx}.printableHtml shares "${e.printableHtml}" with evidence "${existingOwner}"; each evidence item must use a standalone exhibit`,
          ),
        );
      } else {
        printableOwners.set(e.printableHtml, e.id);
      }
    }
    if (checkAssets) {
      if (e.thumbnailUrl && !assetPathExists(caseDir, e.thumbnailUrl)) {
        issues.push(warn(`${ctx}.thumbnailUrl path not found on disk: ${e.thumbnailUrl}`));
      }
      if (e.fullViewUrl && !assetPathExists(caseDir, e.fullViewUrl)) {
        issues.push(warn(`${ctx}.fullViewUrl path not found on disk: ${e.fullViewUrl}`));
      }
      if (e.pdfUrl && !assetPathExists(caseDir, e.pdfUrl)) {
        issues.push(warn(`${ctx}.pdfUrl path not found on disk: ${e.pdfUrl}`));
      }
      if (
        e.printableHtml &&
        !assetPathExists(caseDir, join("printables", e.printableHtml))
      ) {
        issues.push(warn(`${ctx}.printableHtml path not found on disk: ${e.printableHtml}`));
      }
    }
  }

  // Chapters.
  for (const c of caseObj.chapters ?? []) {
    const ctx = `chapter "${c.id}"`;
    if (c.roundNumber != null && !roundNumbers.has(c.roundNumber)) {
      issues.push(error(`${ctx} references unknown round number ${c.roundNumber}`));
    }
    checkRef("location id", locationIds, c.locationId, `${ctx}.locationId`);
    for (const p of c.prerequisites ?? []) {
      checkRef("chapter id", chapterIds, p, `${ctx}.prerequisites`);
    }
    if (c.type === "interview") {
      checkRef("suspect id", suspectIds, c.suspectId, `${ctx}.suspectId`);
      for (const eid of c.presentableEvidence ?? []) {
        checkRef("evidence id", evidenceIds, eid, `${ctx}.presentableEvidence`);
      }
    }
    if (c.type === "evidence-reveal") {
      for (const eid of c.evidenceIds ?? []) {
        checkRef("evidence id", evidenceIds, eid, `${ctx}.evidenceIds`);
      }
    }
    if (c.type === "phone-hack") {
      for (const kid of c.keyClueIds ?? []) {
        checkRef("evidence id", evidenceIds, kid, `${ctx}.keyClueIds`);
      }
    }
  }

  // Chapter DAG cycle detection.
  for (const cycleIssue of detectChapterCycles(caseObj.chapters ?? [])) {
    issues.push(error(cycleIssue));
  }

  // Atmospheric threads.
  for (const t of caseObj.atmosphericThreads ?? []) {
    const ctx = `atmosphericThread "${t.id}"`;
    for (const cid of t.clueIds ?? []) checkRef("evidence id", evidenceIds, cid, `${ctx}.clueIds`);
    checkRef("evidence id", evidenceIds, t.resolvedByEvidence, `${ctx}.resolvedByEvidence`);
    checkRef("chapter id", chapterIds, t.resolvedByChapter, `${ctx}.resolvedByChapter`);
  }

  // Backstory.
  for (const b of caseObj.backstory ?? []) {
    const ctx = `backstory "${b.id}"`;
    for (const eid of b.revealedByEvidence ?? [])
      checkRef("evidence id", evidenceIds, eid, `${ctx}.revealedByEvidence`);
  }

  // Endgame.
  if (caseObj.endgame) {
    for (const path of caseObj.endgame.paths ?? []) {
      const ctx = `endgame path "${path.id}"`;
      checkRef("suspect id", suspectIds, path.triggerSuspectId, `${ctx}.triggerSuspectId`);
      checkRef("suspect id", suspectIds, path.followUpSuspectId, `${ctx}.followUpSuspectId`);
    }
  }

  // Solution.
  if (caseObj.solution) {
    for (const sid of caseObj.solution.killerSuspectIds ?? []) {
      if (!suspectIds.has(sid)) {
        issues.push(error(`solution.killerSuspectIds references unknown suspect "${sid}"`));
      }
    }
    for (const sid of Object.keys(caseObj.solution.killerRoles ?? {})) {
      if (!suspectIds.has(sid)) {
        issues.push(error(`solution.killerRoles references unknown suspect "${sid}"`));
      }
    }
    for (const rh of caseObj.solution.redHerrings ?? []) {
      checkRef("suspect id", suspectIds, rh.suspectId, `solution.redHerrings[].suspectId`);
    }
  }

  // Asset checks (only when caseDir is provided).
  if (checkAssets) {
    if (caseObj.meta?.coverImage && !assetPathExists(caseDir, caseObj.meta.coverImage)) {
      issues.push(warn(`meta.coverImage path not found on disk: ${caseObj.meta.coverImage}`));
    }
    for (const s of caseObj.suspects ?? []) {
      if (s.portraitUrl && !assetPathExists(caseDir, s.portraitUrl)) {
        issues.push(warn(`suspect "${s.id}".portraitUrl not found on disk: ${s.portraitUrl}`));
      }
    }
    for (const l of caseObj.locations ?? []) {
      if (l.imageUrl && !assetPathExists(caseDir, l.imageUrl)) {
        issues.push(warn(`location "${l.id}".imageUrl not found on disk: ${l.imageUrl}`));
      }
    }
  }

  return issues;
}

// ---------------------------------------------------------------------------
// Top-level validator
// ---------------------------------------------------------------------------

/**
 * Validate a case object end-to-end (schema + cross-reference).
 * @param caseObj parsed case
 * @param schemaValidator pre-compiled ajv validator
 * @param options { caseDir, checkAssets }
 * @returns { issues, hasErrors }
 */
export function validateCase(caseObj, schemaValidator, options = {}) {
  const issues = [];

  const valid = schemaValidator(caseObj);
  if (!valid) {
    for (const err of schemaValidator.errors ?? []) {
      issues.push(error(`schema ${err.instancePath || "/"} ${err.message}`));
    }
  }

  try {
    issues.push(...crossReferenceChecks(caseObj, options));
  } catch (e) {
    issues.push(error(`cross-reference check threw: ${e.message}`));
  }

  return {
    issues,
    hasErrors: issues.some((i) => i.level === "error"),
  };
}

/**
 * Convenience: validate a case from disk by case id.
 */
export async function validateCaseById(caseId, options = {}) {
  const caseDir = join(CASES_ROOT, caseId);
  const caseFile = join(caseDir, "case.json");
  if (!existsSync(caseFile)) {
    return {
      issues: [error(`case.json not found at ${caseFile}`)],
      hasErrors: true,
    };
  }
  let caseObj;
  try {
    caseObj = await loadCaseFromFile(caseFile);
  } catch (e) {
    return {
      issues: [error(e.message)],
      hasErrors: true,
    };
  }
  const schema = await loadSchema();
  const schemaValidator = buildSchemaValidator(schema);
  return validateCase(caseObj, schemaValidator, { caseDir, ...options });
}

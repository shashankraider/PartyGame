/**
 * Test helpers — load the case template and clone it for mutation-based tests.
 *
 * Pattern:
 *   const c = await templateClone();
 *   c.suspects[0].breakingPoints[0].trigger.evidenceId = "does-not-exist";
 *   const { issues } = validateCase(c, schemaValidator);
 *   // assert the validator caught it
 */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseCaseText, PROJECT_ROOT, loadSchema, buildSchemaValidator } from "../../src/engine/validator.mjs";

export const TEMPLATE_CASE_PATH = join(PROJECT_ROOT, "cases/_template/case.json");

/** Read the template case.json from disk as a fresh object. */
export async function loadTemplate() {
  const text = await readFile(TEMPLATE_CASE_PATH, "utf8");
  return parseCaseText(text);
}

/** Deep-clone any JSON-serializable object. */
export function deepClone(obj) {
  return structuredClone(obj);
}

/** Convenience: a fresh, mutable clone of the template. */
export async function templateClone() {
  const t = await loadTemplate();
  return deepClone(t);
}

/** Build a fresh ajv validator from the on-disk schema. Cached after first call. */
let _validator;
export async function getSchemaValidator() {
  if (_validator) return _validator;
  const schema = await loadSchema();
  _validator = buildSchemaValidator(schema);
  return _validator;
}

/** Read the JSON Schema file. */
export async function getSchema() {
  return loadSchema();
}

/** Convenience: count errors / warnings on an issues array. */
export function counts(issues) {
  return {
    errors: issues.filter((i) => i.level === "error").length,
    warnings: issues.filter((i) => i.level === "warn").length,
  };
}

/** Convenience: does any issue mention the given substring? */
export function hasMessage(issues, substring) {
  return issues.some((i) => i.message.includes(substring));
}

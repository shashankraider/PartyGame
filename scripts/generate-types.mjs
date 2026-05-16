#!/usr/bin/env node
/**
 * Generates src/engine/types.ts from src/engine/schema/case.schema.json.
 * Single source of truth: the JSON Schema.
 *
 * Usage:
 *   npm run types:generate
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { compile } from "json-schema-to-typescript";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, "..");
const schemaPath = join(projectRoot, "src/engine/schema/case.schema.json");
const typesPath = join(projectRoot, "src/engine/types.ts");

const banner = `/**
 * AUTO-GENERATED from src/engine/schema/case.schema.json.
 * Do not edit by hand. Regenerate with:
 *   npm run types:generate
 */
/* eslint-disable */
/* tslint:disable */
`;

async function main() {
  const schemaText = await readFile(schemaPath, "utf8");
  const schema = JSON.parse(schemaText);

  const ts = await compile(schema, "Case", {
    bannerComment: banner,
    additionalProperties: false,
    style: { semi: true, singleQuote: false },
    declareExternallyReferenced: true,
    enableConstEnums: false,
    strictIndexSignatures: true,
  });

  await writeFile(typesPath, ts);
  console.log(`Generated ${typesPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

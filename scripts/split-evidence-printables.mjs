#!/usr/bin/env node

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { applyEdits, modify, parse as parseJsonc } from "jsonc-parser";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(scriptDir, "..");
const caseDir = path.join(projectRoot, "cases", "mussoorie");
const printablesDir = path.join(caseDir, "printables");
const caseFile = path.join(caseDir, "case.json");
const sourceFiles = [
  "Round1_The_Scene.html",
  "Round2_Suspects_Crack.html",
  "Round3_Thakur_Connection.html",
  "Round4_The_Solve.html",
];
const checkOnly = process.argv.includes("--check");

function extractEvidenceBlock(html, evidenceId) {
  const marker = `<div id="${evidenceId}" class="evidence-item">`;
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error(`Could not find evidence block "${evidenceId}"`);
  }

  const tagPattern = /<\/?div\b[^>]*>/gi;
  tagPattern.lastIndex = start;
  let depth = 0;
  let match;

  while ((match = tagPattern.exec(html))) {
    depth += match[0].startsWith("</") ? -1 : 1;
    if (depth === 0) {
      return html.slice(start, tagPattern.lastIndex);
    }
  }

  throw new Error(`Evidence block "${evidenceId}" has unbalanced div tags`);
}

function standaloneDocument(sourceHtml, evidenceId) {
  const style = sourceHtml.match(/<style>([\s\S]*?)<\/style>/)?.[1];
  if (!style) {
    throw new Error(`Source sheet for "${evidenceId}" has no style block`);
  }

  const evidenceBlock = extractEvidenceBlock(sourceHtml, evidenceId);

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Murder in Mussoorie - ${evidenceId}</title>
<style>
${style}

  /* Standalone in-app evidence sheet */
  html { min-height: 100%; background: #2a2520; }
  body { min-height: 100%; padding: 12px; }
  body > .evidence-item { margin: 0 auto; }
  @media (max-width: 640px) {
    body { padding: 6px; }
    .evidence-body { padding: 20px; }
  }
</style>
</head>
<body>
${evidenceBlock}
</body>
</html>
`;
}

function updatePrintableMappings(caseText, evidenceIds) {
  let nextText = caseText;
  let caseData = parseJsonc(nextText);

  for (const evidenceId of evidenceIds) {
    const index = caseData.evidence.findIndex((evidence) => evidence.id === evidenceId);
    if (index === -1) {
      throw new Error(`Printable source contains unknown evidence "${evidenceId}"`);
    }

    nextText = applyEdits(
      nextText,
      modify(nextText, ["evidence", index, "printableHtml"], `${evidenceId}.html`, {
        formattingOptions: { insertSpaces: true, tabSize: 2 },
      }),
    );
    caseData = parseJsonc(nextText);
  }

  return nextText;
}

async function main() {
  const generated = new Map();

  for (const sourceFile of sourceFiles) {
    const sourceHtml = await readFile(path.join(printablesDir, sourceFile), "utf8");
    const evidenceIds = [
      ...sourceHtml.matchAll(/<div id="([^"]+)" class="evidence-item">/g),
    ].map((match) => match[1]);

    for (const evidenceId of evidenceIds) {
      if (generated.has(evidenceId)) {
        throw new Error(`Evidence "${evidenceId}" appears in more than one source sheet`);
      }
      generated.set(evidenceId, standaloneDocument(sourceHtml, evidenceId));
    }
  }

  const caseText = await readFile(caseFile, "utf8");
  const caseData = parseJsonc(caseText);
  const caseEvidenceIds = new Set(caseData.evidence.map((evidence) => evidence.id));

  if (generated.size !== caseEvidenceIds.size) {
    throw new Error(
      `Expected ${caseEvidenceIds.size} standalone exhibits, found ${generated.size}`,
    );
  }
  for (const evidenceId of caseEvidenceIds) {
    if (!generated.has(evidenceId)) {
      throw new Error(`No printable source block found for "${evidenceId}"`);
    }
  }

  if (checkOnly) {
    for (const [evidenceId, expectedHtml] of generated) {
      const file = path.join(printablesDir, `${evidenceId}.html`);
      const actualHtml = await readFile(file, "utf8").catch(() => null);
      if (actualHtml !== expectedHtml) {
        throw new Error(`Standalone exhibit is missing or stale: ${evidenceId}.html`);
      }
    }
    for (const evidence of caseData.evidence) {
      if (evidence.printableHtml !== `${evidence.id}.html`) {
        throw new Error(
          `Evidence "${evidence.id}" must map to "${evidence.id}.html", found "${evidence.printableHtml}"`,
        );
      }
    }
    console.log(`OK — ${generated.size} standalone evidence exhibits are current`);
    return;
  }

  for (const [evidenceId, html] of generated) {
    await writeFile(path.join(printablesDir, `${evidenceId}.html`), html);
  }
  await writeFile(caseFile, updatePrintableMappings(caseText, generated.keys()));

  console.log(`Generated ${generated.size} standalone evidence exhibits`);
}

await main();

import { describe, test } from "node:test";
import assert from "node:assert/strict";
import { getEvidencePrintableUrl } from "../src/lib/printables.ts";

describe("evidence printable URLs", () => {
  test("opens the standalone exhibit without a fragment jump", () => {
    const url = getEvidencePrintableUrl("mussoorie", {
      id: "anonymous-letter-1",
      printableHtml: "anonymous-letter-1.html",
    });

    assert.equal(
      url,
      "/api/cases/mussoorie/printables/anonymous-letter-1.html",
    );
    assert.equal(url.includes("#"), false);
  });

  test("rejects paths outside the printables folder", () => {
    const url = getEvidencePrintableUrl("mussoorie", {
      id: "anonymous-letter-1",
      printableHtml: "../case.json",
    });

    assert.equal(url, null);
  });
});

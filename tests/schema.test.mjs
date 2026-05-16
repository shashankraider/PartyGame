/**
 * Schema-level tests: does the JSON Schema accept valid cases
 * and reject invalid ones?
 */
import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { templateClone, getSchemaValidator, getSchema } from "./helpers/make-case.mjs";

describe("schema integrity", () => {
  test("schema file parses as JSON", async () => {
    const schema = await getSchema();
    assert.equal(schema.$schema, "https://json-schema.org/draft/2020-12/schema");
    assert.equal(schema.title, "Case");
    assert.equal(typeof schema.$defs, "object");
  });

  test("schema compiles with ajv", async () => {
    const validator = await getSchemaValidator();
    assert.equal(typeof validator, "function");
  });
});

describe("schema accepts the template", () => {
  test("template is a valid Case", async () => {
    const c = await templateClone();
    const v = await getSchemaValidator();
    assert.equal(v(c), true, JSON.stringify(v.errors, null, 2));
  });
});

describe("schema rejects: missing required top-level fields", () => {
  for (const field of [
    "id",
    "version",
    "engineVersion",
    "meta",
    "victim",
    "suspects",
    "evidence",
    "chapters",
    "rounds",
    "locations",
    "endgame",
    "solution",
  ]) {
    test(`missing "${field}" is rejected`, async () => {
      const c = await templateClone();
      delete c[field];
      const v = await getSchemaValidator();
      assert.equal(v(c), false, `expected schema to reject missing ${field}`);
    });
  }
});

describe("schema rejects: wrong types", () => {
  test("id with uppercase letters is rejected", async () => {
    const c = await templateClone();
    c.id = "Template";
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("id with underscores is rejected", async () => {
    const c = await templateClone();
    c.id = "the_case";
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("version not in semver format is rejected", async () => {
    const c = await templateClone();
    c.version = "1.0";
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("suspects array shorter than 3 is rejected", async () => {
    const c = await templateClone();
    c.suspects = c.suspects.slice(0, 2);
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("suspect with no breakingPoints is rejected (minItems 1)", async () => {
    const c = await templateClone();
    c.suspects[0].breakingPoints = [];
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("evidence with empty array is rejected (minItems 1)", async () => {
    const c = await templateClone();
    c.evidence = [];
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("unknown chapter type is rejected", async () => {
    const c = await templateClone();
    c.chapters[0].type = "not-a-real-type";
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("unknown guiltCategory is rejected", async () => {
    const c = await templateClone();
    c.suspects[0].guiltCategory = "evil-genius";
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("additionalProperties on Case is rejected", async () => {
    const c = await templateClone();
    c.somethingExtra = "should not be allowed";
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });

  test("UnlockCondition with unknown type is rejected", async () => {
    const c = await templateClone();
    c.suspects[0].breakingPoints[0].trigger = { type: "fake-trigger" };
    const v = await getSchemaValidator();
    assert.equal(v(c), false);
  });
});

describe("schema accepts: optional fields omitted", () => {
  test("case without backstory still validates", async () => {
    const c = await templateClone();
    delete c.backstory;
    const v = await getSchemaValidator();
    assert.equal(v(c), true);
  });

  test("case without atmosphericThreads still validates", async () => {
    const c = await templateClone();
    delete c.atmosphericThreads;
    const v = await getSchemaValidator();
    assert.equal(v(c), true);
  });

  test("case without theme/llm still validates", async () => {
    const c = await templateClone();
    delete c.theme;
    delete c.llm;
    const v = await getSchemaValidator();
    assert.equal(v(c), true);
  });
});

import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

test("regulations contain complete compliance profiles", async () => {
  const regulations = await readJson("data/regulations.json");
  assert.ok(regulations.length >= 11);

  for (const regulation of regulations) {
    assert.match(regulation.sourceUrl, /^https:\/\//);
    assert.match(regulation.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(regulation.promulgationDate.length > 0);
    assert.ok(regulation.effectiveDate.length > 0);
    assert.ok(regulation.articleCount.length > 0);
    assert.ok(regulation.structure.length > 0);
    assert.ok(regulation.transition.length >= 30);
    assert.ok(regulation.scope.length > 30);
    assert.ok(regulation.summary.length > 30);
    assert.ok(regulation.detailedOverview.length > 50);
    assert.ok(regulation.keyPoints.length >= 4);
  }
});

test("global governance frameworks are present and correctly classified", async () => {
  const regulations = await readJson("data/regulations.json");
  const byId = new Map(regulations.map((regulation) => [regulation.id, regulation]));

  for (const id of ["nist-ai-rmf", "iso-iec-42001", "taiwan-ai-risk-classification"]) {
    assert.ok(byId.has(id), `missing ${id}`);
    assert.equal(byId.get(id).statusGroup, "指引");
  }

  assert.match(byId.get("nist-ai-rmf").status, /修訂中/);
  assert.match(byId.get("iso-iec-42001").effectiveDate, /自願採用/);
  assert.match(byId.get("taiwan-ai-risk-classification").structure, /20 子類型/);
});

test("regulatory updates are sorted newest first", async () => {
  const updates = await readJson("data/updates.json");
  const dates = updates.map((update) => update.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("regulatory updates contain actionable compliance analysis", async () => {
  const updates = await readJson("data/updates.json");
  assert.ok(updates.length >= 9);

  for (const update of updates) {
    assert.match(update.sourceUrl, /^https:\/\//);
    assert.match(update.verifiedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(update.authority.length >= 8);
    assert.ok(update.keyDate.length >= 15);
    assert.ok(update.affectedCompanies.length >= 30);
    assert.ok(update.summary.length >= 45);
    assert.ok(update.background.length >= 70);
    assert.ok(update.whatChanged.length >= 70);
    assert.ok(update.businessImpact.length >= 70);
    assert.ok(update.action.length >= 35);
    assert.ok(update.keyPoints.length >= 5);
  }
});

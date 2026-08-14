import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readJson = async (path) => JSON.parse(await readFile(path, "utf8"));

const readRegulations = async () => [
  ...(await readJson("data/regulations.json")),
  ...(await readJson("data/regulations-research.json")),
];

test("regulations contain complete compliance profiles", async () => {
  const regulations = await readRegulations();
  assert.ok(regulations.length >= 38);

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
  const regulations = await readRegulations();
  const byId = new Map(regulations.map((regulation) => [regulation.id, regulation]));

  for (const id of [
    "nist-ai-rmf",
    "iso-iec-42001",
    "taiwan-ai-risk-classification",
    "eu-ai-omnibus-2026",
  ]) {
    assert.ok(byId.has(id), `missing ${id}`);
  }

  assert.equal(byId.get("nist-ai-rmf").statusGroup, "指引");
  assert.equal(byId.get("iso-iec-42001").statusGroup, "指引");
  assert.equal(byId.get("taiwan-ai-risk-classification").statusGroup, "指引");
  assert.equal(byId.get("eu-ai-omnibus-2026").statusGroup, "生效");
  assert.match(byId.get("nist-ai-rmf").status, /修訂中/);
  assert.match(byId.get("iso-iec-42001").effectiveDate, /自願採用/);
  assert.match(byId.get("taiwan-ai-risk-classification").structure, /20 子類型/);
});

test("every represented country has multiple researched instruments", async () => {
  const regulations = await readRegulations();
  const countryCounts = regulations.reduce((counts, regulation) => {
    if (regulation.jurisdiction !== "國際標準") {
      counts.set(regulation.jurisdiction, (counts.get(regulation.jurisdiction) ?? 0) + 1);
    }
    return counts;
  }, new Map());

  for (const [country, count] of countryCounts) {
    assert.ok(count >= 2, `${country} has only ${count} researched instrument`);
  }

  for (const country of ["加拿大", "澳洲", "巴西", "印度"]) {
    assert.ok(countryCounts.has(country), `missing newly researched jurisdiction: ${country}`);
  }
});

test("researched instruments link to official primary sources", async () => {
  const regulations = await readJson("data/regulations-research.json");
  const officialHosts = [
    "digital-strategy.ec.europa.eu",
    "eur-lex.europa.eu",
    "cac.gov.cn",
    "meti.go.jp",
    "msit.go.kr",
    "law.go.kr",
    "ey.gov.tw",
    "fsc.gov.tw",
    "pdpc.gov.sg",
    "imda.gov.sg",
    "ico.org.uk",
    "gov.uk",
    "nist.gov",
    "whitehouse.gov",
    "tbs-sct.canada.ca",
    "canada.ca",
    "industry.gov.au",
    "digital.gov.au",
    "planalto.gov.br",
    "camara.leg.br",
    "pib.gov.in",
    "meity.gov.in",
    "iso.org",
    "oecd.org",
  ];

  for (const regulation of regulations) {
    const hostname = new URL(regulation.sourceUrl).hostname.replace(/^www\./, "");
    assert.ok(
      officialHosts.some((host) => hostname === host || hostname.endsWith(`.${host}`)),
      `${regulation.id} does not use an approved official source: ${hostname}`,
    );
  }
});

test("legislative proposals are not presented as enacted law", async () => {
  const regulations = await readRegulations();
  const brazilBill = regulations.find((regulation) => regulation.id === "brazil-ai-bill-2338");
  assert.equal(brazilBill.statusGroup, "草案");
  assert.match(brazilBill.effectiveDate, /尚未生效/);
});

test("regulatory updates are sorted newest first", async () => {
  const updates = await readJson("data/updates.json");
  const dates = updates.map((update) => update.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("regulatory updates contain actionable compliance analysis", async () => {
  const updates = await readJson("data/updates.json");
  assert.ok(updates.length >= 13);

  const updateIds = new Set(updates.map((update) => update.id));
  for (const id of [
    "brazil-anpd-ai-sandbox-consultation-2026",
    "canada-ai-transparency-consultation-2026",
    "korea-ai-decree-amendment-effective-2026",
    "australia-ai-framework-office-2026",
  ]) {
    assert.ok(updateIds.has(id), `missing current regulatory update: ${id}`);
  }

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

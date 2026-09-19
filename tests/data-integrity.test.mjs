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
    "council-of-europe-ai-framework-convention",
  ]) {
    assert.ok(byId.has(id), `missing ${id}`);
  }

  assert.equal(byId.get("nist-ai-rmf").statusGroup, "指引");
  assert.equal(byId.get("iso-iec-42001").statusGroup, "指引");
  assert.equal(byId.get("taiwan-ai-risk-classification").statusGroup, "指引");
  assert.equal(byId.get("eu-ai-omnibus-2026").statusGroup, "生效");
  assert.equal(byId.get("council-of-europe-ai-framework-convention").statusGroup, "尚未生效");
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
    "gazette.nat.gov.tw",
    "fsc.gov.tw",
    "moda.gov.tw",
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
    "coe.int",
    "samr.gov.cn",
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

test("Korean decree includes inserted articles and cumulative safety criteria", async () => {
  const regulations = await readRegulations();
  const decree = regulations.find((regulation) => regulation.id === "korea-ai-enforcement-decree");
  assert.match(decree.promulgationDate, /2026-01-21（制定）/);
  assert.match(decree.articleCount, /39 條本則/);
  assert.match(decree.articleCount, /6 條增訂/);
  assert.ok(decree.keyPoints.some((point) => /同時符合.*10\^26 FLOP.*最先進.*廣泛重大風險/.test(point)));
  assert.ok(decree.keyPoints.some((point) => /保存 5 年/.test(point)));
  const sourceUrl = new URL(decree.sourceUrl);
  assert.equal(sourceUrl.pathname, "/LSW/lsInfoP.do");
  assert.equal(sourceUrl.searchParams.get("lsId"), "015032");
});

test("regulatory updates are sorted newest first", async () => {
  const updates = await readJson("data/updates.json");
  const dates = updates.map((update) => update.date);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test("September guidance and REDATA preserve status, dates and conditional benefits", async () => {
  const regulations = await readRegulations();
  const byId = new Map(regulations.map((regulation) => [regulation.id, regulation]));
  const taiwan = byId.get("taiwan-frontier-ai-cybersecurity-policy");
  const uk = byId.get("uk-ai-risk-management-toolkit");
  const brazil = byId.get("brazil-redata-ai-datacenter-law-2026");

  assert.equal(taiwan.statusGroup, "指引");
  assert.equal(taiwan.promulgationDate, "2026-09-04");
  assert.match(taiwan.articleCount, /3 頁.*7 項/);
  assert.match(taiwan.transition, /不得推定/);
  assert.equal(uk.statusGroup, "指引");
  assert.equal(uk.promulgationDate, "2026-09-08");
  assert.match(uk.articleCount, /9 節.*4 附錄/);
  assert.match(uk.scope, /不是.*新企業 AI 法/);
  assert.equal(brazil.statusGroup, "生效");
  assert.match(brazil.articleCount, /^5 條/);
  assert.match(brazil.promulgationDate, /2026-09-15.*DOU 號外/);
  assert.match(brazil.effectiveDate, /2026-09-15.*資格核准/);
  assert.match(brazil.nextDeadline, /2026-12-31.*IPI/);
  assert.ok(brazil.keyPoints.some((point) => /產品價值的 2%.*不是營收/.test(point)));
  assert.ok(brazil.keyPoints.some((point) => /五年.*2026-12-31.*不可/.test(point)));

  const updates = await readJson("data/updates.json");
  for (const [id, date] of [
    ["taiwan-frontier-ai-cybersecurity-policy-2026", "2026-09-04"],
    ["uk-ai-risk-management-toolkit-2026", "2026-09-08"],
    ["brazil-redata-ai-datacenter-law-2026", "2026-09-15"],
  ]) {
    const update = updates.find((entry) => entry.id === id);
    assert.equal(update.date, date, `${id} must use its publication date`);
  }
  assert.equal(byId.size, regulations.length, "duplicate regulation id");
  assert.equal(new Set(updates.map((entry) => entry.id)).size, updates.length, "duplicate update id");
});

test("Canadian agentic AI guide preserves public-sector scope and operational controls", async () => {
  const regulations = await readRegulations();
  const guide = regulations.find((regulation) => regulation.id === "canada-agentic-ai-use-guide");

  assert.equal(guide.statusGroup, "指引");
  assert.match(guide.promulgationDate, /2026-09-15.*官方頁面日期/);
  assert.match(guide.effectiveDate, /非一般企業法律/);
  assert.match(guide.articleCount, /6 節.*2 項.*13 組/);
  assert.match(guide.scope, /聯邦部門.*供應商.*不創設普遍法定義務/);
  assert.ok(guide.keyPoints.some((point) => /唯讀.*唯一代理身分/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /狀態變更.*人工覆核/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /外部.*指令.*停用機制/.test(point)));

  const updates = await readJson("data/updates.json");
  const update = updates.find((entry) => entry.id === "canada-agentic-ai-use-guide-2026");
  assert.equal(update.date, "2026-09-15");
  assert.equal(update.verifiedAt, "2026-09-20");
  assert.match(update.businessImpact, /不是一般私人企業新法/);
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

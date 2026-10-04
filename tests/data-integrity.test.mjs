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
    "moh.gov.sg",
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
    "gov.br",
    "pib.gov.in",
    "meity.gov.in",
    "iso.org",
    "oecd.org",
    "coe.int",
    "samr.gov.cn",
    "cas.go.jp",
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

test("China AI trustworthiness standard preserves recommended status and official structure", async () => {
  const regulations = await readRegulations();
  const standard = regulations.find(
    (regulation) => regulation.id === "china-ai-trustworthiness-general-rules-gbt-47507",
  );

  assert.equal(standard.statusGroup, "指引");
  assert.equal(standard.type, "推薦性國家標準");
  assert.equal(standard.promulgationDate, "2026-04-30");
  assert.match(standard.effectiveDate, /2026-08-01.*非強制法規/);
  assert.match(standard.articleCount, /23 頁.*5 章.*20 項.*18 類/);
  assert.match(standard.structure, /28 項術語.*20 項.*附錄 A/);
  assert.match(standard.transition, /沒有法定.*獨立罰則/);
  assert.ok(standard.keyPoints.some((point) => /不要求所有系統.*20 項/.test(point)));
  assert.ok(standard.keyPoints.some((point) => /推薦性國家標準.*不得.*強制義務/.test(point)));
  assert.equal(
    new URL(standard.sourceUrl).hostname,
    "openstd.samr.gov.cn",
  );
  assert.equal(standard.verifiedAt, "2026-09-21");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "china-ai-trustworthiness-standard-gbt47507-2026",
  );
  assert.equal(update.date, "2026-08-01");
  assert.equal(update.verifiedAt, "2026-09-21");
  assert.match(update.businessImpact, /推薦性而非強制性/);
});

test("China open-source model platform standard preserves recommended status and official scope", async () => {
  const regulations = await readRegulations();
  const standard = regulations.find(
    (regulation) => regulation.id === "china-open-source-model-platform-gbt-48110",
  );

  assert.equal(standard.statusGroup, "指引");
  assert.equal(standard.type, "推薦性國家標準");
  assert.equal(standard.promulgationDate, "2026-08-28");
  assert.match(standard.effectiveDate, /2026-12-01.*非強制法規/);
  assert.match(standard.articleCount, /不適用.*不以法條編號.*未揭示頁數/);
  assert.match(standard.structure, /平台管理.*開源資料集管理.*開源模型管理.*貢獻者服務.*開發者服務/);
  assert.match(standard.scope, /規劃、建設、運行與維護/);
  assert.match(standard.transition, /沒有獨立罰則.*不能取代/);
  assert.ok(standard.keyPoints.some((point) => /推薦性國家標準.*不得.*強制法規/.test(point)));
  assert.ok(standard.keyPoints.some((point) => /資料與模型來源.*開源授權.*內容標識/.test(point)));
  assert.equal(new URL(standard.sourceUrl).hostname, "std.samr.gov.cn");
  assert.equal(standard.verifiedAt, "2026-09-23");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "china-open-source-model-platform-standard-2026",
  );
  assert.equal(update.date, "2026-08-28");
  assert.equal(update.verifiedAt, "2026-09-23");
  assert.match(update.businessImpact, /推薦性 GB\/T.*不會.*自行產生罰鍰/);
});

test("OECD responsible AI due diligence guide preserves voluntary status and six-step scope", async () => {
  const regulations = await readRegulations();
  const guide = regulations.find(
    (regulation) => regulation.id === "oecd-responsible-ai-due-diligence-guidance-2026",
  );

  assert.equal(guide.statusGroup, "指引");
  assert.match(guide.type, /自願性/);
  assert.match(guide.promulgationDate, /2026-02-19.*2026-05/);
  assert.match(guide.effectiveDate, /自願性指引/);
  assert.match(guide.articleCount, /61 頁.*2 章.*6 步驟.*17.*7 表/);
  assert.match(guide.scope, /AI 輸入供應商.*設計.*開發.*下游組織/);
  assert.match(guide.transition, /不能單獨.*法律合規藍圖/);
  assert.ok(guide.keyPoints.some((point) => /造成、促成或直接連結/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /國家聯絡點.*最終聲明/.test(point)));
  assert.equal(new URL(guide.sourceUrl).hostname, "www.oecd.org");
  assert.equal(guide.verifiedAt, "2026-09-22");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "oecd-responsible-ai-due-diligence-guidance-2026",
  );
  assert.equal(update.date, "2026-02-19");
  assert.equal(update.verifiedAt, "2026-09-22");
  assert.match(update.businessImpact, /不會自行產生罰鍰/);
  assert.match(update.businessImpact, /國家聯絡點/);
});

test("UK Google Search AI measures preserve final and draft legal status", async () => {
  const regulations = await readRegulations();
  const requirement = regulations.find(
    (regulation) => regulation.id === "uk-google-search-publisher-ai-conduct-requirement",
  );

  assert.equal(requirement.statusGroup, "即將生效");
  assert.equal(requirement.promulgationDate, "2026-06-03");
  assert.match(requirement.effectiveDate, /2026-12-03.*2027-03-03/);
  assert.match(requirement.articleCount, /9 項.*5 頁.*47 頁/);
  assert.match(requirement.scope, /直接受規範者.*Google.*出版者.*不.*直接義務主體/);
  assert.match(requirement.transition, /2030-10-10/);
  assert.ok(requirement.keyPoints.some((point) => /Gemini Assistant.*Vertex AI API/.test(point)));
  assert.ok(requirement.keyPoints.some((point) => /不得.*降權/.test(point)));
  assert.equal(requirement.verifiedAt, "2026-09-24");

  const updates = await readJson("data/updates.json");
  const consultation = updates.find(
    (entry) => entry.id === "uk-cma-ai-search-user-choice-consultation-2026",
  );
  assert.equal(consultation.date, "2026-09-23");
  assert.equal(consultation.verifiedAt, "2026-09-24");
  assert.match(consultation.keyDate, /2026-10-09 17:00/);
  assert.match(consultation.summary, /AI 助理.*仍在諮詢.*尚未/);
  assert.match(consultation.whatChanged, /18 段.*6 個月.*尚未正式施加/);
  assert.match(consultation.businessImpact, /不得把草案當作已生效義務/);
});

test("Singapore healthcare AI guide preserves sector scope and non-statutory status", async () => {
  const regulations = await readRegulations();
  const guide = regulations.find(
    (regulation) => regulation.id === "singapore-healthcare-ai-guidelines-2",
  );

  assert.equal(guide.statusGroup, "指引");
  assert.match(guide.promulgationDate, /2026-03-10.*2026-03-13/);
  assert.match(guide.effectiveDate, /沒有獨立法定生效日/);
  assert.match(guide.articleCount, /42 頁.*10 章.*7 項.*3 類/);
  assert.match(guide.scope, /Clinical.*Clinical-Ops.*Ops.*IMDA/);
  assert.match(guide.transition, /不能取代.*Health Products Act.*PDPA/);
  assert.ok(guide.keyPoints.some((point) => /Clinical.*Clinical-Ops.*人類監督/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /紅隊測試.*RAG/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /AI-MD.*SaMD.*HSA 註冊/.test(point)));
  assert.equal(guide.verifiedAt, "2026-09-26");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "singapore-healthcare-ai-guidelines-2-2026",
  );
  assert.equal(update.date, "2026-03-10");
  assert.equal(update.verifiedAt, "2026-09-26");
  assert.match(update.businessImpact, /不是獨立強制法規.*不能.*替代證明/);
});

test("Brazil human-research AI guide preserves voluntary status and MARIAH controls", async () => {
  const regulations = await readRegulations();
  const guide = regulations.find(
    (regulation) => regulation.id === "brazil-inaep-ai-human-research-ethics-guide-2026",
  );

  assert.equal(guide.statusGroup, "指引");
  assert.equal(guide.promulgationDate, "2026-09-25");
  assert.match(guide.effectiveDate, /不具獨立法律拘束力/);
  assert.match(guide.articleCount, /指南 41 頁.*10 章.*參考手冊 159 頁.*MARIAH 57 頁.*6 部/);
  assert.match(guide.scope, /人類研究.*企業供應商.*不是一般企業 AI 法/);
  assert.match(guide.transition, /六個月.*自行決定.*不能取代/);
  assert.ok(guide.keyPoints.some((point) => /低、普通、高及關鍵四級.*累加/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /質化 A 版.*5 個.*量化 B 版.*7 個.*275／304/.test(point)));
  assert.ok(guide.keyPoints.some((point) => /人類監督.*實際否決/.test(point)));
  assert.equal(new URL(guide.sourceUrl).hostname, "www.gov.br");
  assert.equal(guide.verifiedAt, "2026-09-29");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "brazil-inaep-ai-human-research-guide-2026",
  );
  assert.equal(update.date, "2026-09-25");
  assert.equal(update.verifiedAt, "2026-09-29");
  assert.match(update.summary, /四級風險.*並非新法/);
  assert.match(update.businessImpact, /不具拘束力.*自主採用.*不會排除/);
  assert.match(update.keyDate, /固定起迄日.*尚待官方公告/);
});

test("EU copyright consultation and Brazil AI child-safety law preserve legal status", async () => {
  const regulations = await readRegulations();
  const brazil = regulations.find(
    (regulation) => regulation.id === "brazil-ai-child-sexual-violence-law-15487-2026",
  );

  assert.equal(brazil.statusGroup, "生效");
  assert.match(brazil.promulgationDate, /2026-08-06.*2026-08-07.*DOU/);
  assert.match(brazil.effectiveDate, /2026-08-07.*立即生效/);
  assert.match(brazil.articleCount, /7 條.*5 部/);
  assert.match(brazil.scope, /真實或虛構.*AI.*一般模型.*不.*當然負刑責/);
  assert.match(brazil.transition, /沒有另設企業過渡期.*嚴格責任/);
  assert.ok(brazil.keyPoints.some((point) => /第 241-C 條.*3 至 5 年/.test(point)));
  assert.ok(brazil.keyPoints.some((point) => /第 241-D 條.*三分之一至三分之二/.test(point)));
  assert.ok(brazil.keyPoints.some((point) => /48 小時.*證據保管鏈/.test(point)));
  assert.equal(new URL(brazil.sourceUrl).hostname, "www.planalto.gov.br");
  assert.equal(brazil.verifiedAt, "2026-09-30");

  const updates = await readJson("data/updates.json");
  const brazilUpdate = updates.find(
    (entry) => entry.id === "brazil-ai-child-sexual-violence-law-15487-2026",
  );
  assert.equal(brazilUpdate.date, "2026-08-07");
  assert.equal(brazilUpdate.verifiedAt, "2026-09-30");
  assert.match(brazilUpdate.businessImpact, /並非.*一般嚴格責任.*分別核對/);

  const euConsultation = updates.find(
    (entry) => entry.id === "eu-copyright-generative-ai-targeted-consultation-2026",
  );
  assert.equal(euConsultation.date, "2026-09-29");
  assert.equal(euConsultation.verifiedAt, "2026-09-30");
  assert.match(euConsultation.summary, /只是諮詢.*不是新法或新增義務/);
  assert.match(euConsultation.keyDate, /2026-11-03.*尚未決定/);
  assert.match(euConsultation.whatChanged, /生成式 AI.*表演者仿冒.*研究領域著作權/);
  assert.match(euConsultation.businessImpact, /沒有立即改變.*不能當作已通過/);
  assert.equal(
    new URL(euConsultation.sourceUrl).hostname,
    "digital-strategy.ec.europa.eu",
  );
});

test("Taiwan AI impact assessments 2.0 preserve non-binding status and scoring limits", async () => {
  const regulations = await readRegulations();
  const reports = regulations.find(
    (regulation) => regulation.id === "taiwan-ai-child-human-rights-gender-impact-assessments-2-2026",
  );

  assert.equal(reports.statusGroup, "指引");
  assert.match(reports.promulgationDate, /2026-09-30.*1157001574/);
  assert.match(reports.effectiveDate, /不創設獨立法律義務/);
  assert.match(reports.articleCount, /52 頁.*50 頁.*49 頁.*18 項/);
  assert.match(reports.transition, /沒有重做.*問卷.*不是政府政策決定或行政承諾/);
  assert.match(reports.scope, /不是強制檢核表.*一般企業 AI 法/);
  assert.ok(reports.keyPoints.some((point) => /18\.62/.test(point)));
  assert.ok(reports.keyPoints.some((point) => /19\.11/.test(point)));
  assert.ok(reports.keyPoints.some((point) => /19\.52/.test(point)));
  assert.ok(reports.keyPoints.some((point) => /不是法律上的風險分類.*不能.*直接比較/.test(point)));
  assert.equal(new URL(reports.sourceUrl).hostname, "moda.gov.tw");
  assert.equal(reports.verifiedAt, "2026-10-01");

  const updates = await readJson("data/updates.json");
  const update = updates.find((entry) => entry.id === "taiwan-ai-impact-assessments-2-2026");
  assert.equal(update.date, "2026-09-30");
  assert.equal(update.verifiedAt, "2026-10-01");
  assert.match(update.summary, /非拘束性政策評估.*不是新法或強制風險分級/);
  assert.match(update.businessImpact, /不創設法律義務.*現行.*仍須逐案適用/);
});

test("EU KIDS Act proposal preserves draft status and AI child-safety obligations", async () => {
  const regulations = await readRegulations();
  const proposal = regulations.find((regulation) => regulation.id === "eu-kids-act-proposal-2026");

  assert.equal(proposal.statusGroup, "草案");
  assert.match(proposal.promulgationDate, /2026-09-17.*COM\(2026\) 681.*2026\/0286/);
  assert.match(proposal.effectiveDate, /尚未生效.*第 43 條.*6 個月/);
  assert.match(proposal.articleCount, /43 條.*9 章.*99 頁/);
  assert.match(proposal.transition, /2026-11-26.*議會與理事會審議.*第 5 條.*6 個月.*12 個月.*不得當作現行法/);
  assert.match(proposal.scope, /AI 伴侶.*一般對話式聊天機器人.*境外.*微型及小型企業.*沒有一般豁免/);
  assert.ok(proposal.keyPoints.some((point) => /情感依賴.*先前對話預設不得/.test(point)));
  assert.ok(proposal.keyPoints.some((point) => /上市.*前.*評估.*上市後監測/.test(point)));
  assert.ok(proposal.keyPoints.some((point) => /不得自動啟用.*不得鼓勵.*隨時.*退出/.test(point)));
  assert.ok(proposal.keyPoints.some((point) => /2026-11-26.*不是法規生效日/.test(point)));
  assert.ok(proposal.keyPoints.some((point) => /仍待.*審議.*不得.*已生效/.test(point)));
  assert.match(proposal.nextDeadline, /2026-11-26.*公開意見截止.*布魯塞爾時間午夜.*尚無確定生效/);
  assert.equal(new URL(proposal.sourceUrl).hostname, "eur-lex.europa.eu");
  assert.equal(proposal.verifiedAt, "2026-10-03");

  const updates = await readJson("data/updates.json");
  const update = updates.find((entry) => entry.id === "eu-kids-act-ai-child-safety-proposal-2026");
  assert.equal(update.date, "2026-09-17");
  assert.equal(update.verifiedAt, "2026-10-02");
  assert.match(update.summary, /43 條.*尚未生效/);
  assert.match(update.businessImpact, /小微企業沒有全面豁免.*不能先當作已生效法/);

  const consultation = updates.find(
    (entry) => entry.id === "eu-kids-act-feedback-consultation-2026",
  );
  assert.equal(consultation.date, "2026-10-02");
  assert.equal(consultation.verifiedAt, "2026-10-03");
  assert.match(consultation.keyDate, /2026-11-26.*布魯塞爾時間午夜.*沒有因此產生法規生效日/);
  assert.match(consultation.summary, /公開回饋.*仍未通過或生效/);
  assert.match(consultation.businessImpact, /沒有讓 KIDS Act 成為現行法.*有限期.*政策參與窗口/);
  assert.equal(new URL(consultation.sourceUrl).hostname, "digital-strategy.ec.europa.eu");
});

test("Japan AI regulatory-barrier request preserves its consultation-only status", async () => {
  const regulations = await readRegulations();
  const act = regulations.find((regulation) => regulation.id === "japan-ai-act");

  assert.equal(act.statusGroup, "生效");
  assert.equal(act.articleCount, "28 條");
  assert.match(act.effectiveDate, /2025-06-04.*2025-09-01.*全面/);
  assert.match(act.transition, /2026-10-02.*政策資訊募集.*不會暫停現行法律.*直接新增企業義務/);
  assert.match(act.nextDeadline, /2026-10-19.*2026-10-30 17:00.*資訊募集/);
  assert.ok(act.keyPoints.some((point) => /LLM.*多模態.*代理式.*實體 AI.*不是修法或合規豁免/.test(point)));
  assert.equal(act.verifiedAt, "2026-10-04");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "japan-ai-regulatory-barriers-information-request-2026",
  );
  assert.equal(update.date, "2026-10-02");
  assert.equal(update.verifiedAt, "2026-10-04");
  assert.match(update.keyDate, /2026-10-19.*2026-10-30 17:00/);
  assert.match(update.summary, /政策研究.*不是修法、豁免或新企業義務/);
  assert.match(update.businessImpact, /不會暫停現行法.*保證修法.*安全港/);
  assert.equal(new URL(update.sourceUrl).hostname, "www8.cao.go.jp");
});

test("Japan generative-AI IP code remains voluntary and preserves its public scope", async () => {
  const regulations = await readRegulations();
  const code = regulations.find(
    (regulation) => regulation.id === "japan-generative-ai-ip-transparency-principles-code-2026",
  );

  assert.equal(code.statusGroup, "指引");
  assert.match(code.status, /已發布.*自願接受/);
  assert.match(code.promulgationDate, /2026-08-25.*2026-09-08/);
  assert.match(code.effectiveDate, /自願採用.*2026-10-26/);
  assert.match(code.articleCount, /無條文.*4 部分.*3 項原則.*408KB/);
  assert.match(code.transition, /comply or explain.*沒有法定過渡期、罰則或強制揭露.*2026-10-26/);
  assert.match(code.scope, /公眾.*境外業者.*日本.*單一法人或個人.*不在定義內/);
  assert.ok(code.keyPoints.some((point) => /原則一.*網站.*任何人可閱覽/.test(point)));
  assert.ok(code.keyPoints.some((point) => /原則二.*訴訟、調停、ADR.*URL/.test(point)));
  assert.ok(code.keyPoints.some((point) => /comply or explain.*不強制揭露營業秘密.*不能把守則誤標為法定義務或政府認證/.test(point)));
  assert.match(code.nextDeadline, /2026-10-26.*通報開始.*尚未設定截止日/);
  assert.equal(new URL(code.sourceUrl).hostname, "www.cas.go.jp");
  assert.equal(code.verifiedAt, "2026-10-05");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "japan-generative-ai-ip-transparency-principles-code-notice-2026",
  );
  assert.equal(update.date, "2026-09-08");
  assert.equal(update.verifiedAt, "2026-10-05");
  assert.match(update.keyDate, /2026-08-25.*2026-09-08.*2026-10-26.*尚無截止日/);
  assert.match(update.summary, /comply or explain.*自願接受.*沒有罰則.*不是著作權法修正或政府合規認證/);
  assert.match(update.businessImpact, /未接受本身不是違法.*不等於著作權合規安全港/);
});

test("US terminology order preserves statutory scope and historical documents", async () => {
  const regulations = await readRegulations();
  const order = regulations.find(
    (regulation) => regulation.id === "us-super-intelligence-terminology-executive-order-2026",
  );

  assert.equal(order.statusGroup, "生效");
  assert.equal(order.promulgationDate, "2026-09-29");
  assert.match(order.effectiveDate, /2026-09-29.*行政機關/);
  assert.equal(order.articleCount, "4 節");
  assert.match(order.transition, /非法律文件.*不要求改寫既有法規.*60 日/);
  assert.match(order.scope, /15 U\.S\.C\. § 9401\(3\).*不自行修正.*不直接對一般私人企業/);
  assert.match(order.nextDeadline, /2026-11-28.*60 日/);
  assert.ok(order.keyPoints.some((point) => /SI.*既有 AI 法定定義.*不能.*推定.*擴張/.test(point)));
  assert.ok(order.keyPoints.some((point) => /不創設.*私人.*權利.*一般私人企業/.test(point)));
  assert.equal(new URL(order.sourceUrl).hostname, "www.whitehouse.gov");
  assert.equal(order.verifiedAt, "2026-10-02");

  const updates = await readJson("data/updates.json");
  const update = updates.find(
    (entry) => entry.id === "us-super-intelligence-terminology-executive-order-2026",
  );
  assert.equal(update.date, "2026-09-29");
  assert.equal(update.verifiedAt, "2026-10-02");
  assert.match(update.summary, /不改寫既有法規、契約或補助.*未直接新增私人企業義務/);
  assert.match(update.businessImpact, /不是新的產品安全.*罰鍰制度/);
});

test("ISO 27090 remains under publication and NIST TEVV retains its historical name", async () => {
  const regulations = await readRegulations();
  const iso = regulations.find(
    (regulation) => regulation.id === "iso-iec-27090-ai-cybersecurity-under-publication-2026",
  );
  const nist = regulations.find((regulation) => regulation.id === "nist-ai-200-2-tevv-athlon");

  assert.equal(iso.statusGroup, "草案");
  assert.match(iso.status, /Stage 60\.00.*尚未正式發布/);
  assert.match(iso.promulgationDate, /2026-08-19.*Stage 60\.00.*2026-10/);
  assert.match(iso.effectiveDate, /尚未發布.*自願採用/);
  assert.match(iso.articleCount, /尚未公開.*未揭示.*頁數.*章節/);
  assert.match(iso.transition, /最長可能需 7 週.*尚未到 Stage 60\.60.*不能標示為已發布/);
  assert.ok(iso.keyPoints.some((point) => /資料投毒.*模型竊取/.test(point)));
  assert.ok(iso.keyPoints.some((point) => /Stage 60\.00.*尚未登錄 Stage 60\.60 正式發布/.test(point)));
  assert.equal(new URL(iso.sourceUrl).hostname, "committee.iso.org");
  assert.equal(iso.verifiedAt, "2026-10-02");

  assert.match(nist.transition, /2026-10-01.*Super Intelligence.*不要求改寫既有歷史文件/);
  assert.equal(nist.verifiedAt, "2026-10-02");

  const updates = await readJson("data/updates.json");
  const isoUpdate = updates.find(
    (entry) => entry.id === "iso-iec-27090-ai-cybersecurity-under-publication-2026",
  );
  assert.equal(isoUpdate.date, "2026-08-19");
  assert.equal(isoUpdate.verifiedAt, "2026-10-02");
  assert.match(isoUpdate.summary, /Stage 60\.00.*Under development.*不得宣稱已依最終標準合規/);
  assert.match(isoUpdate.businessImpact, /不能.*27090 認證.*自願性指引/);

  const nistUpdate = updates.find((entry) => entry.id === "nist-tevv-athlon-draft-2026");
  assert.equal(nistUpdate.verifiedAt, "2026-10-02");
  assert.match(nistUpdate.whatChanged, /2026-10-01.*不要求改寫既有歷史文件/);
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

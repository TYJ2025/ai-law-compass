"use client";

import { useMemo, useState } from "react";
import researchRegulationsData from "@/data/regulations-research.json";
import regulationsData from "@/data/regulations.json";
import updatesData from "@/data/updates.json";

type Regulation =
  | (typeof regulationsData)[number]
  | (typeof researchRegulationsData)[number];
type RegulatoryUpdate = (typeof updatesData)[number];

const jurisdictionOrder = [
  "歐盟",
  "臺灣",
  "中國",
  "日本",
  "韓國",
  "新加坡",
  "印度",
  "英國",
  "美國",
  "加拿大",
  "巴西",
  "澳洲",
  "國際標準",
];

const jurisdictionFlags: Record<string, string> = {
  歐盟: "🇪🇺",
  臺灣: "🇹🇼",
  中國: "🇨🇳",
  日本: "🇯🇵",
  韓國: "🇰🇷",
  新加坡: "🇸🇬",
  印度: "🇮🇳",
  英國: "🇬🇧",
  美國: "🇺🇸",
  加拿大: "🇨🇦",
  巴西: "🇧🇷",
  澳洲: "🇦🇺",
  國際標準: "🌐",
};

const regulations = [
  ...regulationsData,
  ...researchRegulationsData,
].sort((left, right) => {
  const jurisdictionDifference =
    jurisdictionOrder.indexOf(left.jurisdiction) -
    jurisdictionOrder.indexOf(right.jurisdiction);

  if (jurisdictionDifference !== 0) return jurisdictionDifference;
  if (right.priority !== left.priority) return right.priority - left.priority;
  return left.title.localeCompare(right.title, "zh-Hant");
}) as Regulation[];
const updates = updatesData as RegulatoryUpdate[];
const latestVerifiedAt = [...regulations, ...updates]
  .map((item) => item.verifiedAt)
  .sort((left, right) => right.localeCompare(left))[0];
const AS_OF = new Date(latestVerifiedAt + "T00:00:00+08:00");

const regionSignals = [
  { name: "亞太", region: "亞太", tone: "critical", note: "基本法、平台規則與產業指引並行" },
  { name: "歐洲", region: "歐洲", tone: "high", note: "AI Act 與資料、資安規範交疊" },
  { name: "北美", region: "北美", tone: "watch", note: "聯邦框架、採購與地方立法並行" },
  { name: "拉丁美洲", region: "拉丁美洲", tone: "high", note: "巴西資料法與 AI 法案並進" },
  { name: "大洋洲", region: "大洋洲", tone: "watch", note: "企業指南與政府強制政策分流" },
  { name: "國際標準", region: "國際", tone: "quiet", note: "ISO 與 OECD 支援治理互通" },
].map((signal) => ({
  ...signal,
  count: regulations.filter((item) => item.region === signal.region).length,
}));

const deadlineItems = [
  {
    jurisdiction: "歐盟",
    flag: "EU",
    title: "AI Act 多數條款適用",
    date: "2026-08-02",
    kind: "法定期限",
  },
  {
    jurisdiction: "美國・科羅拉多州",
    flag: "US",
    title: "ADMT 主要義務開始適用",
    date: "2027-01-01",
    kind: "生效準備",
  },
  {
    jurisdiction: "韓國",
    flag: "KR",
    title: "至少一年寬限期檢查點",
    date: "2027-01-22",
    kind: "主管機關政策",
  },
];

function formatDate(date: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date + "T00:00:00"));
}

function formatVerificationDate(date: string) {
  return new Intl.DateTimeFormat("zh-TW", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date + "T00:00:00+08:00"));
}

function deadlineLabel(date: string) {
  const target = new Date(date + "T00:00:00+08:00");
  const days = Math.ceil((target.getTime() - AS_OF.getTime()) / 86_400_000);
  if (days < 0) return "已過 " + Math.abs(days) + " 天";
  if (days === 0) return "今天";
  return days + " 天後";
}

function statusClass(statusGroup: string) {
  if (statusGroup === "生效") return "status-live";
  if (statusGroup === "即將生效") return "status-soon";
  if (statusGroup === "草案") return "status-draft";
  return "status-guidance";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("全部地區");
  const [regionFilter, setRegionFilter] = useState("全部區域");
  const [status, setStatus] = useState("全部狀態");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("eu-ai-act");
  const [watched, setWatched] = useState<string[]>([
    "eu-ai-act",
    "korea-ai-basic-act",
    "taiwan-ai-basic-act",
  ]);
  const [readUpdates, setReadUpdates] = useState<string[]>([]);
  const [expandedUpdate, setExpandedUpdate] = useState<string | null>(
    "eu-ai-act-enforcement-2026",
  );

  const jurisdictions = useMemo(
    () => ["全部地區", ...Array.from(new Set(regulations.map((item) => item.jurisdiction)))],
    [],
  );

  const jurisdictionQuickFilters = useMemo(
    () =>
      jurisdictions.slice(1).map((name) => ({
        count: regulations.filter((item) => item.jurisdiction === name).length,
        flag: jurisdictionFlags[name] ?? "⚑",
        name,
      })),
    [jurisdictions],
  );

  const filteredRegulations = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return regulations.filter((item) => {
      const searchable = [
        item.title,
        item.titleEn,
        item.jurisdiction,
        item.summary,
        item.detailedOverview,
        item.scope,
        item.articleCount,
        item.structure,
        item.transition,
        item.keyPoints.join(" "),
        item.action,
        item.sectors.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return (
        (!normalizedQuery || searchable.includes(normalizedQuery)) &&
        (jurisdiction === "全部地區" || item.jurisdiction === jurisdiction) &&
        (regionFilter === "全部區域" || item.region === regionFilter) &&
        (status === "全部狀態" || item.statusGroup === status) &&
        (!priorityOnly || item.priority >= 4)
      );
    });
  }, [jurisdiction, priorityOnly, query, regionFilter, status]);

  const selectJurisdiction = (nextJurisdiction: string) => {
    setJurisdiction(nextJurisdiction);
    setRegionFilter("全部區域");
  };

  const selectRegion = (nextRegion: string) => {
    setRegionFilter((current) =>
      current === nextRegion ? "全部區域" : nextRegion,
    );
    setJurisdiction("全部地區");
  };

  const toggleWatch = (id: string) => {
    setWatched((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  const toggleRead = (id: string) => {
    setReadUpdates((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">AL</span>
          <span>
            <strong>AI LAW</strong>
            <small>COMPASS</small>
          </span>
        </div>

        <nav className="side-nav" aria-label="主要導覽">
          <a className="active" href="#overview">
            <span>⌂</span> 監管總覽
          </a>
          <a href="#updates">
            <span>↗</span> 最新動態
            <b>{updates.length}</b>
          </a>
          <a href="#regulations">
            <span>▤</span> 全球法規庫
          </a>
          <a href="#deadlines">
            <span>◷</span> 期限雷達
          </a>
        </nav>

        <div className="side-section">
          <p>我的工作區</p>
          <div className="side-stat">
            <span>追蹤中</span>
            <strong>{watched.length}</strong>
          </div>
          <div className="side-stat">
            <span>高優先文件</span>
            <strong>{regulations.filter((item) => item.priority >= 4).length}</strong>
          </div>
        </div>

        <div className="source-health">
          <div className="health-head">
            <span>官方來源狀態</span>
            <strong>正常</strong>
          </div>
          <div className="health-bar">
            <i />
          </div>
          <small>
            {new Set(regulations.map((item) => item.jurisdiction)).size} 個司法管轄區／治理體系 ·
            {latestVerifiedAt.replaceAll("-", "/")} 查核 · 每 3 日更新
          </small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p>企業法遵情報中心 · 資料更新日期</p>
            <strong>{formatVerificationDate(latestVerifiedAt)}</strong>
          </div>
          <div className="top-actions">
            <button className="icon-button" aria-label="通知">
              <span className="notification-dot" />
              ◉
            </button>
            <div className="avatar" aria-label="法遵團隊帳號">
              CT
            </div>
          </div>
        </header>

        <div className="content">
          <section className="hero" id="overview">
            <div className="hero-copy">
              <span className="eyebrow">
                <i /> Regulatory intelligence
              </span>
              <h1>
                全球 AI 法規，
                <br />
                <em>一個清楚的法遵視角。</em>
              </h1>
              <p>
                從官方原文到可執行摘要，快速辨識適用範圍、重大義務與下一個期限。
              </p>
              <div className="hero-metrics">
                <div>
                  <strong>{regulations.length}</strong>
                  <span>已查核文件</span>
                </div>
                <div>
                  <strong>{updates.length}</strong>
                  <span>近期監管動態</span>
                </div>
                <div>
                  <strong>100%</strong>
                  <span>官方來源連結</span>
                </div>
              </div>
            </div>

            <div className="signal-panel">
              <div className="panel-kicker">
                <span>全球監管訊號</span>
                <small>LIVE SIGNAL</small>
              </div>
              <div className="signal-grid">
                {regionSignals.map((signal) => {
                  const isActive = regionFilter === signal.region;
                  return (
                    <a
                      aria-current={isActive ? "true" : undefined}
                      aria-label={`${isActive ? "取消" : "查看"}${signal.name}監管訊號，共 ${signal.count} 筆法規`}
                      className={"signal-row " + (isActive ? "active" : "")}
                      href="#regulations"
                      key={signal.name}
                      onClick={() => selectRegion(signal.region)}
                    >
                      <i className={"signal-dot " + signal.tone} />
                      <span className="signal-copy">
                        <strong>{signal.name}</strong>
                        <small>{signal.note}</small>
                      </span>
                      <span className="signal-row-action">
                        <b>{signal.count}</b>
                        <i aria-hidden="true">↘</i>
                      </span>
                    </a>
                  );
                })}
              </div>
              <div className="signal-note">
                <span>!</span>
                <p>
                  <strong>EU AI Act 關鍵適用節點已到</strong>
                  建議立即確認系統分類與文件缺口。
                </p>
              </div>
            </div>
          </section>

          <section className="command-bar" aria-label="法規搜尋與篩選">
            <label className="search-box">
              <span>⌕</span>
              <input
                aria-label="搜尋法規、國家或義務"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="搜尋法規、司法管轄區、產業或義務…"
                type="search"
                value={query}
              />
              <kbd>⌘ K</kbd>
            </label>
            <select
              aria-label="司法管轄區"
              onChange={(event) => selectJurisdiction(event.target.value)}
              value={jurisdiction}
            >
              {jurisdictions.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <select
              aria-label="法規狀態"
              onChange={(event) => setStatus(event.target.value)}
              value={status}
            >
              <option>全部狀態</option>
              <option>生效</option>
              <option>即將生效</option>
              <option>草案</option>
              <option>指引</option>
            </select>
            <button
              aria-pressed={priorityOnly}
              className={"priority-toggle " + (priorityOnly ? "selected" : "")}
              onClick={() => setPriorityOnly((current) => !current)}
            >
              <span>◆</span> 高優先
            </button>
          </section>

          <div className="dashboard-grid">
            <section className="updates-card" id="updates">
              <div className="section-heading">
                <div>
                  <span className="section-index">01</span>
                  <h2>最新監管動態</h2>
                  <p>只收錄對企業法遵有行動意義的官方更新</p>
                </div>
                <span className="verified-badge">
                  已查核至 {latestVerifiedAt.replaceAll("-", "/")} · 每 3 日更新
                </span>
              </div>

              <div className="updates-list">
                {updates.map((update) => {
                  const isRead = readUpdates.includes(update.id);
                  const isExpanded = expandedUpdate === update.id;
                  return (
                    <article
                      className={
                        "update-item " +
                        (isRead ? "is-read " : "") +
                        (isExpanded ? "is-expanded" : "")
                      }
                      key={update.id}
                    >
                      <div className="update-date">
                        <strong>{new Date(update.date).getDate()}</strong>
                        <span>
                          {new Intl.DateTimeFormat("en", { month: "short" })
                            .format(new Date(update.date))
                            .toUpperCase()}
                        </span>
                      </div>
                      <div className="update-body">
                        <div className="update-meta">
                          <span className="flag-code">{update.flag}</span>
                          <span>{update.jurisdiction}</span>
                          <i>•</i>
                          <span>{update.category}</span>
                          <b className={"importance importance-" + update.importance}>
                            {update.importance}影響
                          </b>
                        </div>
                        <h3>{update.title}</h3>
                        <p className="update-summary">{update.summary}</p>
                        <div className="update-facts">
                          <div>
                            <span>主管機關</span>
                            <strong>{update.authority}</strong>
                          </div>
                          <div>
                            <span>重要日期</span>
                            <strong>{update.keyDate}</strong>
                          </div>
                        </div>
                        <div className="impact-line">
                          <span>企業影響</span>
                          <p>{update.businessImpact}</p>
                        </div>
                        <div className="action-line">
                          <span>建議行動</span>
                          <p>{update.action}</p>
                        </div>
                      </div>
                      <div className="update-links">
                        <a href={update.sourceUrl} rel="noreferrer" target="_blank">
                          官方原文 ↗
                        </a>
                        <button
                          aria-expanded={isExpanded}
                          className="analysis-toggle"
                          onClick={() => setExpandedUpdate(isExpanded ? null : update.id)}
                        >
                          {isExpanded ? "收合法遵分析 −" : "完整法遵分析 +"}
                        </button>
                        <button onClick={() => toggleRead(update.id)}>
                          {isRead ? "設為未讀" : "標記已讀"}
                        </button>
                      </div>
                      {isExpanded && (
                        <div className="update-analysis">
                          <div className="update-analysis-grid">
                            <section>
                              <span>事件背景</span>
                              <p>{update.background}</p>
                            </section>
                            <section>
                              <span>具體變更</span>
                              <p>{update.whatChanged}</p>
                            </section>
                          </div>
                          <section className="affected-scope">
                            <span>主要影響對象</span>
                            <p>{update.affectedCompanies}</p>
                          </section>
                          <section className="update-key-points">
                            <span>法遵判讀重點</span>
                            <ul>
                              {update.keyPoints.map((point) => (
                                <li key={point}>{point}</li>
                              ))}
                            </ul>
                          </section>
                          <p className="update-verified">
                            本站最後查核：{update.verifiedAt} · 內容以官方原文為準
                          </p>
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>
            </section>

            <aside className="deadlines-card" id="deadlines">
              <div className="section-heading compact">
                <div>
                  <span className="section-index">02</span>
                  <h2>期限雷達</h2>
                </div>
                <span className="radar-icon">◉</span>
              </div>

              <div className="deadline-list">
                {deadlineItems.map((deadline, index) => (
                  <div className="deadline-item" key={deadline.title}>
                    <div className="timeline">
                      <i className={index === 0 ? "urgent" : ""} />
                      {index < deadlineItems.length - 1 && <span />}
                    </div>
                    <div className="deadline-content">
                      <div>
                        <span className="flag-code">{deadline.flag}</span>
                        <small>{deadline.kind}</small>
                      </div>
                      <h3>{deadline.title}</h3>
                      <p>{deadline.jurisdiction}</p>
                      <div className="deadline-date">
                        <strong>{formatDate(deadline.date)}</strong>
                        <b className={index === 0 ? "overdue" : ""}>
                          {deadlineLabel(deadline.date)}
                        </b>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="calendar-note">
                <span>i</span>
                <p>
                  期限依官方公告整理。寬限期不等同法定生效日，仍應保留準備時程。
                </p>
              </div>
            </aside>
          </div>

          <section className="regulations-section" id="regulations">
            <div className="section-heading">
              <div>
                <span className="section-index">03</span>
                <h2>全球法規庫</h2>
                <p>
                  {regionFilter === "全部區域"
                    ? `顯示 ${filteredRegulations.length} / ${regulations.length} 筆已查核資料；涵蓋法律、施行細則、監管指引與國際標準`
                    : `監管訊號篩選：${regionSignals.find((signal) => signal.region === regionFilter)?.name}；顯示 ${filteredRegulations.length} / ${regulations.length} 筆資料`}
                </p>
              </div>
              <div className="legend">
                <span><i className="legend-live" />已生效</span>
                <span><i className="legend-soon" />即將生效</span>
                <span><i className="legend-draft" />審議中</span>
                <span><i className="legend-guide" />監管指引</span>
              </div>
            </div>

            <nav className="jurisdiction-quick-filter" aria-label="依國家快速篩選法規">
              <div className="jurisdiction-filter-intro">
                <span>國家快捷選單</span>
                <small>點選國旗查看法規</small>
              </div>
              <div className="jurisdiction-filter-list" role="group" aria-label="國家與治理體系">
                <button
                  aria-label={`顯示全部 ${regulations.length} 筆法規`}
                  aria-pressed={jurisdiction === "全部地區"}
                  className={
                    "jurisdiction-filter-button " +
                    (jurisdiction === "全部地區" ? "active" : "")
                  }
                  onClick={() => selectJurisdiction("全部地區")}
                  type="button"
                >
                  <span className="jurisdiction-flag" aria-hidden="true">🗺️</span>
                  <span className="jurisdiction-filter-name">全部</span>
                  <span className="jurisdiction-filter-count">{regulations.length}</span>
                </button>
                {jurisdictionQuickFilters.map((item) => {
                  const isSelected = jurisdiction === item.name;
                  return (
                    <button
                      aria-label={`${isSelected ? "取消" : "顯示"}${item.name}法規，共 ${item.count} 筆`}
                      aria-pressed={isSelected}
                      className={
                        "jurisdiction-filter-button " + (isSelected ? "active" : "")
                      }
                      key={item.name}
                      onClick={() =>
                        selectJurisdiction(isSelected ? "全部地區" : item.name)
                      }
                      type="button"
                    >
                      <span className="jurisdiction-flag" aria-hidden="true">{item.flag}</span>
                      <span className="jurisdiction-filter-name">{item.name}</span>
                      <span className="jurisdiction-filter-count">{item.count}</span>
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="reg-table">
              <div className="reg-row reg-head" aria-hidden="true">
                <span>司法管轄區／法規</span>
                <span>狀態</span>
                <span>風險</span>
                <span>下一節點</span>
                <span>追蹤</span>
              </div>

              {filteredRegulations.map((regulation) => {
                const isExpanded = expanded === regulation.id;
                const isWatched = watched.includes(regulation.id);
                return (
                  <article className={"reg-entry " + (isExpanded ? "expanded" : "")} key={regulation.id}>
                    <button
                      aria-expanded={isExpanded}
                      className="reg-row reg-main"
                      onClick={() => setExpanded(isExpanded ? null : regulation.id)}
                    >
                      <span className="reg-title">
                        <i className="flag-code">{regulation.flag}</i>
                        <span>
                          <strong>{regulation.jurisdiction}</strong>
                          <b>{regulation.title}</b>
                          <small>{regulation.titleEn}</small>
                        </span>
                      </span>
                      <span>
                        <i className={"status-pill " + statusClass(regulation.statusGroup)}>
                          {regulation.status}
                        </i>
                      </span>
                      <span>
                        <i className={"risk-pill risk-" + regulation.risk}>{regulation.risk}</i>
                      </span>
                      <span className="next-date">
                        <strong>{regulation.nextDeadline}</strong>
                        <small>{regulation.type}・{regulation.articleCount}</small>
                      </span>
                      <span className="row-actions">
                        <i
                          aria-label={isWatched ? "追蹤中" : "未追蹤"}
                          className={isWatched ? "watching" : ""}
                          role="img"
                        >
                          {isWatched ? "★" : "☆"}
                        </i>
                        <b>{isExpanded ? "−" : "+"}</b>
                      </span>
                    </button>

                    {isExpanded && (
                      <div className="reg-details">
                        <div className="law-facts" aria-label="法規基本資料">
                          <div>
                            <span>公布／發布日</span>
                            <strong>{regulation.promulgationDate}</strong>
                          </div>
                          <div>
                            <span>生效／適用日</span>
                            <strong>{regulation.effectiveDate}</strong>
                          </div>
                          <div>
                            <span>條文數量</span>
                            <strong>{regulation.articleCount}</strong>
                          </div>
                          <div>
                            <span>文件結構</span>
                            <strong>{regulation.structure}</strong>
                          </div>
                        </div>

                        <div className="detail-section">
                          <span className="detail-label">法遵摘要</span>
                          <p>{regulation.summary}</p>
                        </div>
                        <div className="detail-section">
                          <span className="detail-label">建議行動</span>
                          <p>{regulation.action}</p>
                        </div>

                        <div className="detail-section detail-wide">
                          <span className="detail-label">適用範圍</span>
                          <p>{regulation.scope}</p>
                        </div>

                        <div className="detail-section detail-wide">
                          <span className="detail-label">規範全貌</span>
                          <p>{regulation.detailedOverview}</p>
                        </div>

                        <div className="key-points detail-wide">
                          <span className="detail-label">法規重點</span>
                          <ol>
                            {regulation.keyPoints.map((point) => (
                              <li key={point}>{point}</li>
                            ))}
                          </ol>
                        </div>

                        <div className="transition-note detail-wide">
                          <span className="detail-label">期限／過渡安排</span>
                          <p>{regulation.transition}</p>
                        </div>

                        <div className="detail-meta">
                          <p>
                            <span>主管機關</span>
                            <strong>{regulation.authority}</strong>
                          </p>
                          <p>
                            <span>適用產業</span>
                            <strong>{regulation.sectors.join("、")}</strong>
                          </p>
                          <p>
                            <span>最後查核</span>
                            <strong>{regulation.verifiedAt}</strong>
                          </p>
                        </div>
                        <div className="detail-actions">
                          <button
                            className={isWatched ? "watch-button active" : "watch-button"}
                            onClick={(event) => {
                              event.stopPropagation();
                              toggleWatch(regulation.id);
                            }}
                          >
                            {isWatched ? "★ 已加入追蹤" : "☆ 加入追蹤"}
                          </button>
                          <a href={regulation.sourceUrl} rel="noreferrer" target="_blank">
                            開啟官方原文 ↗
                          </a>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })}

              {filteredRegulations.length === 0 && (
                <div className="empty-state">
                  <strong>找不到符合條件的法規</strong>
                  <p>請嘗試清除搜尋文字或放寬篩選條件。</p>
                </div>
              )}
            </div>
          </section>

          <footer>
            <div className="footer-brand">
              <span className="brand-mark small">AL</span>
              <p>
                <strong>AI Law Compass</strong>
                全球 AI 法規情報
              </p>
            </div>
            <p className="disclaimer">
              本站內容為監管情報整理，不構成法律意見。重大決策請諮詢合格法律專業人士。
            </p>
            <a
              href="https://github.com/TYJ2025/ai-law-compass"
              rel="noreferrer"
              target="_blank"
            >
              資料版本由 GitHub 管理 ↗
            </a>
          </footer>
        </div>
      </main>
    </div>
  );
}

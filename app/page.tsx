"use client";

import { useMemo, useState } from "react";
import regulationsData from "@/data/regulations.json";
import updatesData from "@/data/updates.json";

type Regulation = (typeof regulationsData)[number];
type RegulatoryUpdate = (typeof updatesData)[number];

const regulations = regulationsData as Regulation[];
const updates = updatesData as RegulatoryUpdate[];
const AS_OF = new Date("2026-08-05T00:00:00+08:00");

const regionSignals = [
  { name: "亞太", count: 5, tone: "critical", note: "基本法與生成式 AI 執法加速" },
  { name: "歐洲", count: 2, tone: "high", note: "EU AI Act 進入主要適用期" },
  { name: "北美", count: 1, tone: "watch", note: "州法與聯邦政策持續變動" },
  { name: "其他地區", count: 0, tone: "quiet", note: "待擴充官方資料來源" },
];

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
  return "status-guidance";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [jurisdiction, setJurisdiction] = useState("全部地區");
  const [status, setStatus] = useState("全部狀態");
  const [priorityOnly, setPriorityOnly] = useState(false);
  const [expanded, setExpanded] = useState<string | null>("eu-ai-act");
  const [watched, setWatched] = useState<string[]>([
    "eu-ai-act",
    "korea-ai-basic-act",
    "taiwan-ai-basic-act",
  ]);
  const [readUpdates, setReadUpdates] = useState<string[]>([]);

  const jurisdictions = useMemo(
    () => ["全部地區", ...Array.from(new Set(regulations.map((item) => item.jurisdiction)))],
    [],
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
        (status === "全部狀態" || item.statusGroup === status) &&
        (!priorityOnly || item.priority >= 4)
      );
    });
  }, [jurisdiction, priorityOnly, query, status]);

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
            <span>高優先法規</span>
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
          <small>8 個司法管轄區 · 2026/08/05 查核</small>
        </div>
      </aside>

      <main>
        <header className="topbar">
          <div>
            <p>企業法遵情報中心</p>
            <strong>星期三，2026 年 8 月 5 日</strong>
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
                  <span>已查核法規</span>
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
                {regionSignals.map((region) => (
                  <div className="signal-row" key={region.name}>
                    <i className={"signal-dot " + region.tone} />
                    <div>
                      <strong>{region.name}</strong>
                      <small>{region.note}</small>
                    </div>
                    <b>{region.count}</b>
                  </div>
                ))}
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
              onChange={(event) => setJurisdiction(event.target.value)}
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
                <span className="verified-badge">已查核至 2026/08/04</span>
              </div>

              <div className="updates-list">
                {updates.slice(0, 5).map((update) => {
                  const isRead = readUpdates.includes(update.id);
                  return (
                    <article className={"update-item " + (isRead ? "is-read" : "")} key={update.id}>
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
                        <p>{update.summary}</p>
                        <div className="action-line">
                          <span>建議行動</span>
                          <p>{update.action}</p>
                        </div>
                      </div>
                      <div className="update-links">
                        <a href={update.sourceUrl} rel="noreferrer" target="_blank">
                          官方原文 ↗
                        </a>
                        <button onClick={() => toggleRead(update.id)}>
                          {isRead ? "設為未讀" : "標記已讀"}
                        </button>
                      </div>
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
                  顯示 {filteredRegulations.length} / {regulations.length} 筆已查核資料
                </p>
              </div>
              <div className="legend">
                <span><i className="legend-live" />已生效</span>
                <span><i className="legend-soon" />即將生效</span>
                <span><i className="legend-guide" />監管指引</span>
              </div>
            </div>

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

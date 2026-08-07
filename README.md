# AI Law Compass

面向企業法遵團隊的全球 AI 法規與監管情報 Dashboard。

正式網站：https://tyj2025.github.io/ai-law-compass/

## 目前功能

- 全球 AI 法規摘要、狀態、風險與官方原文
- 38 筆已查核文件，涵蓋 13 個國家／治理體系；每個國家至少 2 筆
- 法律、施行細則、主管機關指引、產業規範與國際標準分層整理
- 最新監管更新與建議行動
- 重要生效日期與寬限期追蹤
- 關鍵字、司法管轄區、狀態與優先級篩選
- GitHub Pages 自動部署

## 本機開發

需要 Node.js 22 或更新版本。

    npm install
    npm run dev

## 資料維護

核心法規資料位於 `data/regulations.json`，擴充研究資料位於
`data/regulations-research.json`，最新消息位於 `data/updates.json`。
新增資料必須使用官方原始來源，更新摘要時同步修改查核日期；測試會檢查資料完整性、
官方來源、草案狀態，以及任何國家不得只剩單一文件。

    npm test
    npm run build

## GitHub Pages

推送到 main 後，.github/workflows/deploy-pages.yml 會驗證資料、建立靜態網站並部署。
首次使用請在 repository 的 Settings → Pages → Source 選擇 GitHub Actions。

> 本專案提供監管情報整理，不構成法律意見。

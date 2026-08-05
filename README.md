# AI Law Compass

面向企業法遵團隊的全球 AI 法規與監管情報 Dashboard。

正式網站：https://tyj2025.github.io/ai-law-compass/

## 目前功能

- 全球 AI 法規摘要、狀態、風險與官方原文
- 最新監管更新與建議行動
- 重要生效日期與寬限期追蹤
- 關鍵字、司法管轄區、狀態與優先級篩選
- GitHub Pages 自動部署

## 本機開發

需要 Node.js 22 或更新版本。

    npm install
    npm run dev

## 資料維護

法規資料位於 data/regulations.json，最新消息位於
data/updates.json。請優先使用官方來源，更新摘要時同步修改查核日期。

    npm test
    npm run build

## GitHub Pages

推送到 main 後，.github/workflows/deploy-pages.yml 會驗證資料、建立靜態網站並部署。
首次使用請在 repository 的 Settings → Pages → Source 選擇 GitHub Actions。

> 本專案提供監管情報整理，不構成法律意見。

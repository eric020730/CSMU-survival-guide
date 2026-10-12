# 中山生存指南

簡單記錄在中山這幾年值班、上班和生活的生存秘訣。

正式網址：https://eric020730.com/CSMU-survival-guide/

## 更新紀錄

- 網頁右上方「新增紀錄」：填好內容後前往 GitHub，確認並 Commit changes 到 main。
- 修改紀錄：開啟文章，按「在 GitHub 編輯」。
- 直接新增檔案：在 `content/` 新增 Markdown，格式見 [content/README.md](content/README.md)。
- 也可以把真實經驗提供給 Codex，請它整理並推送。

網頁表單的草稿保存在目前瀏覽器，不是雲端紀錄。提交至 GitHub 並通過發佈後才會出現在正式網站。
網頁不會生成未提供的經驗。初始文章為空。

## 本機

需要 Node.js 24。

```sh
npm ci
npm test
npm run build
npm run dev
```

本機網址：http://127.0.0.1:4173/CSMU-survival-guide/

## 部署

GitHub Actions 驗證 Markdown、產生靜態網站並發佈 GitHub Pages。
Cloudflare Worker 將個人網域的 `/CSMU-survival-guide` 和 `/CSMU-survival-guide/*` 代理到此 Pages 網站。其他網域路徑不會受影響。

文章更新只需 GitHub 權限，不需 Cloudflare 金鑰。
只有路由代理本身有修改時，需由已登入 Cloudflare 的開發環境執行：

```sh
npm run deploy:route
```

`version.json` 提供目前網站 commit，作為部署驗收依據。

設計使用原生 CSS、系統繁體中文字型、單一綠色重點色與自動明暗模式；不需圖片或外部字型即可閱讀。

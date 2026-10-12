# 中山生存指南

簡單記錄在中山這幾年值班、上班和生活的生存秘訣。

正式網址：https://eric020730.com/CSMU-survival-guide/

## 更新紀錄

- 網頁右上方「新增紀錄」：填好內容後前往 GitHub，確認並 Commit changes 到 main。
- 修改紀錄：開啟文章，按「在 GitHub 編輯」。
- 直接新增檔案：在 `content/` 新增 Markdown，格式見 [content/README.md](content/README.md)。
- 也可以把真實經驗提供給 Codex，請它整理並推送。

撰寫頁可切換閱讀預覽，也能用按鈕加入小標題與條列。日期、摘要與標籤放在選填區。

網頁表單的草稿保存在目前瀏覽器，不是雲端紀錄。新版會沿用原有草稿。未填完標題或內容也能下載備份，備份檔會標記 `draft: true`，不會意外發佈。提交至 GitHub 並通過發佈後才會出現在正式網站。

分類與搜尋條件保存在網址中，方便分享或重新開啟。文章有閱讀目錄、標籤搜尋與約略閱讀時間，預設為暖白底淺色，不跟隨系統。可在頁尾手動選擇淺色或深色；之後會記住手動選擇。
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

設計使用原生 HTML/CSS、系統繁體中文字型、暖白／深色底與少量綠色提示。視覺規範與驗收原則見 [DESIGN.md](DESIGN.md)。

建置以 esbuild 打包瀏覽器程式；Markdown 預覽採用 marked 與 DOMPurify，會在開啟預覽時才載入。正式文章仍在建置時使用 sanitize-html 處理。Phosphor 圖示以本機 SVG 提供，授權位於 `public/icons/LICENSE`。

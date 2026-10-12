# 新增生存筆記

每篇紀錄放在這個目錄的一個 `.md` 檔案中，檔名使用英文、數字及連字號，例如 `night-shift-bag.md`。

```markdown
---
title: 你的紀錄標題
category: 值班
date: 2026-10-12
tags: [交班, 隨身物品]
summary: 一句話說明這篇紀錄。
---

在這裡寫你的真實經驗。

## 重點

- 第一個重點
- 第二個重點
```

分類可以是「值班」、「上班」或「生活」。日期用 YYYY-MM-DD。
提交到 main 後，GitHub Actions 自動發佈到個人網域。
`README.md` 不會被當成文章。草稿可加上 `draft: true`，不會發佈。

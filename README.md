# flight-monitor-web

可直接部署 Netlify 的航班即時查詢頁面。

## 你會得到
- 前端頁面（輸入航班編號查詢）
- Netlify Function 代理（避免在前端暴露 API key）
- 可選每 60 秒自動更新

## 1) 部署到 Netlify
1. 把 `flight-monitor-web` 資料夾推到 GitHub
2. 在 Netlify 匯入該 repo
3. Build 設定：
   - Publish directory: `public`
   - Functions directory: `netlify/functions`

## 2) 設定環境變數
在 Netlify Site settings → Environment variables 新增：
- `AVIATIONSTACK_API_KEY` = 你的 aviationstack key

## 3) 完成
部署後打開網站，輸入航班編號（例：`CI100`）即可查詢。

## 注意
- 目前資料源是 aviationstack（免費方案可能有更新延遲）
- 若你要「回報推播」（Telegram/LINE），我可以再幫你補 Netlify Scheduled Function 版本

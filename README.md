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

## 推播版（已內建）

新增了 `netlify/functions/check-flights.js`：
- 每 15 分鐘排程檢查航班
- 當狀態符合異常條件時推播到 LINE
- 也可手動觸發檢查

### 需要新增的環境變數
- `AVIATIONSTACK_API_KEY`：aviationstack key
- `TRACKED_FLIGHTS`：要追蹤的航班，逗號分隔（例：`CI100,BR55`）
- `ALERT_STATUSES`：要告警的狀態（預設：`delayed,cancelled,diverted,incident`）
- `LINE_CHANNEL_ACCESS_TOKEN`：LINE Messaging API channel access token
- `LINE_TO`：接收通知的 LINE userId（U 開頭）或群組/聊天室 id
- `TEST_PUSH`：手動測試開關（`1`=即使無異常也推播一次）

### 手動測試推播
部署完成後可直接開：
- `https://<你的網域>/.netlify/functions/check-flights`

若有異常狀態且 Telegram 參數正確，就會收到訊息。

## 注意
- 目前資料源是 aviationstack（免費方案可能有更新延遲）
- 排程函數預設每 15 分鐘檢查一次

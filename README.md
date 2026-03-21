# TradeJournal PRO — Web App

React web version of TradeJournal PRO, connecting to the existing API at `https://trading-api-9trn.onrender.com`.

## Pages
- **Login** — authentication with device ID
- **Dashboard** — stats, cumulative P&L chart, recent trades
- **P&L Chart** — cumulative chart, monthly bars, session/market breakdown
- **Trades** — full table with filters, edit, delete, pagination
- **Add Trade** — complete form with market selector, image upload
- **Capital Archive** — manage capitals, add/deactivate/delete
- **Withdraw** — withdraw from capital + history
- **Manage Users** (admin) — add/delete/block users, license management
- **Activity Logs** (admin) — searchable log feed
- **Activations** (admin) — approve/reject activation requests
- **Password Resets** (admin) — handle reset requests
- **My Profile** — avatar upload, security questions
- **Update Password** — change password

## Run Locally

```bash
npm install
npm start
```
Opens at http://localhost:3000

## Deploy to Render.com (Free)

1. Push this folder to a GitHub repository
2. Go to https://render.com → New → Static Site
3. Connect your GitHub repo
4. Set:
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `build`
5. Click **Create Static Site**
6. Done! Render gives you a free URL like `https://tradejournal-web.onrender.com`

## API
All requests go to `https://trading-api-9trn.onrender.com` — no backend changes needed.

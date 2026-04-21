# TradeJournal PRO — Web App v2.0

## Quick Start

```bash
npm install
npm start        # dev server at http://localhost:3000
npm run build    # production build → /build folder
```

## Project Structure

```
src/
├── App.jsx                      # Routing (landing / auth / app)
├── index.js                     # Entry point
├── index.css                    # Full design system + landing styles
│
├── context/
│   └── AuthContext.jsx          # Auth + subscription state
│
├── services/
│   └── api.js                   # All API calls (BASE_URL configurable)
│
├── components/
│   ├── Sidebar.jsx              # Navigation + pack badge + expiry
│   └── ExpiryBanner.jsx        # Warning banner when sub < 7 days
│
└── pages/
    ├── Landing.jsx              # 🆕 Public SaaS landing page
    ├── Register.jsx             # 🆕 Multi-step signup + payment
    ├── Login.jsx                # Login (updated)
    ├── StatusPages.jsx          # 🆕 EmailSent + BlockedPage
    ├── Subscriptions.jsx        # 🆕 Admin: manage user packs
    ├── Dashboard.jsx            # Existing — unchanged
    ├── Chart.jsx                # Existing — unchanged
    ├── Trades.jsx               # Existing — unchanged
    ├── AddTrade.jsx             # Existing — unchanged
    └── OtherPages.jsx          # Existing — unchanged
```

## Routing

| URL            | Who sees it          | What                          |
|----------------|----------------------|-------------------------------|
| `/`            | Not logged in        | Landing page                  |
| `/`            | Logged in            | Dashboard (app)               |
| `/login`       | Not logged in        | Login form                    |
| `/register`    | Not logged in        | Register + payment flow       |
| `/email-sent`  | Anyone               | "Check your inbox" page       |
| `/chart`       | Logged in            | P&L Chart                     |
| `/trades`      | Logged in            | Trade journal                 |
| `/add-trade`   | Logged in            | Add new trade                 |
| `/capital`     | Logged in            | Capital archive               |
| `/withdraw`    | Logged in            | Withdrawals                   |
| `/subscriptions` | Admin only         | Manage user packs             |
| `/users`       | Admin only           | User management               |
| `/logs`        | Admin only           | Activity logs                 |
| `/activations` | Admin only           | Device activations            |

## Subscription Packs

| Pack      | Price  | Duration  | Access Level |
|-----------|--------|-----------|--------------|
| `trial`   | Free   | 24 hours  | Full app     |
| `6months` | $50    | 6 months  | Full app     |
| `1year`   | $100   | 1 year    | Full app     |
| `lifetime`| $300   | Forever   | Full app     |

## Expiry Logic

- **Admin** accounts: never blocked, no expiry banner
- **Users**: when subscription expires → `BlockedPage` (renew prompt)
- **Warning banner**: shown when ≤ 7 days left (dismissable)
- **Lifetime**: never expires, no banner shown

## Payment Methods (Registration)

- **Bank Card**: Visa / Mastercard form (integrate Stripe/PayPal on backend)
- **Crypto**:
  - Bitcoin (BTC)
  - USDT (TRC20)
  - Ethereum (ETH)

> ⚠️ Update crypto wallet addresses in `Register.jsx` → `CRYPTO_OPTIONS` array.

## Demo Video

In `Landing.jsx`, set the `VIDEO_URL` variable in the `VideoPlayer` component:
```js
const VIDEO_URL = 'https://www.youtube.com/embed/YOUR_VIDEO_ID';
```
Until set, it shows an animated dashboard preview instead.

---

## 🔴 Required New Backend Endpoints

Your existing API at `https://trading-api-9trn.onrender.com` needs these new endpoints:

### Registration & Email

```
POST /register
Body: { email, pack, payment_method, payment_crypto? }
→ Creates user, generates username+password, sends email
→ Returns: { success, message }
```

### Subscriptions (User)

```
GET /subscription/my
→ Returns: { data: { pack, expires_at, blocked } }
```

### Subscriptions (Admin)

```
GET  /admin/subscriptions
→ Returns: { data: { subscriptions: [...] } }

POST /admin/subscriptions
Body: { user_id, pack, payment_method }
→ Creates/assigns subscription
→ Returns: { success }

PUT  /admin/subscriptions/:id
Body: { pack }
→ Updates pack (auto-recalculates expires_at)
→ Returns: { success }

DELETE /admin/subscriptions/:id
→ Revokes subscription (blocks access)
→ Returns: { success }
```

### Expiry automation (cron job on backend)

Run a daily cron that:
1. Finds users whose `expires_at < NOW()`
2. Sets `blocked = true` on those users
3. Sends an email: "Your subscription expired. Renew at [link]"

---

## Existing Endpoints (unchanged)

All existing endpoints continue to work exactly as before:
- `POST /login`
- `GET /trades`, `POST /trades`, `PUT /trades/:id`, `DELETE /trades/:id`
- `GET /stats`, `GET /stats/chart`
- `GET /capital/current`, `POST /capital`
- `POST /withdraw`, `GET /withdraw`
- `GET /admin/users`, `POST /admin/users`, etc.
- `GET /admin/logs`, `GET /admin/activation-requests`
- `GET /profile`, `POST /change-password`

## API Base URL

Change in `src/services/api.js`:
```js
const BASE_URL = 'https://trading-api-9trn.onrender.com';
```

## Role Detection

The app reads `role` from the JWT payload automatically. Make sure your `/login`
response JWT includes `{ role: "admin" | "user" }` in the payload.

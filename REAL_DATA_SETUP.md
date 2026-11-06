# TikTok Spend Center real-data integration (draft)

This branch replaces the hard-coded demo data with requests to the existing Worker through Cloudflare Pages Functions. It does not alter Worker, D1, TikTok OAuth credentials, or historical rows.

## Required Pages production environment variables (add before enabling production)
- TIKTOK_WORKER_URL = https://tiktok-callback.vosquezshoats.workers.dev
- DASHBOARD_API_KEY = the existing Worker dashboard key (secret; never put in HTML or Git)
- DASHBOARD_PASSWORD = a password you choose for this dashboard
- SESSION_SECRET = a random secret of at least 32 characters

The Pages Functions implement an HttpOnly, Secure, SameSite=Strict 8-hour signed session cookie and proxy Worker requests using X-Dashboard-Key server-side.

## Before production
1. Deploy only to a preview branch first.
2. Set the four environment variables in Pages Preview environment (do not paste secrets into GitHub).
3. Test login/logout and confirm unauthenticated API requests return 401.
4. Confirm BC, account, currency, and spend values against Worker responses.
5. Only after explicit approval merge to main; main auto-deploys production.

The dashboard uses the Worker endpoints:
- GET /api/tiktok/business-centers
- GET /api/tiktok/business-center-accounts?bc_id=...
- GET /api/tiktok/daily-spend?start_date=YYYY-MM-DD&end_date=YYYY-MM-DD

No sync endpoint is called by the dashboard. It only reads existing data.

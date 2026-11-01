# Release preparation — configuration and acceptance gates

No deployment, remote migration, additional content publication or live-payment activation was performed in this checkpoint. Existing staging content remains intact. A completed local test is not hosted acceptance.

## Values and dashboards you need to configure

Put local app values in `.env.local`; put deployment values in the hosting environment secret settings. Never commit them or send secrets in chat. Public `NEXT_PUBLIC_*` values require a rebuild when changed.

| Variable | Value / source |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project → Connect / Project URL (`https://<project-ref>.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same project's publishable or legacy anon key from Settings → API Keys; **never** the secret/service-role key |
| `NEXT_PUBLIC_SITE_URL` | Exact app origin, locally `http://localhost:3000`; approved staging/production HTTPS origin when hosted |
| `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED` | `false` until Google provider configuration below is saved; `true` enables the existing Supabase OAuth button |
| `SUPABASE_SERVICE_ROLE_KEY` | Same project's server-only legacy service-role key; required by trusted billing and content scripts; never `NEXT_PUBLIC_*` |
| `PAYMENTS_ENABLED` | Keep `false` now. Set `true` only for a configured, approved test environment after billing SQL acceptance |
| `RAZORPAY_MODE` | `test` now. Test and live environments must use separate credentials and webhook secrets |
| `RAZORPAY_KEY_ID` | Razorpay Dashboard → **Test mode** → Account & Settings → API Keys → Generate Test Key (`rzp_test_…`) |
| `RAZORPAY_KEY_SECRET` | Secret downloaded/shown with that test key; server only |
| `RAZORPAY_WEBHOOK_SECRET` | A separately generated secret entered when creating that environment's webhook; server only, different from API secret |
| `RAZORPAY_LIVE_ENABLED` | Keep `false`. Requires a separate explicit approval before changing to `true`, along with live-mode keys and HTTPS |

Local approved-import tools additionally use `SUPABASE_DB_URL` (pooler connection URI) and `SUPABASE_DB_CA_FILE` (path to verified Supabase CA). They are **not** browser/deployment variables and the CLI does not automatically load `.env.local`.

### Google setup

1. In Google Cloud / Google Auth Platform, choose the Fast Sprint project. Configure Branding (app name, support/developer email), Audience and Data Access (`openid`, email, profile). If in Testing, add the two test Google accounts to Audience → Test users. Complete any branding/domain verification Google requests before public release.
2. Clients → Create client → **Web application**. Authorised JavaScript origins: `http://localhost:3000` and each actual approved staging/production origin. Do not guess a deployment domain.
3. Supabase → Authentication → Sign In / Providers → Google: copy the **Callback URL** displayed there. Add that exact `https://<project-ref>.supabase.co/auth/v1/callback` to Google's **Authorised redirect URIs**. This provider callback differs from the app callback.
4. Paste Google's **Client ID and Client Secret into Supabase's Google provider**, enable it and save. They do not belong in frontend `.env.local`.
5. Supabase → Authentication → URL Configuration: set the correct Site URL; allow `http://localhost:3000/auth/callback` and actual app staging/production `/auth/callback` URLs. Use localhost consistently; add 127.0.0.1 only if deliberately testing that separate origin. Keep production allowlists narrow.
6. Set `NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true`, restart/rebuild, then test consent, cancellation, callback, account profile creation, refresh, logout and re-login. Google OAuth remains unverified until this succeeds.

Supabase email: configure production SMTP/from-address, confirm-email settings, confirmation and recovery templates, rate limits and permitted redirects. Open PKCE confirmation/recovery links in the browser that initiated the request. The user must perform password entry/change; do not share passwords or recovery links.

### Razorpay setup and exact database proposal

1. Supply **test Key ID, test Key Secret and test Webhook Secret** securely in the environment above. Finish Razorpay business/KYC activation separately for live use. Configure automatic payment capture; authorised-only payments never activate Pro.
2. Review `supabase/proposals/billing.sql` before approving any application. It adds two tables: `payment_orders` (owner-read-only RLS) and `payment_events` (service-only), a per-account checkout-rate trigger (5 attempts/15 minutes), and a service-only `settle_payment` function. Settlement locks the order and account, records a receipt and grants an exact fixed-term pass **once** for a live-mode captured payment. Test-mode receipts never grant account Pro. It also replaces `grant_pro` with a compatible account-locking implementation to serialize manual/payment extensions and preserve non-expiring grants. No existing user/content rows are deleted. Existing 0001/0002 are not rerun.
3. Approval is still required to apply this proposal to staging, then run hosted two-account billing RLS and separate-session duplicate/concurrent settlement checks. It has only been exercised in isolated embedded PostgreSQL. The activity-history proposal is independent and also remains unapplied.
4. Create a Razorpay **test-mode** webhook at the approved public staging origin + `/api/billing/webhook`. Subscribe to `payment.captured` and `order.paid`. Set the test Webhook Secret above and enable delivery alerts. Localhost cannot receive provider deliveries; current Razorpay documentation also blacklists several common tunnels, including ngrok.io. Use an approved staging host or supported tunnel only with explicit approval.
5. After SQL/configuration acceptance, enable test checkout. Run success, cancellation, failure, delayed capture, duplicate callback/webhook, callback without webhook and webhook without callback, wrong-owner, wrong-amount and provider/API outage cases. Confirm no real Pro grant from test receipts. Test the live-entitlement transition only in a disposable local database fixture until separately authorised.
6. Refunds/chargebacks do not have automatic entitlement reconciliation in this checkpoint. Define the refund policy and a reviewed support/revocation procedure before accepting real money; implement and test automation if that policy requires it. Do not subscribe to refund events assuming this receiver revokes passes. Expired/unpaid/failed authorisations do not grant Pro. Unknown provider orders are retried rather than trusted.
7. Before any separately approved live activation: use distinct live keys, live webhook, production Supabase project, HTTPS origin, KYC, accurate support/terms/privacy/refund pages and captured-payment reconciliation. Confirm final prices ₹89/₹219/₹399, tax treatment and currency. App and SQL prices must change together if pricing changes.

Source contracts consulted: [Supabase Google OAuth](https://supabase.com/docs/guides/auth/social-sign-in/auth-google), [Razorpay Standard Checkout](https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/integration-steps), [webhook signature validation/testing](https://razorpay.com/docs/webhooks/validate-test).

## Tomorrow's test/deployment sequence

- [ ] Resolve Google and Razorpay test credentials/settings above; obtain explicit approval for the exact billing proposal. Durable-history SQL needs separate approval; without it streaks remain mutable snapshots.
- [ ] Review remaining resource gaps: A2Z still has 311 unresolved original URLs and 100 alias candidates awaiting semantic review; no unvalidated production import. Supplied aptitude/company/interview indexes are not complete verified answer banks. Development is a curated external curriculum, not an original hosted course.
- [ ] Approve each final content manifest hash before publication. Only Master 200 and NeetCode 150 have earlier approved staging publication. Keep all Pro descendants premium, including retired descendants on reimport. Verify public-clone/private-pack handoff: the five private manifests and Development curation scripts live in ignored backups, not GitHub; deploy approved content through the database or a private build input, never a public download.
- [ ] Hosted acceptance: two real accounts/Free vs Pro/expiry; checklist notes/bookmarks/filters; Sprint/app limits; calendar timezone and month navigation; activity-history behaviour if approved; recovery email/password update; Google login and session reopen.
- [ ] Razorpay test-mode checkout plus real provider webhook delivery and reconciliation. Review unsupported refund/chargeback workflow before paid launch. No production-ready claim until configured integration tests pass.
- [ ] Mobile/tablet/desktop keyboard and accessibility pass, empty/error states, screen-reader/contrast checks, loading/performance. Local preview smoke checks are not a full accessibility audit.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run content:validate:nested`, `npm run build`; review generated reports and clean Git diff. Back up and verify archive before release.
- [ ] With explicit deployment approval: configure hosting secrets (including **server-only** service-role key for billing), Supabase URLs/SMTP, security/error monitoring and billing alerts; deploy preview, repeat smoke/E2E, then approve production. Keep payments disabled until separately approved live acceptance. Record rollback commit and database backup; do not automatically roll back data by rerunning migrations.

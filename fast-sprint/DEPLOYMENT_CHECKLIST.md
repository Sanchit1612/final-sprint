# Public signup email

2026-11-05 staging update: Brevo custom SMTP is enabled in the existing staging Supabase project; the provider recorded the recovery-email test as Delivered. Supabase Site URL and exact-origin callback allowlist now include `https://fast-sprint-staging.netlify.app`; localhost entries remain. The deployed Google button reaches Google's chooser, but final matching-account callback and real signup confirmation await user acceptance. The verified Gmail sender is rewritten by Brevo to its shared domain; authenticate a dedicated domain before relying on public deliverability. Google remains in Testing mode. Checkout/live payments remain disabled, and no Razorpay secrets were uploaded to Netlify in this checkpoint.

Fast Sprint uses Supabase Auth to deliver signup confirmation, resend and password recovery. Configure a transactional SMTP provider in Supabase before inviting the public. Brevo Free is the proposed starting tier. Its published allowance is 300 emails per day. An authenticated sender domain provides the intended public From address and lets us verify sender identity. Brevo may substitute a shared sender domain when using an unauthenticated address.

1. In Brevo, verify the sender and authenticate the sending domain if available. Create a dedicated SMTP key under SMTP & API and note the SMTP login shown there.
2. In the Fast Sprint Supabase project under Authentication → Emails → SMTP settings, enable custom SMTP. Set host `smtp-relay.brevo.com`, port `587`, username to the Brevo SMTP login, password to the SMTP key and From name to `Fast Sprint`. Use the sender address verified in Brevo. Enter secrets in Supabase only.
3. Add the preview origin's callback to the Supabase redirect allowlist. Keep the existing local entries for local testing. Check the confirmation and recovery templates and turn off provider click tracking for authentication links.
4. On the HTTPS preview, use a fresh non-team inbox to verify signup, confirmation, resend and password recovery. Check the mail provider event log if delivery fails. The public launch gate is actual receipt and successful browser completion.

[Brevo Free limits](https://help.brevo.com/hc/en-us/articles/208580669-FAQs-What-are-the-limits-of-the-Free-plan) · [Brevo SMTP](https://help.brevo.com/hc/en-us/articles/7924908994450-Send-transactional-emails-using-Brevo-SMTP) · [Supabase custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp)

# Netlify preview handoff

Private build input: `npm run prebuild` restores only JSON data from the private staging Storage bucket `fast-sprint-builds` when `PRIVATE_CONTENT_SHA256` is configured. It downloads the immutable hash-named gzip using the server-only service key, verifies SHA256 before decoding, limits compressed/decompressed sizes, rejects unexpected paths, and places the files in existing server-side tracing paths. No resource files go in `public/` or public Git. Never set a `NEXT_PUBLIC_` prefix on the service key. A missing/invalid configured bundle fails the build. Public-clone builds without the hash remain possible without private packs.

Netlify secret scanning stays enabled. Only the intentionally public `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are approved omissions from value scanning. No service credential is excluded. Untrusted fork deploys must require approval before receiving project secrets.

Use the GitHub repository root with `fast-sprint` as the app base directory and `npm run build` as the build command. Keep the Next.js runtime enabled so middleware, server actions and payment webhooks run server-side. Start on a staging URL with staging Supabase credentials, test-only Razorpay settings and live payments disabled. Restore reviewed private company data through a private build input before enabling the company sheets.

At the preview URL, verify account redirects preserve the destination, Google consent returns to the same origin, auth cookies survive refresh, protected responses are private and uncached, and headers appear on deployed responses. Check keyboard use on the public mini mock and confirm Free and Pro see only the data they are entitled to see. Test payment capture, signature rejection and replay through the deployed HTTPS endpoint before offering paid access. Track remaining resource reviews separately from deploy acceptance.

2026-11-03 learning/mock update: assessment SQL is approved/applied to staging only; schema, two-account isolation, eight-session quota concurrency and disposable Free/Pro browser checks passed. See ASSESSMENTS_SQL_REVIEW.md and verification/*assessments*.json. Add server-only ASSESSMENTS_ENABLED=true only where the reviewed schema and hosted acceptance are complete; otherwise false. SUPABASE_SERVICE_ROLE_KEY is required for trusted quiz reservation/grading and own-user history. Public /system-design is dynamic for optional signed-in checklist state; /practice and /sql-practice require authentication. No automatic migration on deploy. Existing private company inputs must be restored privately for a production build. New original assessment datasets are versioned and need no content import.

Google Testing configuration and local Razorpay Test Mode keys now exist; older missing-key/approval entries below are superseded by PROGRESS.md. OAuth callback/session acceptance, capture/webhook acceptance, production SMTP, actual hosting callback allowlists and live business approval remain release gates. Do not deploy or enable live payments without explicit approval. The legacy A2Z “311 unresolved URLs” count below is historical: URLs have since been mapped, but semantic/source review is incomplete; do not treat mappings as fully verified.

2026-11-02 preparation-tools update: the exact reviewed preparation_tools.sql is approved/applied on the existing staging project only; hosted SQL-role RLS and signed-in Pro browser persistence checks passed. See PREPARATION_TOOLS_SQL_REVIEW.md and verification/staging-preparation-*.json. PREPARATION_TOOLS_ENABLED=true only on this approved local/staging setup. Keep false elsewhere until the two tables/eight policies/two triggers are reviewed, backed up, applied and tested there. Private company JSON inputs are needed by /companies and /analytics; preserve them via the private checkpoint ZIP. No production application, content publication, immutable activity-history SQL or deployment is authorized by this staging approval.

Current update2026-11-02: billing proposal has been approved/applied to staging only and SQL isolation/concurrency passed. Staging test-Pro gate enabled; application payments remain configuration-gated. Add server-only RAZORPAY_TEST_PRO_ENABLED=true only for approved staging test upgrades. Production DB must use mode live and allow_test_pro=false; live activation still requires explicit approval. Internal company sheets require private content/companies inputs; excluded from public Git. CS remains review-only at the user’s request. The older checklist below remains a release checklist, not evidence that production is configured.

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

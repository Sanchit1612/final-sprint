Staging status update: the exact proposal below was approved and applied on2026-11-02, with schema state preserved in ignored backups. Hosted catalog and disposable two-account/eight-session concurrency checks passed; see verification/staging-billing-schema.json and staging-billing-acceptance.json. Production and real provider acceptance remain unapproved/unverified.

# Billing proposal review — 2026-11-02

Current SQL SHA256: `366b776dad719191611e165d854e3fb32871087af76a68a6e9202e3a050ea372`. Proposal only; no hosted SQL has been run. Earlier unapplied draft is preserved privately in backups/billing-proposal-dbec6dc.sql. Existing migrations 0001/0002 are not edited or rerun.

## Exact changes

- Five new RLS-enabled tables: `billing_environment` (one mode/test-access gate), `payment_orders` (owner-only reads; no client writes), `payment_events` (minimal durable event receipts), `payment_disputes` (latest authenticated dispute state) and `billing_access_ledger` (baseline/manual/payment contributions). Internal tables are service-role-only. No full webhook payload, email/card/evidence data is stored.
- `checkout_rate` trigger and `limit_checkout_orders`: lock account row and cap checkout creation to 5/15 minutes; reject a mode mismatch with the DB environment.
- `billing_capture_baseline` snapshots the existing entitlement once. `billing_recompute` rebuilds access from legitimate baseline/manual/payment terms. The existing service-only `grant_pro` is replaced with the same public signature, using the ledger and profile lock. Existing table structure and historical user data are preserved.
- `settle_payment`: serialized receipts, unique payment/order binding, exact amount/currency/mode checks and optional staging test gate. `reconcile_payment`: monotonic processed-refund totals and ordered dispute snapshots. `process_payment` runs both in **one transaction**, including reversal-before-capture delivery. `record_payment_attempt` records failed/uncaptured attempts without granting access. `revoke_test_access` voids test-funded terms while preserving receipts and legitimate manual terms.
- All new mutating functions have browser/anon/PUBLIC execution revoked. Only service role can settle/reconcile/grant. Server code must verify provider signatures, order ownership and live API state before calling them.

## Access and reversal behaviour

Default test mode records receipts without upgrading accounts. Staging Pro acceptance requires BOTH database `allow_test_pro=true` and application `RAZORPAY_TEST_PRO_ENABLED=true`. Production must use a separate project with DB mode `live`, test gate false and live credentials; application live gate also defaults false. No automatic production mode switch exists.

A processed full refund removes only its payment-funded term. Multiple partial refunds accumulate; partial refunds are recorded and retain the term until the full price has been refunded (no invented time proration). An open/under-review dispute suspends its term; won restores it; lost removes it; closed remains withheld for operator review because closed does not establish who received the funds. Manual and other valid paid terms survive. Recomputing excludes reversed terms, so expiry can move earlier; the operator must disclose the refund policy before live checkout.

Unpaid authorisations, failed attempts and auto-refunds of uncaptured payments do not create access. A delayed capture is not downgraded by a later-arriving failure event. Duplicate receipts never extend a pass twice. Stale capture/partial events cannot undo a full refund. Older dispute events cannot replace newer state or reopen a terminal state automatically.

## Tests executed

Isolated embedded PostgreSQL: schema applies with existing 0001/0002; owner-only history; denied self-grant/settlement/internal reads; duplicate capture; amount/mode mismatch; default no test upgrade; double-gated staging test upgrade; full/partial refunds; duplicate/stale capture after refund; dispute open/won/stale open; reversal before capture; preservation of lifetime/manual terms; test-access cleanup preserving receipts. Unit/route checks cover HMAC signatures, ownership, raw bytes, invalid/cross-origin requests and processed-refund accounting.

Not yet verified: hosted PostgREST/JWT grants, separate PostgreSQL sessions racing settlement/reversal, real Razorpay Test Checkout and actual provider webhook delivery. These require SQL approval and configured credentials. The proposal is not production accepted.

## Risks, operation and rollback

The service-role key is privileged; keep it server-only. Provider outage returns retryable failure; alerts must catch disabled/missed webhook delivery. Support must use `grant_pro` and the ledger-aware operations, not directly overwrite entitlement rows after baseline capture. Closed/reopened terminal disputes need operator reconciliation. Partial refund policy above needs acceptance before live payments.

Before approved application, take schema/data backup. The SQL is transactional: a statement failure rolls back the proposal. After financial records exist, do not drop tables or restore an old database over new payments. Safe application rollback: disable payments, retain provider webhooks/reconciliation or process them operationally, roll code back if needed, retain all RLS-protected billing/ledger data and review entitlement differences. A destructive down migration is deliberately not supplied. Applying the SQL is not permission to enable live checkout.

## Proposed staging actions requiring approval

1. Preserve current hosted schema catalog, then apply this exact proposal to the existing **staging** project only.
2. Set `billing_environment.allow_test_pro=true` in staging for the requested test upgrade flow. Keep test mode, never live.
3. Run disposable two-account RLS and separate-session settlement/refund tests; remove only generated test fixtures and void test-funded access after browser acceptance as agreed.

No additional activity-history or production migration is included in this approval scope.

Current status: the user approved this exact proposal for staging on 2026-11-02. Applied once after preserving the public schema catalog. Two tables, eight policies and two triggers verified. Hosted two-account SQL-role acceptance passed; all SQL fixtures rolled back. Local flag enabled. Browser company completion/bookmark and confidence scheduling/review/removal checks passed. See verification/staging-preparation-*.json. Production and the separate activity-history proposal remain excluded.

The original review below records the proposal as presented before approval.

# Preparation tools: approval required

Proposed SQL: `supabase/proposals/preparation_tools.sql`.
SHA256: `75deeee22c47826b187f308b7accdc0e0947b8e04a04e1e99936207a6c6e5706`.

This adds two tables and two timestamp triggers, using the existing `set_updated_at`, `auth.uid` and `has_pro` functions. It does not alter existing tables, import content, backfill history, or change entitlements.

- `company_problem_progress`: one completion/bookmark state per user/company/problem. Own rows only; active Pro required for inserts/updates. Users can still read/delete their own states after expiry. App validates every slug against the private approved bank, and only the priority set contributes to completion. Additional problems can be bookmarked.
- `item_reviews`: own confidence rating, scheduling step (0–6), due date and graduation state per published learning item. Inserts/updates require an accessible content row (content RLS applies); other accounts cannot read/write these rows. This is current review state, not an immutable event history. Existing manual revision flags stay independent.
- No anonymous grants. Authenticated users receive only RLS-scoped select/insert/update/delete.

Local PGlite execution and two-account RLS tests pass: Pro own writes, cross-account forgery denial, Free company-write denial, inaccessible Pro-item review denial, and preservation/read of own company state after entitlement revocation.

`PREPARATION_TOOLS_ENABLED=false` by default. Both new features remain disabled until staging approval, schema-state backup, exact SQL application, hosted RLS verification and browser persistence checks. No hosted SQL has been run for this proposal. Production is excluded. The separate activity-history proposal is also excluded.

If approved for staging, preserve current schema first, apply this exact file once, verify its two tables, triggers and eight policies, run disposable two-account tests, then enable the local server flag and check persistence through the browser. No deployment or live payments.

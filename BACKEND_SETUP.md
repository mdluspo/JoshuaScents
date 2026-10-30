# Joshua Scents backend and integrations

The storefront uses Vite/React in the browser and Vercel Functions under `/api` for privileged work. Supabase is the persistent database and identity provider. External provider secrets must exist only in Vercel environment variables.

## Prototype security defaults

This is a prototype, not a live shop. Leave `STORE_CHECKOUT_ENABLED`, `STORE_PAYMENTS_ENABLED`, and `VITE_ENABLE_CHECKOUT` unset or `false`. The API refuses order/payment creation by default, even if provider keys exist; the browser shows a checkout preview without collecting payment details. The dormant provider code is not a production-payment readiness claim.

- Set `APP_ORIGIN` to the exact deployed HTTPS origin. The current Vercel deployment origin is also accepted; local loopback origins are allowed only outside Vercel. Cross-site browser API calls are rejected. This supplements authentication; it is not authentication itself.
- APIs accept bounded JSON objects, validate fields and IDs, reject unexpected properties, and return generic errors with request IDs. Provider calls time out. Search text and SQL-looking strings stay data: database queries use fixed tables/columns and bound Supabase filters/RPC arguments, never interpolated SQL.
- React renders customer/provider strings as text. Customer markup is rejected where plain text is expected, email HTML is escaped, and tracking links must be HTTPS. Deployment CSP disallows inline scripts, plugins and framing. Inline styles remain permitted for the existing animation/design system.
- Instance-local rate limits reduce accidental/low-volume abuse. They are **not distributed protection** across Vercel instances. Configure a Vercel Firewall/gateway rate limit and provider budgets before opening a public prototype to untrusted traffic.
- Address suggestions and analytics are opt-in: `VITE_ENABLE_ADDRESS_SUGGESTIONS=true`, or both `VITE_ENABLE_ANALYTICS=true` and `STORE_ANALYTICS_ENABLED=true`. Analytics must also have an appropriate consent/privacy implementation before public use. Browser analytics no longer forwards customer email, URL queries, or auth fragments.
- Security headers in `vercel.json` take effect on Vercel, not the plain Vite dev server. If custom Supabase/Sentry/asset domains are used, explicitly add only those domains to the CSP allowlist.

### Separate admin access

Open `/admin` directly; there is no admin link or admin-role selector in the customer navigation. Knowing that URL grants no permission. The portal verifies the signed-in identity and database role through `/api/admin/session`; every order list/update and upload-signing request checks authorization again on the server. Customer accounts receive `403`. Financial statuses cannot be assigned through the fulfillment interface.

Create an administrator using trusted Supabase dashboard operations: create/invite the intended user, ensure they can sign in, then change **only that verified user's** `profiles.role` to `admin` using the SQL editor/dashboard as a trusted operator. Never expose the service-role key, build a public role picker, or create an admin from user-editable auth metadata. Configure allowed Auth redirect URLs, auth email limits/CAPTCHA and, before production, MFA with server-side assurance enforcement.

Apply the new forward security migration after the two original migrations. It is intentionally not applied to a live database by this code change. Verify customer ownership policies, restricted profile columns, service-only integration events and privileged functions before relying on the portal. A local build cannot verify live grants or deployed policies.

Migration: `supabase/migrations/20261030000000_security_hardening.sql`. It restricts direct browser grants, adds a role-change protection trigger, and limits privileged functions. The new text/URL checks are `NOT VALID` for existing rows: new writes are checked immediately, but legacy rows must be reviewed and cleaned before validating those constraints. Run `supabase/tests/security_permissions.sql` in a disposable test project after applying all migrations to check the resulting grants. These SQL checks require a database and are separate from the offline JS tests.

### Wishlist behaviour

Guests can save up to 100 fragrances without signing in. Saves are versioned product IDs in browser storage, never credentials or profile data. Hearts, the header count, and the wishlist page share state and react to cross-tab storage changes. If storage is blocked, the UI explicitly says the save is session-only.

On sign-in, guest saves merge into the signed-in user's `favorites` rows using an owner-scoped, duplicate-safe insert. Database ownership policies remain the security boundary. Sign-out clears account state from the interface instead of copying private account favourites into guest storage. Failed writes roll back and show feedback; failed merges keep guest data for retry. The `/admin` workspace is independent and has no public account-role selector.

#### Fixing account wishlist error PGRST205

`PGRST205` means the requested table is not found by the Data API. For this wishlist the requested table is `public.favorites`. Check that the SQL editor belongs to the same project as `VITE_SUPABASE_URL`; a table in a different project does not fix the app. A missing account migration or stale schema cache can cause this error.

For an existing store with the base schema already installed, run [the targeted account repair](supabase/repairs/restore_account_features.sql) in that project's Supabase SQL editor as its owner. It creates missing `favorites` and `addresses` tables, preserves rows, replaces policies on only those two tables with owner-only policies, restricts API grants, and notifies PostgREST to reload its schema cache. Review any custom policies first. It does not reset the database, change user roles, claim old orders by email, or enable payments. It is rerunnable; if an existing table has an incompatible schema, the transaction fails instead of dropping data.

Then apply [the security-hardening migration](supabase/migrations/20261030000000_security_hardening.sql) **once**, if not already applied and its base-schema prerequisites exist. The targeted repair does not replace that broader security work. Do not rerun the original store-creation script on an existing database.

After a successful SQL result, return to the store and choose **Retry sync**. Test a signed-in save, refresh, removal, sign-out, and a second account to verify isolation. If `PGRST205` persists while the table exists in the correct project, check API schema exposure/cache configuration. Running frontend tests does not apply SQL or verify live RLS. Supabase documents the code in [Data API error codes](https://supabase.com/docs/guides/api/rest/postgrest-error-codes); PostgREST documents [schema cache reloading](https://docs.postgrest.org/en/v14/references/schema_cache.html).

Run `npm test`, `npm run typecheck`, and `npm run build`. API regression tests use isolated environment fixtures and mocked services; they never contact live providers or use `.env.local`.

## What is implemented

| Capability | Provider | Entry point |
| --- | --- | --- |
| Database, authentication, orders, catalog, RLS | Supabase | `supabase/migrations/20261027000000_store_schema.sql` |
| GCash, Maya, card and other enabled online methods | PayMongo | `api/checkout.ts`, `api/webhooks/paymongo.ts` |
| Order email | Resend | `api/_lib/email.ts` |
| Address autocomplete and coordinates | Google Places (New) | `api/places/*` |
| Local delivery quotation | Lalamove v3 | `api/delivery/quote.ts` |
| Product image upload signing | Cloudinary | `api/media/sign.ts` |
| Catalog-only fragrance recommendations | OpenAI Responses API | `api/ai/recommend.ts` |
| Runtime error reporting | Sentry | `src/lib/sentry.ts` |
| Conversion events | Google Analytics Measurement Protocol and Meta Conversions API | `api/analytics.ts` |

Public `GET /api/health` reports only basic health and prototype/store mode. Integration configuration booleans require a verified administrator Bearer token; secrets are never returned.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill only the providers you are currently testing.
3. Run `npm install`.
4. Run `npx vercel dev` to serve both Vite and the `/api` functions. `npm run dev` serves only the Vite frontend.
5. Run `npm run typecheck` and `npm run build` before deployment.

Never commit `.env.local`. Variables prefixed with `VITE_` are deliberately public and become part of the browser bundle. Secret keys must never have that prefix.

## 1. Supabase

1. Create a Supabase project.
2. For a new empty project, apply the three files under `supabase/migrations/` in timestamp order: store schema, account features, then security hardening. For an existing store, review applied migrations first; never reset it merely to add missing account tables. Use the targeted repair above for the `PGRST205` account-table case.
3. Add the project URL and anonymous key to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Add the project URL and service-role key to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Vercel only.
5. Create/invite a designated administrator through trusted dashboard operations and assign their role there. Use `/admin` for administration; the normal account dialog remains customer-facing.
6. Configure the production site URL and allowed redirect URLs in Supabase Auth.

The service-role key bypasses Row Level Security and therefore exists only in server functions. Browser access uses the anonymous key plus RLS policies. Customers can read their own profiles and orders; the public can read only the active catalog.

## 2. PayMongo

1. Complete PayMongo merchant activation and enable the payment methods available to the account.
2. Put the test secret key in `PAYMONGO_SECRET_KEY` for preview deployments; use the live key only in production.
3. Create a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/paymongo` and subscribe to the paid checkout/payment events offered by the account.
4. Put the webhook signing secret in `PAYMONGO_WEBHOOK_SECRET`.
5. Set `VITE_SITE_URL` to the canonical deployment origin so PayMongo can return the customer to the confirmation page.

Payment integration is disabled by default. Before enabling it in a future production phase, reconcile shipping/amount/currency, enforce database stock, add transactional webhook idempotency and reliable notification retries, and verify statuses using signed provider events rather than redirects. The retained legacy provider code alone does not implement all of these guarantees.

## 3. Resend

1. Verify a sending domain in Resend.
2. Create a restricted API key and add it as `RESEND_API_KEY`.
3. Set `EMAIL_FROM` to an address on the verified domain.
4. Optionally set `STORE_NOTIFICATION_EMAIL` to receive a blind copy of new-order messages.

Email is sent by the server after a COD order is recorded or a PayMongo paid webhook is verified. A browser cannot trigger arbitrary email content.

## 4. Google Places

1. Enable Places API (New) in Google Cloud.
2. Create a server API key, restrict it to Places API (New), and add it as `GOOGLE_MAPS_SERVER_KEY`.
3. Apply billing and usage limits in Google Cloud.

Address searches are restricted to the Philippines. The UI remains usable as a manual address form when Places is missing or unavailable. Selecting a suggestion stores coordinates, which lets Lalamove quote the same destination precisely.

## 5. Lalamove

1. Create a Lalamove Partner account and obtain sandbox credentials.
2. Set `LALAMOVE_API_KEY`, `LALAMOVE_API_SECRET`, `LALAMOVE_ENV=sandbox`, and the market (normally `PH_MNL`; confirm it in Get City Info).
3. Set the pickup `STORE_ADDRESS`, `STORE_LAT`, `STORE_LNG`, `STORE_NAME`, and `STORE_PHONE`.
4. Confirm the correct `LALAMOVE_SERVICE_TYPE` from Get City Info.
5. Set `VITE_ENABLE_LALAMOVE=true` only when the above values work in the target environment.
6. Before production, set `LALAMOVE_ENV=production`, use production credentials, fund the Lalamove wallet, and test one real quotation.

The browser quotation is for display only. Checkout requests a fresh quotation on the server and saves that authoritative amount and quotation ID. The current version intentionally does not book a driver automatically: booking should occur from an admin fulfilment action after payment/COD acceptance, not merely when a shopper asks for a quote.

## 6. Cloudinary

1. Create a Cloudinary product environment.
2. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.
3. Use `uploadProductImage` from `src/lib/api.ts` in a future admin product editor.

The signing endpoint checks the Supabase access token and the caller's `profiles.role`. Only admins can obtain an upload signature. The Cloudinary secret never reaches the browser.

## 7. OpenAI scent adviser

1. Create a project API key and set `OPENAI_API_KEY`.
2. Set `OPENAI_MODEL` to a model available to the project; the default is `gpt-5-mini`.
3. Add project-level budget and rate limits in the OpenAI dashboard.

The prompt includes the local catalog and requires structured JSON. The server discards IDs not found in the catalog, preventing invented products from appearing. The feature provides shopping guidance, not medical claims.

## 8. Sentry

1. Create a React project in Sentry.
2. Set the public DSN as `VITE_SENTRY_DSN`.
3. Configure allowed domains and alert rules in Sentry.

Default personally identifiable information collection is disabled. Production performance sampling is set to 10%; development tracing is disabled.

## 9. Google Analytics and Meta Conversions

1. Set `VITE_GA_MEASUREMENT_ID` and the server-only `GA_API_SECRET` for GA4.
2. Set `VITE_META_PIXEL_ID` if a browser pixel is later added.
3. Set `META_DATASET_ID`, `META_CONVERSIONS_TOKEN`, and `META_GRAPH_API_VERSION` for Meta's server events.

Email, when present, is normalized and SHA-256 hashed before it is sent to Meta. The application sends only commerce event names, value, currency, page URL, and generated event IDs. Update the privacy notice and consent handling before enabling advertising analytics in production.

## Deployment checklist

- Apply the Supabase migration before enabling checkout.
- Configure preview credentials separately from production credentials.
- Confirm `/api/health` reports the expected providers.
- Complete a COD test order and confirm the database row and email.
- Complete a PayMongo test payment and confirm webhook idempotency and order status.
- Test an invalid/tampered cart and confirm the server rejects it.
- Test Places fallback with the Google key temporarily removed.
- Test a Lalamove out-of-service address and an expired quotation.
- Confirm a non-admin receives `403` from `/api/media/sign`.
- Review provider budgets, quotas, alerts, retention, privacy notice, and refund workflow.

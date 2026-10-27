# Joshua Scents backend and integrations

The storefront uses Vite/React in the browser and Vercel Functions under `/api` for privileged work. Supabase is the persistent database and identity provider. External provider secrets must exist only in Vercel environment variables.

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

Use `GET /api/health` after deployment to see which integrations are configured. It returns booleans only and never returns secrets.

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill only the providers you are currently testing.
3. Run `npm install`.
4. Run `npx vercel dev` to serve both Vite and the `/api` functions. `npm run dev` serves only the Vite frontend.
5. Run `npm run typecheck` and `npm run build` before deployment.

Never commit `.env.local`. Variables prefixed with `VITE_` are deliberately public and become part of the browser bundle. Secret keys must never have that prefix.

## 1. Supabase

1. Create a Supabase project.
2. Open the SQL editor and run `supabase/migrations/20261027000000_store_schema.sql`, or link the Supabase CLI and run the migration.
3. Add the project URL and anonymous key to `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.
4. Add the project URL and service-role key to `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` on Vercel only.
5. Sign in once through the account dialog. To make that account an administrator, update its `profiles.role` to `admin` in the Supabase dashboard.
6. Configure the production site URL and allowed redirect URLs in Supabase Auth.

The service-role key bypasses Row Level Security and therefore exists only in server functions. Browser access uses the anonymous key plus RLS policies. Customers can read their own profiles and orders; the public can read only the active catalog.

## 2. PayMongo

1. Complete PayMongo merchant activation and enable the payment methods available to the account.
2. Put the test secret key in `PAYMONGO_SECRET_KEY` for preview deployments; use the live key only in production.
3. Create a webhook pointing to `https://YOUR_DOMAIN/api/webhooks/paymongo` and subscribe to the paid checkout/payment events offered by the account.
4. Put the webhook signing secret in `PAYMONGO_WEBHOOK_SECRET`.
5. Set `VITE_SITE_URL` to the canonical deployment origin so PayMongo can return the customer to the confirmation page.

The server rebuilds every line item from its own catalog and ignores browser prices. A PayMongo redirect is not treated as proof of payment: the signed webhook changes the order to `paid` and triggers the receipt email. Webhook event IDs are stored to make processing idempotent.

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

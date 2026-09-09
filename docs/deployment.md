# Cloudflare deployment

The application uses two independently deployable services:

- A Cloudflare Static Assets Worker serves the exported Next.js output in `out/`.
- A Cloudflare Python Worker serves the FastAPI routes and accesses D1 through the `DB` binding.

## 1. Create and migrate D1

Authenticate Wrangler, then create the database in the Oceania region:

```bash
npx wrangler login
npx wrangler d1 create fresh-choice-research --location oc
```

The repository already binds the `fresh-choice-research` database in `backend/wrangler.jsonc`. Apply the reviewed migrations:

```bash
npx wrangler d1 migrations apply fresh-choice-research --remote --config backend/wrangler.jsonc
npm run products:sync:remote
```

Only store the participant name approved by the study protocol. Never place email addresses, student numbers, contact details or consent records in D1.

## 2. Deploy the Python API

Cloudflare Python Workers currently require Python 3.13, `uv` and the `python_workers` compatibility flag. From the repository root:

```bash
npm run api:deploy
```

Verify the resulting Worker URL with `/health` before publishing the frontend.

## 3. Build and deploy the Next.js frontend

Build the client bundle, then deploy the static-assets Worker:

```bash
NEXT_PUBLIC_SITE_URL=https://fresh-choice-imperfect-produce.zx5g456.workers.dev \
npm run build
npm run web:deploy
```

The current production API URL is the frontend default. Set `NEXT_PUBLIC_API_BASE_URL` only when building for a different API environment.

Set `NEXT_PUBLIC_SITE_URL` to the final Worker or custom-domain URL before the production build when correct social-sharing metadata is required.

These public environment variables are embedded at build time. Rebuild and redeploy whenever either URL changes.

## Automatic deployment from GitHub

The repository workflow `.github/workflows/ci.yml` deploys after all checks pass on `main`. It synchronises `data/products.json`, deploys the API, deploys the frontend and verifies both live endpoints. Production deployments are serialised so two runs cannot deploy at the same time.

Create a GitHub Environment named `production`, restrict it to `main`, and add `CLOUDFLARE_ACCOUNT_ID` and `CLOUDFLARE_API_TOKEN` as environment secrets. The API token must be scoped to the target Cloudflare account with Workers and D1 edit access. Never commit the token.

D1 migrations remain a reviewed manual step and are not executed by GitHub Actions. Apply a required migration before merging the code that uses it.

Do not enable Cloudflare Dashboard Git builds for the same Workers while this workflow is active. Keep one deployment path so a second build cannot overwrite the verified release.

## 4. Verify stored events

Use the D1 console in the Cloudflare dashboard, or run:

```sql
SELECT
  s.participant_name,
  s.condition_code,
  s.study_mode,
  s.scenario_index,
  s.duration_ms,
  e.event_type,
  e.product_id,
  e.product_kind,
  e.elapsed_ms,
  e.metadata_json,
  e.occurred_at
FROM study_sessions AS s
LEFT JOIN behavior_events AS e ON e.session_id = s.id
ORDER BY s.started_at DESC, e.occurred_at ASC;
```

## Portability

The frontend only communicates with `/api` through `lib/research-api.ts`. The FastAPI routes access storage through repository classes. Local development uses an ordinary SQLite file; production uses D1. D1 can later be exported as SQL without changing the frontend contract.

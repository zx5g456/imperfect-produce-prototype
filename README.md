# Fresh Choice — imperfect produce research prototype

An independent, Woolworths-inspired shopping prototype for evaluating how shoppers understand cosmetic appearance, quality status, current price and savings for discounted imperfect produce.

This is a university research prototype. It is not affiliated with Woolworths and does not process real purchases. A participant enters their name and assigned A/B condition before starting; the prototype stores that session’s interactions and timing. Questionnaire responses remain in the team's approved form.

## Live deployment

- **Prototype:** <https://fresh-choice-imperfect-produce.zx5g456.workers.dev>
- **API status:** <https://fresh-choice-research-api.zx5g456.workers.dev/health>

## Architecture

- **Frontend:** standard Next.js 16 App Router, exported and served with Cloudflare Workers Static Assets.
- **Backend:** an independent Python FastAPI service.
- **Database:** local SQLite during development and Cloudflare D1 in production.
- **Source control:** GitHub Pull Requests, with automatic checks on every push and Pull Request.

## Prototype flows

The start screen requires a participant name and Condition A or B before it creates a database session and opens the shopping demo. Every session displays the full product range. Condition A displays basic product information. Condition B adds the explanation of appearance, quality status, original price and explicit saving. Product, image, quantity and current price remain the same across conditions.

## Before formal testing

The values in `data/products.json` are sample data and are deliberately marked `not verified`. The research owner must compare every product name, image, quantity, unit, original price and current price with the approved source sheet. Do not remove the status until that check is complete.

## Local setup

```bash
npm install
npm run setup:api
npm run dev:all
```

Open `http://localhost:3000`. The frontend runs on port 3000 and the API on port 8787. The local database is created automatically under `backend/.data/`.

## Checks

```bash
npm run verify:data
npm run typecheck
npm run api:test
npm run build
```

The data check ensures prices are stored in whole cents, required label fields exist, and every displayed saving is derived from the original and current prices.

## Team workflow

Use GitHub Issues for tasks, one feature branch per issue, and Pull Requests for review. Protect `main` so it cannot be changed directly. See `CONTRIBUTING.md` for the agreed branch and review rules.

## Key files

- `app/page.tsx` — participant start screen, shopping demo and session-linked event capture
- `lib/research-api.ts` — typed connection between the Next.js frontend and Python API
- `backend/src/main.py` — FastAPI routes plus local SQLite and D1 adapters
- `backend/migrations/0001_initial.sql` — production D1/local SQLite schema and initial products
- `data/products.json` — offline frontend fallback used if the API is unavailable
- `scripts/verify-product-data.mjs` — product-data consistency check
- `docs/evaluation-mapping.md` — mapping from evaluation questions to prototype evidence
- `docs/database-and-products.md` — viewing research records and adding products safely
- `docs/deployment.md` — Cloudflare Workers and D1 deployment guide

## Image credits

Product imagery is sourced from CC0/public-domain providers and Unsplash. The generated social preview uses an original leaf motif and does not imitate the Woolworths logo.

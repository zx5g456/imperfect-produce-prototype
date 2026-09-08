# Fresh Choice — imperfect produce research prototype

An independent, Woolworths-inspired shopping prototype for evaluating how shoppers understand cosmetic appearance, quality status, current price and savings for discounted imperfect produce.

This is a university research prototype. It is not affiliated with Woolworths and does not process real purchases or store participant responses.

## Prototype flows

The **Research setup** control in the top bar creates a stable, shareable session URL for:

- open shopping demo;
- label-comprehension tasks for Evaluation Question 1.1; and
- controlled Condition A / Condition B comparisons for Evaluation Question 2.2.

Condition A displays basic product information. Condition B adds the explanation of appearance, quality status, original price and explicit saving. Product, image, quantity and current price remain the same across conditions.

## Before formal testing

The values in `data/products.json` are sample data and are deliberately marked `not verified`. The research owner must compare every product name, image, quantity, unit, original price and current price with the approved source sheet. Do not remove the status until that check is complete.

## Local setup

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Checks

```bash
npm run verify:data
npm run build
```

The data check ensures prices are stored in whole cents, required label fields exist, and every displayed saving is derived from the original and current prices.

## Team workflow

Use GitHub Issues for tasks, one feature branch per issue, and Pull Requests for review. Protect `main` so it cannot be changed directly. See `CONTRIBUTING.md` for the agreed branch and review rules.

## Key files

- `app/page.tsx` — shopping demo and researcher-controlled evaluation flows
- `data/products.json` — single source of truth for product and price information
- `scripts/verify-product-data.mjs` — product-data consistency check
- `docs/evaluation-mapping.md` — mapping from evaluation questions to prototype evidence

## Image credits

Product imagery is sourced from CC0/public-domain providers and Unsplash. The generated social preview uses an original leaf motif and does not imitate the Woolworths logo.

# Database records and product management

## What the research database stores

Production uses the Cloudflare D1 database named `fresh-choice-research`.

- `products` stores the product catalogue, both A/B detail descriptions, image paths and prices.
- `study_sessions` stores a random session ID, selected condition, flow, start/completion times and duration. It does not store participant identity.
- `behavior_events` stores detail opens, selection changes and completion events. Each row can include the product, product type, elapsed time and JSON metadata such as `selectionAction` and `selectedCount`.

In Cloudflare, open **Workers & Pages → D1 → fresh-choice-research → Console**. A useful read-only query is:

```sql
SELECT
  s.condition_code,
  s.started_at,
  s.completed_at,
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

## Add a product

Keep product changes in GitHub rather than editing only the D1 dashboard, so every developer and the offline fallback use the same catalogue.

1. Add the standard and value-product images under `public/products/`.
2. Add the matching object to `data/products.json`. Give it a unique `id`, a unique numeric `position`, both image paths, prices in cents and separate `conditionAInformation` and `conditionBInformation` text.
3. Add a new numbered SQL migration under `backend/migrations/`, for example `0003_add_pears.sql`. Insert the same product into D1 with all fields shown below.
4. Run `npm run verify:data`, `npm run typecheck`, `npm run api:test` and `npm run build`.
5. Apply the migration to D1, deploy the API, then rebuild and deploy the frontend.

```sql
INSERT INTO products (
  id, position, category, standard_name, imperfect_name,
  standard_image, imperfect_image, unit,
  original_price_cents, current_price_cents,
  appearance, quality,
  condition_a_information, condition_b_information,
  scenario, source_status
) VALUES (
  'pears', 4, 'Fresh produce', 'Green pears', 'Naturally unique pears',
  '/products/standard-pear.jpg', '/products/imperfect-pear.jpg', '1 kg bag',
  600, 420,
  'Natural variation in colour or shape.',
  'Fresh eating quality — appearance only.',
  'Condition A product information goes here.',
  'Condition B product information goes here.',
  'Participant task context goes here.',
  'not verified'
);
```

Review every price, image and product claim against the approved source before changing `source_status` to `verified`.

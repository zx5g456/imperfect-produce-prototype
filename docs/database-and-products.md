# Database records and product management

## What the research database stores

Production uses the Cloudflare D1 database named `fresh-choice-research`.

- `products` stores one row per visible product card, including its A/B detail descriptions, image path and prices.
- `study_sessions` stores the participant name, random session ID, selected condition, flow, start/completion times and duration.
- `behavior_events` stores detail opens, selection changes and completion events. Each row can include the product, product type, elapsed time and JSON metadata such as `selectionAction` and `selectedCount`.

In Cloudflare, open **Workers & Pages → D1 → fresh-choice-research → Console**. A useful read-only query is:

```sql
SELECT
  s.participant_name,
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

1. Add the product image under `public/products/`.
2. Add or edit one object per visible card in `data/products.json`. Give every product a unique `id` and `position`; use integer cents for prices.
3. Run `npm run products:sync:remote`. This validates the JSON, updates matching D1 rows, inserts new rows and removes products that are no longer in the JSON.
4. Rebuild and deploy the frontend so its offline fallback and images match D1.

The local FastAPI/SQLite service automatically synchronises this JSON when it starts.

For a standard product, use an `s-` category and only the standard name/image fields:

```json
{
  "id": "s-pears",
  "position": 9,
  "category": "s-Fresh produce",
  "standardName": "Green pears",
  "standardImage": "/products/standard-pear.jpg",
  "unit": "1 kg bag",
  "originalPriceCents": 600,
  "currentPriceCents": 420,
  "appearance": "Natural variation in colour or shape.",
  "quality": "Fresh eating quality — appearance only.",
  "conditionAInformation": "Condition A product information goes here.",
  "conditionBInformation": "Condition B product information goes here.",
  "scenario": "Participant task context goes here.",
  "sourceStatus": "not verified"
}
```

For an imperfect product, create a separate object with an `i-` category and only the imperfect name/image fields:

```json
{
  "id": "i-pears",
  "position": 10,
  "category": "i-Fresh produce",
  "imperfectName": "Naturally unique pears",
  "imperfectImage": "/products/imperfect-pear.jpg",
  "unit": "1 kg bag",
  "originalPriceCents": 600,
  "currentPriceCents": 420,
  "appearance": "Natural variation in colour or shape.",
  "quality": "Fresh eating quality — appearance only.",
  "conditionAInformation": "Condition A product information goes here.",
  "conditionBInformation": "Condition B product information goes here.",
  "scenario": "Participant task context goes here.",
  "sourceStatus": "not verified"
}
```

The category prefix is structural: `s-` means standard and `i-` means imperfect. It is removed before the category is shown on the page. The matching `id` prefix is also required. A/B changes the information treatment, not which products are loaded.

Review every price, image and product claim against the approved source before changing `source_status` to `verified`.

import { readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const mode = process.argv[2];

if (mode !== '--local' && mode !== '--remote') {
  console.error('Use --local or --remote.');
  process.exit(1);
}

const products = JSON.parse(
  readFileSync(path.join(root, 'data', 'products.json'), 'utf8'),
);

if (!Array.isArray(products) || products.length === 0) {
  console.error('data/products.json must contain at least one product.');
  process.exit(1);
}

function sqlText(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

const valueRows = products.map((product) => {
  const values = [
    product.id,
    product.position,
    product.category,
    product.standardName,
    product.imperfectName,
    product.standardImage,
    product.imperfectImage,
    product.unit,
    product.originalPriceCents,
    product.currentPriceCents,
    product.appearance,
    product.quality,
    product.conditionAInformation,
    product.conditionBInformation,
    product.scenario,
    product.sourceStatus,
  ];

  return `(${values
    .map((value) =>
      typeof value === 'number' ? String(value) : sqlText(value),
    )
    .join(', ')})`;
});

const productIds = products.map((product) => sqlText(product.id)).join(', ');
const sql = `
PRAGMA foreign_keys = ON;

DELETE FROM products WHERE id NOT IN (${productIds});

-- Move current rows out of the normal range so positions can be reordered.
UPDATE products SET position = position + 1000000000;

INSERT INTO products (
  id, position, category, standard_name, imperfect_name,
  standard_image, imperfect_image, unit,
  original_price_cents, current_price_cents,
  appearance, quality,
  condition_a_information, condition_b_information,
  scenario, source_status
) VALUES
  ${valueRows.join(',\n  ')}
ON CONFLICT(id) DO UPDATE SET
  position = excluded.position,
  category = excluded.category,
  standard_name = excluded.standard_name,
  imperfect_name = excluded.imperfect_name,
  standard_image = excluded.standard_image,
  imperfect_image = excluded.imperfect_image,
  unit = excluded.unit,
  original_price_cents = excluded.original_price_cents,
  current_price_cents = excluded.current_price_cents,
  appearance = excluded.appearance,
  quality = excluded.quality,
  condition_a_information = excluded.condition_a_information,
  condition_b_information = excluded.condition_b_information,
  scenario = excluded.scenario,
  source_status = excluded.source_status;
`;

const npx = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const result = spawnSync(
  npx,
  [
    'wrangler',
    'd1',
    'execute',
    'fresh-choice-research',
    mode,
    '--config',
    'backend/wrangler.jsonc',
    '--command',
    sql,
  ],
  { cwd: root, stdio: 'inherit' },
);

process.exit(result.status ?? 1);

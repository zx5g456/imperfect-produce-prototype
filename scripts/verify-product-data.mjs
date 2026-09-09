import products from '../data/products.json' with { type: 'json' };

const errors = [];

for (const product of products) {
  const requiredText = [
    'id',
    'standardName',
    'imperfectName',
    'unit',
    'appearance',
    'quality',
    'conditionAInformation',
    'conditionBInformation',
    'scenario',
    'sourceStatus',
  ];

  for (const field of requiredText) {
    if (!product[field] || typeof product[field] !== 'string') {
      errors.push(`${product.id || 'unknown'}: ${field} is missing`);
    }
  }

  if (
    !Number.isInteger(product.originalPriceCents) ||
    !Number.isInteger(product.currentPriceCents)
  ) {
    errors.push(`${product.id}: prices must use integer cents`);
  }

  if (product.currentPriceCents >= product.originalPriceCents) {
    errors.push(
      `${product.id}: current price must be lower than original price`,
    );
  }

  const saving = product.originalPriceCents - product.currentPriceCents;
  if (saving <= 0) {
    errors.push(`${product.id}: saving must be positive`);
  }
}

if (new Set(products.map((product) => product.id)).size !== products.length) {
  errors.push('Product IDs must be unique');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Verified ${products.length} prototype products: required fields, integer prices and savings calculations are valid.`,
);

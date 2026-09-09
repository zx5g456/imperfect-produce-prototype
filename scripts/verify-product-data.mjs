import products from '../data/products.json' with { type: 'json' };

const errors = [];

for (const product of products) {
  const requiredText = [
    'id',
    'category',
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

  const kind = product.category?.startsWith('s-')
    ? 'standard'
    : product.category?.startsWith('i-')
      ? 'imperfect'
      : null;

  if (!kind || product.category.length <= 2) {
    errors.push(`${product.id}: category must start with s- or i-`);
  } else {
    const prefix = kind === 'standard' ? 's-' : 'i-';
    const nameField = kind === 'standard' ? 'standardName' : 'imperfectName';
    const imageField = kind === 'standard' ? 'standardImage' : 'imperfectImage';
    const unusedNameField =
      kind === 'standard' ? 'imperfectName' : 'standardName';
    const unusedImageField =
      kind === 'standard' ? 'imperfectImage' : 'standardImage';

    if (!product.id?.startsWith(prefix)) {
      errors.push(`${product.id}: ID must start with ${prefix}`);
    }
    if (!product[nameField] || typeof product[nameField] !== 'string') {
      errors.push(`${product.id}: ${nameField} is missing`);
    }
    if (!product[imageField] || typeof product[imageField] !== 'string') {
      errors.push(`${product.id}: ${imageField} is missing`);
    }
    if (unusedNameField in product || unusedImageField in product) {
      errors.push(
        `${product.id}: only the ${kind} name and image fields are allowed`,
      );
    }
  }

  if (
    !Number.isInteger(product.position) ||
    !Number.isInteger(product.originalPriceCents) ||
    !Number.isInteger(product.currentPriceCents)
  ) {
    errors.push(`${product.id}: position and prices must use whole numbers`);
  }

  if (product.position < 1) {
    errors.push(`${product.id}: position must be greater than zero`);
  }

  if (product.position > 1000000) {
    errors.push(`${product.id}: position must be 1000000 or lower`);
  }

  if (!['not verified', 'verified'].includes(product.sourceStatus)) {
    errors.push(`${product.id}: sourceStatus must be verified or not verified`);
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

if (
  new Set(products.map((product) => product.position)).size !== products.length
) {
  errors.push('Product positions must be unique');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

console.log(
  `Verified ${products.length} one-card product records: category prefixes, required fields, integer prices and savings calculations are valid.`,
);

ALTER TABLE products
ADD COLUMN condition_a_information TEXT NOT NULL DEFAULT 'Product information has not been added yet.';

ALTER TABLE products
ADD COLUMN condition_b_information TEXT NOT NULL DEFAULT 'Product information has not been added yet.';

UPDATE products
SET
  condition_a_information = 'Australian-grown carrots packed in a 1 kg bag. Suitable for soups, roasting, salads and everyday cooking. Keep refrigerated in the crisper drawer.',
  condition_b_information = 'A 1 kg value bag of Australian-grown carrots selected for fresh eating quality. Natural curves or forks do not affect flavour or cooking use. Keep refrigerated in the crisper drawer.'
WHERE id = 'carrots';

UPDATE products
SET
  condition_a_information = 'A 1 kg bag of red apples for snacking, lunchboxes or baking. Rinse before eating and store refrigerated to help maintain crispness.',
  condition_b_information = 'A 1 kg value bag of crisp red apples with naturally varied colour or shape. The visual variation does not change their suitability for snacking, lunchboxes or baking.'
WHERE id = 'apples';

UPDATE products
SET
  condition_a_information = 'A 500 g pack of red capsicums suitable for salads, roasting, stir-fries and sauces. Store refrigerated and wash before use.',
  condition_b_information = 'A 500 g value pack of red capsicums checked for fresh cooking quality. Their naturally curved or uneven shape does not affect flavour or use in salads, roasting, stir-fries and sauces.'
WHERE id = 'capsicum';

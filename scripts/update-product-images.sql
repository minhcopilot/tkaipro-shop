-- Set product cover images for FigmaEdu products (static files under /products/).
UPDATE product
SET image = '/products/figma-edu-product.png',
    updated_at = NOW()
WHERE slug = 'figma-edu';

UPDATE product
SET image = '/products/figma-edu-nang-cap-product.png',
    updated_at = NOW()
WHERE slug = 'figma-edu-nang-cap';

SELECT id, slug, image FROM product WHERE slug IN ('figma-edu', 'figma-edu-nang-cap') ORDER BY sort_order;

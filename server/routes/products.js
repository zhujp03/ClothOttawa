import fs from 'node:fs/promises';
import path from 'node:path';
import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdminPermission, tryDecodeAuthToken } from '../middleware/auth.js';
import { uploadProductAssets } from '../middleware/upload.js';
import { uniqueSlug, slugify } from '../lib/slug.js';
import { cleanupExpiredPaymentSessions } from '../lib/payment-sessions.js';
import { translateText, isMachineTranslationEnabled } from '../lib/translator.js';
import { ADMIN_PERMISSION } from '../lib/admin-permissions.js';

const router = Router();

const variantSchema = z.object({
  color: z.string().min(1).max(40),
  size: z.string().min(1).max(20),
  stock: z.coerce.number().int().min(0),
  sku: z.string().max(80).optional().or(z.literal(''))
});

const productSchema = z.object({
  name: z.string().min(2).max(140),
  slug: z.string().min(2).max(180).optional(),
  description: z.string().min(10),
  priceCents: z.coerce.number().int().positive(),
  costCents: z.coerce.number().int().min(0).optional(),
  isOnSale: z.union([z.boolean(), z.string()]).optional(),
  salePriceCents: z.coerce.number().int().positive().optional(),
  categoryId: z.coerce.number().int().positive(),
  isActive: z.union([z.boolean(), z.string()]).optional(),
  variants: z.array(variantSchema).optional()
});

const visibilitySchema = z.object({
  isActive: z.union([z.boolean(), z.string()])
});
const homeFeatureSchema = z.object({
  isHomeFeatured: z.union([z.boolean(), z.string()])
});

function normalizeBoolean(value, fallback = true) {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  }

  return fallback;
}

function sanitizeSaleFields({ priceCents, isOnSale, salePriceCents }) {
  const basePrice = Number(priceCents || 0);
  const saleEnabled = normalizeBoolean(isOnSale, false);
  const rawSalePrice = Number(salePriceCents || 0);

  if (!saleEnabled) {
    return { isOnSale: false, salePriceCents: null, currentPriceCents: basePrice };
  }

  if (!Number.isInteger(rawSalePrice) || rawSalePrice <= 0) {
    throw new Error('Sale price must be a positive integer when sale is enabled');
  }

  if (rawSalePrice >= basePrice) {
    throw new Error('Sale price must be lower than original price');
  }

  return { isOnSale: true, salePriceCents: rawSalePrice, currentPriceCents: rawSalePrice };
}

function resolveLocale(req) {
  const headerLocale = String(req.headers['x-locale'] || '').toLowerCase();
  const queryLocale = String(req.query.lang || '').toLowerCase();
  const locale = queryLocale || headerLocale;
  return locale === 'fr' ? 'fr' : 'en';
}

function isAdminRequest(req) {
  const decoded = tryDecodeAuthToken(req);
  return decoded?.role === 'admin' && Array.isArray(decoded.permissions) && decoded.permissions.includes(ADMIN_PERMISSION.CATALOG);
}

function parseVariants(rawVariants) {
  if (rawVariants == null || rawVariants === '') {
    return undefined;
  }

  if (Array.isArray(rawVariants)) {
    return rawVariants;
  }

  if (typeof rawVariants === 'string') {
    try {
      const parsed = JSON.parse(rawVariants);
      return Array.isArray(parsed) ? parsed : undefined;
    } catch {
      return undefined;
    }
  }

  return undefined;
}

function parseImageGallery(rawJson, fallbackImage = null) {
  if (!rawJson) {
    return fallbackImage ? [fallbackImage] : [];
  }
  try {
    const parsed = JSON.parse(rawJson);
    const list = Array.isArray(parsed) ? parsed : [];
    const clean = list.filter((item) => typeof item === 'string' && item.startsWith('/uploads/'));
    if (!clean.length && fallbackImage) return [fallbackImage];
    return clean;
  } catch {
    return fallbackImage ? [fallbackImage] : [];
  }
}

function extractUploadedFiles(req) {
  const files = req.files || {};
  const coverFile = files.image?.[0] || null;
  const galleryFiles = Array.isArray(files.images) ? files.images : [];
  const pdfFile = files.specPdf?.[0] || null;

  const imageUrls = [coverFile, ...galleryFiles]
    .filter(Boolean)
    .map((file) => `/uploads/${file.filename}`);

  const uniqueImages = [...new Set(imageUrls)];

  return {
    imageUrls: uniqueImages,
    introPdfUrl: pdfFile ? `/uploads/${pdfFile.filename}` : null
  };
}

function mapProductForViewer(product, adminMode = false, locale = 'en') {
  let sale;
  try {
    sale = sanitizeSaleFields({
      priceCents: product.priceCents,
      isOnSale: product.isOnSale,
      salePriceCents: product.salePriceCents
    });
  } catch {
    sale = { isOnSale: false, salePriceCents: null, currentPriceCents: Number(product.priceCents || 0) };
  }
  const discountPercent = sale.isOnSale
    ? Math.round(((Number(product.priceCents || 0) - Number(sale.currentPriceCents || 0)) / Number(product.priceCents || 1)) * 100)
    : 0;
  const variants = (product.variants || []).map((variant) => {
    const onHand = Number(variant.stock || 0);
    const reserved = Number(variant.reservedStock || 0);
    const available = Math.max(0, onHand - reserved);
    return {
      ...variant,
      availableStock: available,
      stock: adminMode ? onHand : available
    };
  });
  const localizedCategory = product.category
    ? {
        ...product.category,
        name: locale === 'fr' ? product.category.nameFr || product.category.name : product.category.name
      }
    : product.category;
  const imageUrls = parseImageGallery(product.imageUrlsJson, product.imageUrl);

  return {
    ...product,
    isOnSale: sale.isOnSale,
    salePriceCents: sale.salePriceCents,
    currentPriceCents: sale.currentPriceCents,
    discountPercent,
    name: locale === 'fr' ? product.nameFr || product.name : product.name,
    description: locale === 'fr' ? product.descriptionFr || product.description : product.description,
    category: localizedCategory,
    imageUrls,
    introPdfUrl: product.introPdfUrl || null,
    variants
  };
}

function skuComponent(value) {
  return slugify(value).replace(/-/g, '').toUpperCase().slice(0, 10) || 'STD';
}

function generateSku(productSlug, color, size) {
  const prefix = skuComponent(productSlug);
  const colorCode = skuComponent(color);
  const sizeCode = skuComponent(size);
  return `NA-${prefix}-${colorCode}-${sizeCode}`.slice(0, 80);
}

async function ensureProductFrenchFields({ name, description, existingNameFr = null, existingDescriptionFr = null }) {
  const out = {
    // Keep product names in original language for brand/style consistency.
    nameFr: existingNameFr && String(existingNameFr).trim() ? String(existingNameFr).trim() : String(name || '').trim() || null,
    descriptionFr:
      existingDescriptionFr && String(existingDescriptionFr).trim() ? String(existingDescriptionFr).trim() : null
  };

  if (!out.descriptionFr && description) {
    out.descriptionFr = (await translateText(description, { target: 'fr', source: 'en' })) || null;
  }

  return out;
}

async function hydrateFrenchProductFields(rows = []) {
  if (!isMachineTranslationEnabled()) return rows;
  const out = [...rows];

  for (let i = 0; i < out.length; i += 1) {
    const row = out[i];
    const missingNameFr = !row.nameFr || !String(row.nameFr).trim();
    const missingDescFr = !row.descriptionFr || !String(row.descriptionFr).trim();
    if (!missingNameFr && !missingDescFr) continue;

    const translated = await ensureProductFrenchFields({
      name: row.name,
      description: row.description,
      existingNameFr: row.nameFr,
      existingDescriptionFr: row.descriptionFr
    });

    if (!translated.nameFr && !translated.descriptionFr) continue;

    await prisma.product.update({
      where: { id: row.id },
      data: {
        ...(translated.nameFr ? { nameFr: translated.nameFr } : {}),
        ...(translated.descriptionFr ? { descriptionFr: translated.descriptionFr } : {})
      }
    });

    out[i] = {
      ...row,
      nameFr: translated.nameFr || row.nameFr,
      descriptionFr: translated.descriptionFr || row.descriptionFr
    };
  }

  return out;
}

async function safeDeleteFile(imageUrl) {
  if (!imageUrl?.startsWith('/uploads/')) {
    return;
  }

  const filePath = path.resolve(process.cwd(), imageUrl.replace('/uploads/', 'uploads/'));

  try {
    await fs.unlink(filePath);
  } catch {
    // best effort cleanup
  }
}

async function safeDeleteMany(urls = []) {
  for (const url of urls) {
    await safeDeleteFile(url);
  }
}

router.get('/', async (req, res) => {
  const locale = resolveLocale(req);
  await cleanupExpiredPaymentSessions();
  const {
    categoryId,
    search,
    sku,
    featuredHome = '0',
    onSale = '0',
    sort = 'latest',
    recentDays = '0',
    includeInactive = '0',
    limit = '24',
    offset = '0'
  } = req.query;

  const where = {};

  if (categoryId) {
    where.categoryId = Number(categoryId);
  }

  if (String(onSale) === '1') {
    where.isOnSale = true;
  }

  const canSeeInactive = includeInactive === '1' && isAdminRequest(req);

  if (!canSeeInactive) {
    where.isActive = true;
  }

  if (search) {
    where.OR = [
      { name: { contains: String(search).trim() } },
      { description: { contains: String(search).trim() } },
      { nameFr: { contains: String(search).trim() } },
      { descriptionFr: { contains: String(search).trim() } }
    ];
  }

  if (sku) {
    where.variants = {
      some: {
        sku: {
          contains: String(sku).trim().toUpperCase()
        }
      }
    };
  }

  if (String(featuredHome) === '1') {
    where.isHomeFeatured = true;
  }

  const days = Number.parseInt(String(recentDays || '0'), 10);
  if (Number.isFinite(days) && days > 0) {
    const floor = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    where.createdAt = { gte: floor };
  }

  const orderBy =
    sort === 'price_asc'
      ? [{ priceCents: 'asc' }]
      : sort === 'price_desc'
        ? [{ priceCents: 'desc' }]
        : [{ createdAt: 'desc' }];

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        variants: true
      },
      orderBy,
      skip: Number(offset) || 0,
      take: Math.min(Number(limit) || 24, 100)
    }),
    prisma.product.count({ where })
  ]);
  const baseRows = locale === 'fr' ? await hydrateFrenchProductFields(items) : items;

  const adminMode = isAdminRequest(req);
  const payload = baseRows.map((item) => mapProductForViewer(item, adminMode, locale));
  return res.json({ total, items: payload });
});

router.get('/:id', async (req, res) => {
  const locale = resolveLocale(req);
  await cleanupExpiredPaymentSessions();
  const id = Number(req.params.id);
  const adminMode = isAdminRequest(req);

  if (!id) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      variants: true
    }
  });

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  if (!adminMode && product.isActive === false) {
    return res.status(404).json({ message: 'Product not found' });
  }
  const baseProduct =
    locale === 'fr'
      ? (
          await hydrateFrenchProductFields([product])
        )[0]
      : product;

  return res.json(mapProductForViewer(baseProduct, adminMode, locale));
});

router.post(
  '/',
  requireAdminPermission(ADMIN_PERMISSION.CATALOG),
  uploadProductAssets.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'specPdf', maxCount: 1 }
  ]),
  async (req, res) => {
  const payload = { ...req.body };
  if (Object.prototype.hasOwnProperty.call(req.body, 'variants')) {
    payload.variants = parseVariants(req.body.variants);
  }

  const parsed = productSchema.safeParse(payload);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const nextSlug = await uniqueSlug(prisma, 'product', parsed.data.slug || parsed.data.name);
  const translated = await ensureProductFrenchFields({
    name: parsed.data.name,
    description: parsed.data.description
  });
  let saleData;
  try {
    saleData = sanitizeSaleFields({
      priceCents: parsed.data.priceCents,
      isOnSale: parsed.data.isOnSale,
      salePriceCents: parsed.data.salePriceCents
    });
  } catch (error) {
    return res.status(400).json({ message: error.message || 'Invalid sale payload' });
  }

  const uploaded = extractUploadedFiles(req);
  const gallery = uploaded.imageUrls;
  if (gallery.length === 0) {
    return res.status(400).json({ message: 'At least one product image is required when creating a product' });
  }

  const created = await prisma.product.create({
    data: {
      name: parsed.data.name,
      nameFr: translated.nameFr,
      slug: nextSlug,
      description: parsed.data.description,
      descriptionFr: translated.descriptionFr,
      priceCents: parsed.data.priceCents,
      costCents: Number(parsed.data.costCents || 0),
      isOnSale: saleData.isOnSale,
      salePriceCents: saleData.salePriceCents,
      categoryId: parsed.data.categoryId,
      isActive: normalizeBoolean(parsed.data.isActive, true),
      imageUrl: gallery[0] || null,
      imageUrlsJson: gallery.length ? JSON.stringify(gallery) : null,
      introPdfUrl: uploaded.introPdfUrl,
      variants: {
        create:
          parsed.data.variants?.map((variant) => ({
            color: variant.color,
            size: variant.size,
            stock: variant.stock,
            sku: generateSku(nextSlug, variant.color, variant.size)
          })) || []
      }
    },
    include: {
      category: true,
      variants: true
    }
  });

    return res.status(201).json(created);
  }
);

router.put(
  '/:id',
  requireAdminPermission(ADMIN_PERMISSION.CATALOG),
  uploadProductAssets.fields([
    { name: 'image', maxCount: 1 },
    { name: 'images', maxCount: 30 },
    { name: 'specPdf', maxCount: 1 }
  ]),
  async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const payload = { ...req.body };
  const hasVariantsField = Object.prototype.hasOwnProperty.call(req.body, 'variants');
  if (hasVariantsField) {
    payload.variants = parseVariants(req.body.variants);
  }

  const parsed = productSchema.partial().safeParse(payload);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  if (parsed.data.categoryId) {
    const category = await prisma.category.findUnique({ where: { id: parsed.data.categoryId } });

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }
  }

  const data = {};
  const uploaded = extractUploadedFiles(req);
  const oldGallery = parseImageGallery(existing.imageUrlsJson, existing.imageUrl);
  const oldPdf = existing.introPdfUrl || null;

  if (parsed.data.name) data.name = parsed.data.name;
  if (parsed.data.description) data.description = parsed.data.description;
  if (parsed.data.priceCents) data.priceCents = parsed.data.priceCents;
  if (Object.prototype.hasOwnProperty.call(parsed.data, 'costCents')) {
    data.costCents = Number(parsed.data.costCents || 0);
  }
  if (parsed.data.categoryId) data.categoryId = parsed.data.categoryId;
  const nextPriceCents = Number(parsed.data.priceCents || existing.priceCents || 0);
  const hasIsOnSale = Object.prototype.hasOwnProperty.call(parsed.data, 'isOnSale');
  const hasSalePrice = Object.prototype.hasOwnProperty.call(parsed.data, 'salePriceCents');
  if (hasIsOnSale || hasSalePrice || Object.prototype.hasOwnProperty.call(parsed.data, 'priceCents')) {
    try {
      const saleData = sanitizeSaleFields({
        priceCents: nextPriceCents,
        isOnSale: hasIsOnSale ? parsed.data.isOnSale : existing.isOnSale,
        salePriceCents: hasSalePrice ? parsed.data.salePriceCents : existing.salePriceCents
      });
      data.isOnSale = saleData.isOnSale;
      data.salePriceCents = saleData.salePriceCents;
    } catch (error) {
      return res.status(400).json({ message: error.message || 'Invalid sale payload' });
    }
  }
  if (Object.prototype.hasOwnProperty.call(parsed.data, 'isActive')) {
    data.isActive = normalizeBoolean(parsed.data.isActive, existing.isActive);
    if (!data.isActive) data.isHomeFeatured = false;
  }

  if (parsed.data.slug || parsed.data.name) {
    data.slug = await uniqueSlug(prisma, 'product', parsed.data.slug || parsed.data.name, id);
  }

  if (parsed.data.name || parsed.data.description) {
    const translated = await ensureProductFrenchFields({
      name: parsed.data.name || existing.name,
      description: parsed.data.description || existing.description,
      existingNameFr: existing.nameFr,
      existingDescriptionFr: existing.descriptionFr
    });
    if (translated.nameFr) data.nameFr = translated.nameFr;
    if (translated.descriptionFr) data.descriptionFr = translated.descriptionFr;
  }

  if (uploaded.imageUrls.length > 0) {
    data.imageUrl = uploaded.imageUrls[0] || null;
    data.imageUrlsJson = JSON.stringify(uploaded.imageUrls);
  }

  if (uploaded.introPdfUrl) {
    data.introPdfUrl = uploaded.introPdfUrl;
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (hasVariantsField && Array.isArray(parsed.data.variants)) {
      await tx.productVariant.deleteMany({ where: { productId: id } });
    }

    return tx.product.update({
      where: { id },
      data: {
        ...data,
        ...(hasVariantsField && Array.isArray(parsed.data.variants)
          ? {
              variants: {
                create: parsed.data.variants.map((variant) => ({
                  color: variant.color,
                  size: variant.size,
                  stock: variant.stock,
                  sku: generateSku(data.slug || existing.slug, variant.color, variant.size)
                }))
              }
            }
          : {})
      },
      include: {
        category: true,
        variants: true
      }
    });
  });

  if (uploaded.imageUrls.length > 0) {
    const keep = new Set(uploaded.imageUrls);
    const remove = oldGallery.filter((url) => !keep.has(url));
    await safeDeleteMany(remove);
  }

  if (uploaded.introPdfUrl && oldPdf && oldPdf !== uploaded.introPdfUrl) {
    await safeDeleteFile(oldPdf);
  }

    return res.json(updated);
  }
);

router.patch('/:id/visibility', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const parsed = visibilitySchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const nextIsActive = normalizeBoolean(parsed.data.isActive, existing.isActive);
  const updated = await prisma.product.update({
    where: { id },
    data: {
      isActive: nextIsActive,
      ...(nextIsActive ? {} : { isHomeFeatured: false })
    },
    include: {
      category: true,
      variants: true
    }
  });

  return res.json(updated);
});

router.patch('/:id/home-feature', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const parsed = homeFeatureSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const nextFeatured = normalizeBoolean(parsed.data.isHomeFeatured, false);
  if (nextFeatured && existing.isActive === false) {
    return res.status(400).json({ message: 'Cannot feature an inactive product' });
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (nextFeatured) {
      await tx.product.updateMany({
        where: { isHomeFeatured: true },
        data: { isHomeFeatured: false }
      });
    }
    return tx.product.update({
      where: { id },
      data: { isHomeFeatured: nextFeatured },
      include: {
        category: true,
        variants: true
      }
    });
  });

  return res.json(updated);
});

router.delete('/:id', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'Invalid product id' });
  }

  const existing = await prisma.product.findUnique({ where: { id } });

  if (!existing) {
    return res.status(404).json({ message: 'Product not found' });
  }

  await prisma.product.delete({ where: { id } });
  await safeDeleteMany(parseImageGallery(existing.imageUrlsJson, existing.imageUrl));
  await safeDeleteFile(existing.introPdfUrl);

  return res.status(204).send();
});

router.post('/auto-translate', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (_req, res) => {
  if (!isMachineTranslationEnabled()) {
    return res.status(400).json({
      message:
        'Machine translation is not configured. Enable MYMEMORY_TRANSLATE_ENABLED or set GOOGLE_TRANSLATE_API_KEY / LIBRETRANSLATE_URL first.'
    });
  }

  const rows = await prisma.product.findMany({
    where: {
      OR: [{ nameFr: null }, { nameFr: '' }, { descriptionFr: null }, { descriptionFr: '' }]
    },
    select: {
      id: true,
      name: true,
      description: true,
      nameFr: true,
      descriptionFr: true
    }
  });

  let translated = 0;
  let skipped = 0;

  for (const row of rows) {
    const out = await ensureProductFrenchFields({
      name: row.name,
      description: row.description,
      existingNameFr: row.nameFr,
      existingDescriptionFr: row.descriptionFr
    });

    if (!out.nameFr && !out.descriptionFr) {
      skipped += 1;
      continue;
    }

    await prisma.product.update({
      where: { id: row.id },
      data: {
        nameFr: out.nameFr,
        descriptionFr: out.descriptionFr
      }
    });
    translated += 1;
  }

  return res.json({
    total: rows.length,
    translated,
    skipped
  });
});

export default router;

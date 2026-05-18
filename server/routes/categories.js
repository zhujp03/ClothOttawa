import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdminPermission } from '../middleware/auth.js';
import { uniqueSlug } from '../lib/slug.js';
import { translateText, isMachineTranslationEnabled } from '../lib/translator.js';
import { ADMIN_PERMISSION } from '../lib/admin-permissions.js';

const router = Router();

const categorySchema = z.object({
  name: z.string().min(2).max(80),
  slug: z.string().min(2).max(90).optional(),
  parentId: z.coerce.number().int().positive().nullable().optional()
});

function buildTree(items) {
  const map = new Map(items.map((item) => [item.id, { ...item, children: [] }]));
  const roots = [];

  for (const item of map.values()) {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId).children.push(item);
    } else {
      roots.push(item);
    }
  }

  return roots;
}

function resolveLocale(req) {
  const headerLocale = String(req.headers['x-locale'] || '').toLowerCase();
  const queryLocale = String(req.query.lang || '').toLowerCase();
  const locale = queryLocale || headerLocale;
  return locale === 'fr' ? 'fr' : 'en';
}

function localizeCategory(category, locale = 'en') {
  if (locale !== 'fr') return category;
  return {
    ...category,
    name: category.nameFr || category.name
  };
}

async function ensureCategoryFrenchName(name, existingFrenchName = null) {
  if (existingFrenchName && String(existingFrenchName).trim()) return String(existingFrenchName).trim();
  const translated = await translateText(name, { target: 'fr', source: 'en' });
  return translated || null;
}

async function hydrateFrenchNames(rows = []) {
  if (!isMachineTranslationEnabled()) return rows;
  const output = [...rows];

  for (let i = 0; i < output.length; i += 1) {
    const row = output[i];
    if (row.nameFr && String(row.nameFr).trim()) continue;
    const nameFr = await ensureCategoryFrenchName(row.name, null);
    if (!nameFr) continue;
    await prisma.category.update({
      where: { id: row.id },
      data: { nameFr }
    });
    output[i] = { ...row, nameFr };
  }

  return output;
}

async function ensureFallbackCategory(excludeId = null) {
  const existing = await prisma.category.findFirst({
    where: {
      ...(excludeId ? { id: { not: excludeId } } : {}),
      OR: [{ slug: 'uncategorized' }, { name: 'Uncategorized' }]
    },
    orderBy: { id: 'asc' }
  });

  if (existing) return existing;

  const slug = await uniqueSlug(prisma, 'category', 'uncategorized');
  const name = 'Uncategorized';
  const nameFr = await ensureCategoryFrenchName(name, null);
  return prisma.category.create({
    data: {
      name,
      nameFr,
      slug,
      parentId: null
    }
  });
}

router.get('/', async (req, res) => {
  const locale = resolveLocale(req);
  const flat = await prisma.category.findMany({
    include: {
      _count: { select: { products: true, children: true } }
    },
    orderBy: [{ parentId: 'asc' }, { name: 'asc' }]
  });

  const baseRows = locale === 'fr' ? await hydrateFrenchNames(flat) : flat;
  const localizedFlat = baseRows.map((item) => localizeCategory(item, locale));

  if (req.query.tree === '1') {
    return res.json(buildTree(localizedFlat));
  }

  return res.json(localizedFlat);
});

router.post('/', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (req, res) => {
  const parsed = categorySchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  const { name, parentId = null, slug } = parsed.data;

  if (parentId) {
    const parent = await prisma.category.findUnique({ where: { id: parentId } });

    if (!parent) {
      return res.status(404).json({ message: 'Parent category not found' });
    }
  }

  const nextSlug = await uniqueSlug(prisma, 'category', slug || name);
  const nameFr = await ensureCategoryFrenchName(name, null);

  const category = await prisma.category.create({
    data: {
      name,
      nameFr,
      slug: nextSlug,
      parentId
    }
  });

  return res.status(201).json(category);
});

router.put('/:id', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (req, res) => {
  const id = Number(req.params.id);
  const parsed = categorySchema.partial().safeParse(req.body);

  if (!id || !parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.success ? [] : parsed.error.issues });
  }

  const existing = await prisma.category.findUnique({ where: { id } });

  if (!existing) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const data = {};
  if (typeof parsed.data.name === 'string') {
    data.name = parsed.data.name;
    data.nameFr = await ensureCategoryFrenchName(parsed.data.name, existing.nameFr);
  }

  if (Object.prototype.hasOwnProperty.call(parsed.data, 'parentId')) {
    data.parentId = parsed.data.parentId;
  }

  if (parsed.data.slug || parsed.data.name) {
    data.slug = await uniqueSlug(prisma, 'category', parsed.data.slug || parsed.data.name, id);
  }

  if (data.parentId === id) {
    return res.status(400).json({ message: 'Category cannot be parent of itself' });
  }

  const updated = await prisma.category.update({ where: { id }, data });
  return res.json(updated);
});

router.post('/auto-translate', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (_req, res) => {
  if (!isMachineTranslationEnabled()) {
    return res.status(400).json({
      message:
        'Machine translation is not configured. Enable MYMEMORY_TRANSLATE_ENABLED or set GOOGLE_TRANSLATE_API_KEY / LIBRETRANSLATE_URL first.'
    });
  }

  const rows = await prisma.category.findMany({
    where: {
      OR: [{ nameFr: null }, { nameFr: '' }]
    },
    select: { id: true, name: true }
  });

  let translated = 0;
  let skipped = 0;

  for (const row of rows) {
    const nameFr = await ensureCategoryFrenchName(row.name, null);
    if (!nameFr) {
      skipped += 1;
      continue;
    }
    await prisma.category.update({
      where: { id: row.id },
      data: { nameFr }
    });
    translated += 1;
  }

  return res.json({
    total: rows.length,
    translated,
    skipped
  });
});

router.delete('/:id', requireAdminPermission(ADMIN_PERMISSION.CATALOG), async (req, res) => {
  const id = Number(req.params.id);

  if (!id) {
    return res.status(400).json({ message: 'Invalid category id' });
  }

  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { children: true, products: true } } }
  });

  if (!category) {
    return res.status(404).json({ message: 'Category not found' });
  }

  const hasReferences = category._count.children > 0 || category._count.products > 0;

  if (!hasReferences) {
    await prisma.category.delete({ where: { id } });
    return res.json({
      deleted: true,
      movedProducts: 0,
      detachedChildren: 0
    });
  }

  const fallback = await ensureFallbackCategory(id);

  const result = await prisma.$transaction(async (tx) => {
    const movedProducts = await tx.product.updateMany({
      where: { categoryId: id },
      data: { categoryId: fallback.id }
    });

    const detachedChildren = await tx.category.updateMany({
      where: { parentId: id },
      data: { parentId: null }
    });

    await tx.category.delete({ where: { id } });

    return {
      movedProducts: movedProducts.count,
      detachedChildren: detachedChildren.count
    };
  });

  return res.json({
    deleted: true,
    movedToCategory: {
      id: fallback.id,
      name: fallback.name
    },
    movedProducts: result.movedProducts,
    detachedChildren: result.detachedChildren
  });
});

export default router;

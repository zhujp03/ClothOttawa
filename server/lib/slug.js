export function slugify(value = '') {
  return value
    .toString()
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || 'item';
}

export async function uniqueSlug(prisma, modelName, baseValue, excludeId) {
  const baseSlug = slugify(baseValue);
  let candidate = baseSlug;
  let index = 1;

  while (true) {
    const found = await prisma[modelName].findFirst({
      where: {
        slug: candidate,
        ...(excludeId ? { id: { not: excludeId } } : {})
      },
      select: { id: true }
    });

    if (!found) {
      return candidate;
    }

    candidate = `${baseSlug}-${index}`;
    index += 1;
  }
}

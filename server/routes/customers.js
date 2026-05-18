import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAdminPermission } from '../middleware/auth.js';
import { ADMIN_PERMISSION } from '../lib/admin-permissions.js';

const router = Router();

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ''), 10);
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback;
  return parsed;
}

router.get('/', requireAdminPermission(ADMIN_PERMISSION.CUSTOMERS), async (req, res) => {
  const query = String(req.query.query || '').trim();
  const limit = Math.min(500, toPositiveInt(req.query.limit, 200));

  const customers = await prisma.customerUser.findMany({
    where: {
      emailVerified: true,
      isSuspended: false
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerifiedAt: true,
      isSuspended: true,
      suspendedAt: true,
      suspendedReason: true,
      firstName: true,
      lastName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    take: limit
  });

  const normalized = query.toLowerCase();
  const filtered = normalized
    ? customers.filter((customer) => {
        const first = String(customer.firstName || '');
        const last = String(customer.lastName || '');
        const full = `${first} ${last}`.trim();
        const haystack = [first, last, full, customer.email, customer.phone]
          .map((row) => String(row || '').toLowerCase())
          .join(' | ');
        return haystack.includes(normalized);
      })
    : customers;

  return res.json(filtered);
});

router.get('/blocked', requireAdminPermission(ADMIN_PERMISSION.CUSTOMERS), async (req, res) => {
  const query = String(req.query.query || '').trim().toLowerCase();
  const limit = Math.min(500, toPositiveInt(req.query.limit, 200));

  const blockedUsers = await prisma.customerUser.findMany({
    where: {
      isSuspended: true
    },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      emailVerifiedAt: true,
      isSuspended: true,
      suspendedAt: true,
      suspendedReason: true,
      firstName: true,
      lastName: true,
      phone: true,
      addressLine1: true,
      addressLine2: true,
      city: true,
      province: true,
      postalCode: true,
      country: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: [{ suspendedAt: 'desc' }, { id: 'desc' }],
    take: limit
  });

  if (!query) {
    return res.json(blockedUsers);
  }

  const filtered = blockedUsers.filter((customer) => {
    const first = String(customer.firstName || '');
    const last = String(customer.lastName || '');
    const full = `${first} ${last}`.trim();
    const haystack = [first, last, full, customer.email, customer.phone]
      .map((row) => String(row || '').toLowerCase())
      .join(' | ');
    return haystack.includes(query);
  });

  return res.json(filtered);
});

router.post('/:id/suspend', requireAdminPermission(ADMIN_PERMISSION.CUSTOMERS), async (req, res) => {
  const id = toPositiveInt(req.params.id, 0);
  if (!id) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }

  const customer = await prisma.customerUser.findUnique({ where: { id } });
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const normalizedEmail = customer.email.toLowerCase();
  await prisma.$transaction([
    prisma.blockedEmail.upsert({
      where: { email: normalizedEmail },
      create: {
        email: normalizedEmail,
        reason: 'Suspended by admin'
      },
      update: {
        reason: 'Suspended by admin'
      }
    }),
    prisma.customerUser.update({
      where: { id },
      data: {
        isSuspended: true,
        suspendedAt: new Date(),
        suspendedReason: 'Suspended by admin'
      }
    })
  ]);

  return res.json({ success: true });
});

router.post('/:id/unsuspend', requireAdminPermission(ADMIN_PERMISSION.CUSTOMERS), async (req, res) => {
  const id = toPositiveInt(req.params.id, 0);
  if (!id) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }

  const customer = await prisma.customerUser.findUnique({ where: { id } });
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const normalizedEmail = customer.email.toLowerCase();
  await prisma.$transaction([
    prisma.blockedEmail.deleteMany({
      where: { email: normalizedEmail }
    }),
    prisma.customerUser.update({
      where: { id },
      data: {
        isSuspended: false,
        suspendedAt: null,
        suspendedReason: null
      }
    })
  ]);

  return res.json({ success: true });
});

router.delete('/:id', requireAdminPermission(ADMIN_PERMISSION.CUSTOMERS), async (req, res) => {
  const id = toPositiveInt(req.params.id, 0);
  if (!id) {
    return res.status(400).json({ message: 'Invalid customer id' });
  }

  const customer = await prisma.customerUser.findUnique({
    where: { id },
    select: { id: true, email: true }
  });
  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  await prisma.$transaction([
    prisma.blockedEmail.deleteMany({
      where: { email: customer.email.toLowerCase() }
    }),
    prisma.customerUser.delete({ where: { id } })
  ]);
  return res.json({ success: true });
});

export default router;

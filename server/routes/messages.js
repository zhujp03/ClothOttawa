import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdminPermission, requireCustomer } from '../middleware/auth.js';
import { ADMIN_PERMISSION } from '../lib/admin-permissions.js';

const router = Router();

const createMessageSchema = z.object({
  message: z.string().min(3).max(3000)
});

router.post('/', requireCustomer, async (req, res) => {
  const parsed = createMessageSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  const customer = await prisma.customerUser.findUnique({
    where: { id: req.auth.id }
  });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  const created = await prisma.contactMessage.create({
    data: {
      customerId: customer.id,
      message: parsed.data.message.trim()
    }
  });

  return res.status(201).json(created);
});

router.get('/', requireAdminPermission(ADMIN_PERMISSION.MESSAGES), async (_req, res) => {
  const items = await prisma.contactMessage.findMany({
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          addressLine1: true,
          addressLine2: true,
          city: true,
          province: true,
          postalCode: true,
          country: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  return res.json(items);
});

router.delete('/:id', requireAdminPermission(ADMIN_PERMISSION.MESSAGES), async (req, res) => {
  const id = Number(req.params.id);
  if (!id) {
    return res.status(400).json({ message: 'Invalid message id' });
  }

  const existing = await prisma.contactMessage.findUnique({ where: { id } });
  if (!existing) {
    return res.status(404).json({ message: 'Message not found' });
  }

  await prisma.contactMessage.delete({ where: { id } });
  return res.status(204).send();
});

export default router;

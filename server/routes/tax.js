import { Router } from 'express';
import { z } from 'zod';
import { calculateTaxQuote, getTaxReferencePayload } from '../lib/tax.js';

const router = Router();

const quoteSchema = z.object({
  country: z.string().min(1).max(80),
  region: z.string().min(1).max(120).optional().or(z.literal('')),
  subtotalCents: z.coerce.number().int().min(0)
});

router.get('/reference', (_req, res) => {
  return res.json(getTaxReferencePayload());
});

router.post('/quote', (req, res) => {
  const parsed = quoteSchema.safeParse(req.body || {});
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid tax quote payload', errors: parsed.error.issues });
  }
  const quote = calculateTaxQuote({
    country: parsed.data.country,
    region: parsed.data.region || '',
    subtotalCents: parsed.data.subtotalCents
  });
  return res.json(quote);
});

export default router;

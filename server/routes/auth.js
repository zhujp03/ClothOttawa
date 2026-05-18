import { Router } from 'express';
import { createHash, randomBytes } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../lib/prisma.js';
import { requireAdmin, requireCustomer } from '../middleware/auth.js';
import { sendCustomerVerificationEmail } from '../lib/email.js';
import { getAdminPermissions, normalizeAdminRole } from '../lib/admin-permissions.js';
import {
  phoneHash,
  postalCodeHash,
  addressHash,
  matchesNormalizedPhone,
  matchesNormalizedPostal
} from '../lib/pii.js';
import { resolveCountryRegion } from '../lib/tax.js';

const router = Router();

const adminLoginSchema = z.object({
  username: z.string().min(2).max(60),
  password: z.string().min(6).max(72)
});

const customerRegisterSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8).max(72),
    confirmPassword: z.string().min(8).max(72),
    firstName: z.string().min(1).max(60),
    lastName: z.string().min(1).max(60),
    phone: z.string().min(7).max(30),
    addressLine1: z.string().min(3).max(140),
    addressLine2: z.string().max(140).optional().or(z.literal('')),
    city: z.string().min(2).max(80),
    province: z.string().min(2).max(80),
    postalCode: z.string().min(3).max(20),
    country: z.string().min(2).max(80).default('Canada'),
    acceptedTerms: z.literal(true)
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

const customerLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(72)
});

const customerEmailSchema = z.object({
  email: z.string().email()
});

const customerVerifyEmailSchema = z.object({
  token: z.string().min(24).max(256)
});

const customerProfileSchema = z.object({
  firstName: z.string().min(1).max(60),
  lastName: z.string().min(1).max(60),
  phone: z.string().min(7).max(30),
  addressLine1: z.string().min(3).max(140),
  addressLine2: z.string().max(140).optional().or(z.literal('')),
  city: z.string().min(2).max(80),
  province: z.string().min(2).max(80),
  postalCode: z.string().min(3).max(20),
  country: z.string().min(2).max(80)
});

const customerForgotResetSchema = z.object({
  email: z.string().email(),
  phone: z.string().min(7).max(30),
  postalCode: z.string().min(3).max(20),
  newPassword: z.string().min(8).max(72)
});

function serializeCustomer(customer) {
  return {
    id: customer.id,
    email: customer.email,
    isSuspended: customer.isSuspended,
    suspendedAt: customer.suspendedAt,
    emailVerified: customer.emailVerified,
    emailVerifiedAt: customer.emailVerifiedAt,
    firstName: customer.firstName,
    lastName: customer.lastName,
    phone: customer.phone,
    addressLine1: customer.addressLine1,
    addressLine2: customer.addressLine2,
    city: customer.city,
    province: customer.province,
    postalCode: customer.postalCode,
    country: customer.country,
    termsAccepted: customer.termsAccepted,
    termsAcceptedAt: customer.termsAcceptedAt
  };
}

function signCustomerToken(customer) {
  return jwt.sign(
    {
      id: customer.id,
      email: customer.email,
      role: 'customer'
    },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

function hashVerificationToken(rawToken) {
  return createHash('sha256').update(rawToken).digest('hex');
}

function generateEmailVerificationToken() {
  const rawToken = randomBytes(32).toString('hex');
  return {
    rawToken,
    tokenHash: hashVerificationToken(rawToken),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
  };
}

router.post('/login', async (req, res) => {
  const parsed = adminLoginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload', errors: parsed.error.issues });
  }

  const { username, password } = parsed.data;
  const normalizedUsername = username.trim().toLowerCase();
  const admin = await prisma.adminUser.findUnique({ where: { username: normalizedUsername } });

  if (!admin) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValidPassword = await bcrypt.compare(password, admin.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const adminRole = normalizeAdminRole(admin.role);
  const permissions = getAdminPermissions(adminRole);
  const token = jwt.sign(
    {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: 'admin',
      adminRole,
      permissions
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '12h'
    }
  );

  return res.json({
    token,
    admin: {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      role: adminRole,
      permissions
    }
  });
});

router.get('/admin/me', requireAdmin, async (req, res) => {
  return res.json({
    admin: {
      id: req.auth.id,
      username: req.auth.username,
      email: req.auth.email,
      role: req.auth.adminRole,
      permissions: req.auth.permissions || []
    }
  });
});

router.post('/customer/register', async (req, res) => {
  const parsed = customerRegisterSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid register payload', errors: parsed.error.issues });
  }

  const normalizedEmail = parsed.data.email.toLowerCase();
  const blocked = await prisma.blockedEmail.findUnique({ where: { email: normalizedEmail } });
  if (blocked) {
    return res.status(403).json({
      code: 'EMAIL_BLOCKED',
      message: 'This email is not valid for registration.'
    });
  }

  const existing = await prisma.customerUser.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    return res.status(409).json({ message: 'Email already registered' });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 12);
  const resolved = resolveCountryRegion(parsed.data.country, parsed.data.province);
  if (!resolved.valid) {
    return res.status(400).json({ message: 'Country and province/state combination is invalid.' });
  }

  const verification = generateEmailVerificationToken();

  const customer = await prisma.customerUser.create({
    data: {
      email: normalizedEmail,
      emailVerified: false,
      emailVerifyTokenHash: verification.tokenHash,
      emailVerifyTokenExpiresAt: verification.expiresAt,
      passwordHash,
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone.trim(),
      phoneHash: phoneHash(parsed.data.phone),
      addressLine1: parsed.data.addressLine1.trim(),
      addressLine2: parsed.data.addressLine2?.trim() || null,
      city: parsed.data.city.trim(),
      province: resolved.regionName,
      postalCode: parsed.data.postalCode.trim(),
      postalCodeHash: postalCodeHash(parsed.data.postalCode),
      addressHash: addressHash({
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2,
        city: parsed.data.city,
        province: resolved.regionName,
        country: resolved.countryName
      }),
      country: resolved.countryName,
      termsAccepted: true,
      termsAcceptedAt: new Date()
    }
  });

  const mailResult = await sendCustomerVerificationEmail({
    email: customer.email,
    firstName: customer.firstName,
    verifyToken: verification.rawToken
  });

  return res.status(201).json({
    requiresEmailVerification: true,
    emailSent: mailResult.sent,
    message: mailResult.sent
      ? 'Registration successful. Please verify your email before logging in.'
      : 'Registration successful. Email service is not configured yet, so verification email was not sent.',
    ...(mailResult.sent || process.env.NODE_ENV === 'production'
      ? {}
      : { debugVerifyUrl: mailResult.verifyUrl }),
    customer: serializeCustomer(customer)
  });
});

router.post('/customer/login', async (req, res) => {
  const parsed = customerLoginSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid login payload', errors: parsed.error.issues });
  }

  const customer = await prisma.customerUser.findUnique({ where: { email: parsed.data.email.toLowerCase() } });

  if (!customer) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const blocked = await prisma.blockedEmail.findUnique({ where: { email: customer.email } });
  if (blocked || customer.isSuspended) {
    return res.status(403).json({
      code: 'ACCOUNT_SUSPENDED',
      message: 'This account has been suspended or is not valid.'
    });
  }

  const isValidPassword = await bcrypt.compare(parsed.data.password, customer.passwordHash);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  if (!customer.emailVerified) {
    return res.status(403).json({
      code: 'EMAIL_NOT_VERIFIED',
      message: 'Please verify your email before logging in.'
    });
  }

  const token = signCustomerToken(customer);

  return res.json({
    token,
    customer: serializeCustomer(customer)
  });
});

router.get('/customer/session-status', requireCustomer, async (req, res) => {
  const customer = await prisma.customerUser.findUnique({
    where: { id: req.auth.id },
    select: {
      id: true,
      email: true,
      isSuspended: true
    }
  });

  if (!customer) {
    return res.status(401).json({
      code: 'ACCOUNT_NOT_FOUND',
      message: 'This account is not valid anymore.'
    });
  }

  if (customer.isSuspended) {
    return res.status(403).json({
      code: 'ACCOUNT_SUSPENDED',
      message: 'This account has been suspended.'
    });
  }

  return res.json({ ok: true });
});

router.post('/customer/verify-email', async (req, res) => {
  const parsed = customerVerifyEmailSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid verification payload', errors: parsed.error.issues });
  }

  const now = new Date();
  const tokenHash = hashVerificationToken(parsed.data.token.trim());

  const customer = await prisma.customerUser.findFirst({
    where: {
      emailVerifyTokenHash: tokenHash,
      emailVerifyTokenExpiresAt: { gt: now }
    }
  });

  if (!customer) {
    return res.status(400).json({ message: 'Verification link is invalid or expired' });
  }

  if (customer.emailVerified) {
    return res.json({ success: true, alreadyVerified: true });
  }

  await prisma.customerUser.update({
    where: { id: customer.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      emailVerifyTokenHash: null,
      emailVerifyTokenExpiresAt: null
    }
  });

  return res.json({ success: true, verified: true });
});

router.post('/customer/resend-verification', async (req, res) => {
  const parsed = customerEmailSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid payload', errors: parsed.error.issues });
  }

  const email = parsed.data.email.toLowerCase().trim();
  const blocked = await prisma.blockedEmail.findUnique({ where: { email } });
  if (blocked) {
    return res.json({
      success: true,
      message: 'If the account exists, a new verification email has been sent.'
    });
  }

  const customer = await prisma.customerUser.findUnique({
    where: { email }
  });

  if (!customer) {
    return res.json({
      success: true,
      message: 'If the account exists, a new verification email has been sent.'
    });
  }

  if (customer.emailVerified) {
    return res.json({ success: true, message: 'This account is already verified.' });
  }

  if (customer.isSuspended) {
    return res.json({
      success: true,
      message: 'If the account exists, a new verification email has been sent.'
    });
  }

  const verification = generateEmailVerificationToken();

  await prisma.customerUser.update({
    where: { id: customer.id },
    data: {
      emailVerifyTokenHash: verification.tokenHash,
      emailVerifyTokenExpiresAt: verification.expiresAt
    }
  });

  const mailResult = await sendCustomerVerificationEmail({
    email: customer.email,
    firstName: customer.firstName,
    verifyToken: verification.rawToken
  });

  return res.json({
    success: true,
    emailSent: mailResult.sent,
    message: mailResult.sent
      ? 'Verification email sent. Please check your inbox.'
      : 'Email service is not configured yet, so verification email was not sent.',
    ...(mailResult.sent || process.env.NODE_ENV === 'production'
      ? {}
      : { debugVerifyUrl: mailResult.verifyUrl })
  });
});

router.post('/customer/forgot-password/reset', async (req, res) => {
  const parsed = customerForgotResetSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid reset payload', errors: parsed.error.issues });
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();
  const blocked = await prisma.blockedEmail.findUnique({ where: { email: normalizedEmail } });
  if (blocked) {
    return res.status(403).json({ message: 'This account has been suspended or is not valid.' });
  }

  const customer = await prisma.customerUser.findUnique({ where: { email: normalizedEmail } });

  if (!customer) {
    return res.status(404).json({ message: 'No user matched the provided information' });
  }

  if (customer.isSuspended) {
    return res.status(403).json({ message: 'This account has been suspended or is not valid.' });
  }

  const inputPhoneHash = phoneHash(parsed.data.phone);
  const inputPostalHash = postalCodeHash(parsed.data.postalCode);

  const phoneMatched = customer.phoneHash
    ? customer.phoneHash === inputPhoneHash
    : matchesNormalizedPhone(customer.phone, parsed.data.phone);
  const postalMatched = customer.postalCodeHash
    ? customer.postalCodeHash === inputPostalHash
    : matchesNormalizedPostal(customer.postalCode, parsed.data.postalCode);

  if (!phoneMatched || !postalMatched) {
    return res.status(403).json({ message: 'Verification failed. Please check email, phone, and postal code.' });
  }

  const newPasswordHash = await bcrypt.hash(parsed.data.newPassword, 12);

  await prisma.customerUser.update({
    where: { id: customer.id },
    data: {
      passwordHash: newPasswordHash
    }
  });

  return res.json({ success: true, message: 'Password reset successful' });
});

router.get('/customer/me', requireCustomer, async (req, res) => {
  const customer = await prisma.customerUser.findUnique({ where: { id: req.auth.id } });

  if (!customer) {
    return res.status(404).json({ message: 'Customer not found' });
  }

  return res.json({ customer: serializeCustomer(customer) });
});

router.put('/customer/me', requireCustomer, async (req, res) => {
  const parsed = customerProfileSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid profile payload', errors: parsed.error.issues });
  }
  const resolved = resolveCountryRegion(parsed.data.country, parsed.data.province);
  if (!resolved.valid) {
    return res.status(400).json({ message: 'Country and province/state combination is invalid.' });
  }

  const updated = await prisma.customerUser.update({
    where: { id: req.auth.id },
    data: {
      firstName: parsed.data.firstName.trim(),
      lastName: parsed.data.lastName.trim(),
      phone: parsed.data.phone.trim(),
      phoneHash: phoneHash(parsed.data.phone),
      addressLine1: parsed.data.addressLine1.trim(),
      addressLine2: parsed.data.addressLine2?.trim() || null,
      city: parsed.data.city.trim(),
      province: resolved.regionName,
      postalCode: parsed.data.postalCode.trim(),
      postalCodeHash: postalCodeHash(parsed.data.postalCode),
      addressHash: addressHash({
        addressLine1: parsed.data.addressLine1,
        addressLine2: parsed.data.addressLine2,
        city: parsed.data.city,
        province: resolved.regionName,
        country: resolved.countryName
      }),
      country: resolved.countryName
    }
  });

  return res.json({ customer: serializeCustomer(updated) });
});

export default router;

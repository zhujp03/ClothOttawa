import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { getAdminPermissions, hasAdminPermission, normalizeAdminRole } from '../lib/admin-permissions.js';

function extractBearerToken(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  return authHeader.slice(7);
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}

function requireRole(role, requiredPermissions = []) {
  return async (req, res, next) => {
    const token = extractBearerToken(req);

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: missing token' });
    }

    let decoded;
    try {
      decoded = verifyToken(token);
    } catch {
      return res.status(401).json({ message: 'Unauthorized: invalid token' });
    }

    if (decoded.role !== role) {
      return res.status(403).json({ message: 'Forbidden: insufficient permission' });
    }

    if (role === 'customer') {
      try {
        const customer = await prisma.customerUser.findUnique({
          where: { id: decoded.id },
          select: { id: true, isSuspended: true }
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
      } catch (error) {
        return next(error);
      }
    }

    if (role === 'admin') {
      try {
        const admin = await prisma.adminUser.findUnique({
          where: { id: decoded.id },
          select: { id: true, username: true, email: true, role: true }
        });

        if (!admin) {
          return res.status(401).json({ message: 'Unauthorized: admin account not found' });
        }

        const adminRole = normalizeAdminRole(admin.role);
        const permissions = getAdminPermissions(adminRole);
        const permissionsOk = requiredPermissions.every((perm) => hasAdminPermission(adminRole, perm));
        if (!permissionsOk) {
          return res.status(403).json({ message: 'Forbidden: insufficient permission' });
        }

        decoded.username = admin.username;
        decoded.email = admin.email;
        decoded.adminRole = adminRole;
        decoded.permissions = permissions;
      } catch (error) {
        return next(error);
      }
    }

    req.auth = decoded;
    return next();
  };
}

export function tryDecodeAuthToken(req) {
  const token = extractBearerToken(req);

  if (!token) {
    return null;
  }

  try {
    return verifyToken(token);
  } catch {
    return null;
  }
}

export const requireAdmin = requireRole('admin');
export const requireCustomer = requireRole('customer');
export const requireAdminPermission = (permission) =>
  requireRole('admin', Array.isArray(permission) ? permission : [permission]);

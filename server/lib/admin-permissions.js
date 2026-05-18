export const ADMIN_PERMISSION = {
  MESSAGES: 'messages',
  ORDERS: 'orders',
  CATALOG: 'catalog',
  CUSTOMERS: 'customers',
  SALES_REPORTS: 'sales_reports'
};

const ROLE_PERMISSIONS = {
  IVAN: [ADMIN_PERMISSION.MESSAGES, ADMIN_PERMISSION.ORDERS],
  ADMIN: [ADMIN_PERMISSION.MESSAGES, ADMIN_PERMISSION.ORDERS, ADMIN_PERMISSION.CATALOG, ADMIN_PERMISSION.CUSTOMERS],
  OWNER: [
    ADMIN_PERMISSION.MESSAGES,
    ADMIN_PERMISSION.ORDERS,
    ADMIN_PERMISSION.CATALOG,
    ADMIN_PERMISSION.CUSTOMERS,
    ADMIN_PERMISSION.SALES_REPORTS
  ]
};

export function normalizeAdminRole(value) {
  const raw = String(value || '').trim().toUpperCase();
  if (raw === 'IVAN' || raw === 'OWNER' || raw === 'ADMIN') return raw;
  return 'ADMIN';
}

export function getAdminPermissions(role) {
  return ROLE_PERMISSIONS[normalizeAdminRole(role)] || ROLE_PERMISSIONS.ADMIN;
}

export function hasAdminPermission(role, permission) {
  return getAdminPermissions(role).includes(String(permission || '').trim());
}

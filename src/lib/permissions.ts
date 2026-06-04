export const PERMISSIONS = {
  READ_PRODUCTS: "read_products",
  READ_LOCATIONS: "read_locations",
  READ_USERS: "read_users",
  WRITE_PRODUCTS: "write_products",
  WRITE_LOCATIONS: "write_locations",
  WRITE_USERS: "write_users",
  DELETE_PRODUCTS: "delete_products",
  DELETE_LOCATIONS: "delete_locations",
  DELETE_USERS: "delete_users",
  READ_DEBUG: "read_debug",
  READ_LOGS: "read_logs"
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const hasPermission = (
  user: { permissions: Permission[] },
  perm: Permission,
): boolean => user.permissions.includes(perm);

export const hasAnyPermission = (
  user: { permissions: Permission[] },
  perms: Permission[],
): boolean => perms.some((p) => user.permissions.includes(p));

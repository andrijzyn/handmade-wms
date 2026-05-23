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
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const PERMISSION_META: Record<
  Permission,
  { label: string; group: "Read" | "Write" | "Delete" }
> = {
  [PERMISSIONS.READ_PRODUCTS]: { label: "Products", group: "Read" },
  [PERMISSIONS.READ_LOCATIONS]: { label: "Locations", group: "Read" },
  [PERMISSIONS.READ_USERS]: { label: "Users", group: "Read" },
  [PERMISSIONS.READ_DEBUG]: { label: "Debug", group: "Read" },

  [PERMISSIONS.WRITE_PRODUCTS]: { label: "Products", group: "Write" },
  [PERMISSIONS.WRITE_LOCATIONS]: { label: "Locations", group: "Write" },
  [PERMISSIONS.WRITE_USERS]: { label: "Users", group: "Write" },

  [PERMISSIONS.DELETE_PRODUCTS]: { label: "Products", group: "Delete" },
  [PERMISSIONS.DELETE_LOCATIONS]: { label: "Locations", group: "Delete" },
  [PERMISSIONS.DELETE_USERS]: { label: "Users", group: "Delete" },
};

export const hasPermission = (
  user: { permissions: Permission[] },
  perm: Permission,
): boolean => user.permissions.includes(perm);

export const hasAnyPermission = (
  user: { permissions: Permission[] },
  perms: Permission[],
): boolean => perms.some((p) => user.permissions.includes(p));

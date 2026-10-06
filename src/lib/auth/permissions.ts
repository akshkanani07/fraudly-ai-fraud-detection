import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

/**
 * Role-Based Access Control (RBAC) for Fraudly.
 *
 * `defaultStatements` / `adminAc` provide the permissions required by the
 * Better Auth admin plugin (user and session management). On top of them we
 * define the Fraudly resources.
 */

export const statement = {
  ...defaultStatements,
  transaction: ["read", "create", "update", "delete", "export"],
  prediction: ["read", "create"],
  dataset: ["read", "upload", "clean", "delete"],
  model: ["read", "train", "retrain", "activate", "delete"],
  report: ["read", "generate", "delete"],
  analytics: ["read"],
  notification: ["read", "manage"],
  auditLog: ["read"],
  setting: ["read", "update"],
} as const;

export const ac = createAccessControl(statement);

export const ROLES = {
  ADMIN: "admin",
  ANALYST: "analyst",
  USER: "user",
} as const;

export type AppRole = (typeof ROLES)[keyof typeof ROLES];

export const DEFAULT_ROLE: AppRole = ROLES.USER;

const adminRole = ac.newRole({
  ...adminAc.statements,
  transaction: ["read", "create", "update", "delete", "export"],
  prediction: ["read", "create"],
  dataset: ["read", "upload", "clean", "delete"],
  model: ["read", "train", "retrain", "activate", "delete"],
  report: ["read", "generate", "delete"],
  analytics: ["read"],
  notification: ["read", "manage"],
  auditLog: ["read"],
  setting: ["read", "update"],
});

const analystRole = ac.newRole({
  transaction: ["read", "create", "update", "export"],
  prediction: ["read", "create"],
  dataset: ["read", "upload", "clean"],
  model: ["read", "train", "retrain", "activate"],
  report: ["read", "generate"],
  analytics: ["read"],
  notification: ["read", "manage"],
});

const userRole = ac.newRole({
  transaction: ["read"],
  prediction: ["read"],
  dataset: ["read"],
  model: ["read"],
  report: ["read"],
  analytics: ["read"],
  notification: ["read", "manage"],
});

export const roles = {
  [ROLES.ADMIN]: adminRole,
  [ROLES.ANALYST]: analystRole,
  [ROLES.USER]: userRole,
} as const;

export type Permissions = {
  [Resource in keyof typeof statement]?: Array<(typeof statement)[Resource][number]>;
};

export function isAppRole(value: string): value is AppRole {
  return value in roles;
}

/**
 * Checks whether a role (or a comma-separated list of roles, as stored by the
 * admin plugin) grants every requested permission. Safe to use on the server
 * and in the browser.
 */
export function roleHasPermission(
  role: string | null | undefined,
  permissions: Permissions,
): boolean {
  const roleNames = (role ?? DEFAULT_ROLE)
    .split(",")
    .map((name) => name.trim())
    .filter(isAppRole);

  return roleNames.some((name) => {
    const definition = roles[name];
    return definition.authorize(permissions as never).success;
  });
}
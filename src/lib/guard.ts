import { getCurrentUser, type UserRole, type UserSession } from "./auth";

/**
 * Ensures a valid session exists. Throws if unauthenticated.
 */
export async function requireUser(): Promise<UserSession> {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED: Session missing or expired.");
  }
  return user;
}

/**
 * Ensures the authenticated user has one of the specified roles.
 */
export async function requireRole(...allowedRoles: UserRole[]): Promise<UserSession> {
  const user = await requireUser();
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`FORBIDDEN: User role '${user.role}' is not authorized for this action.`);
  }
  return user;
}

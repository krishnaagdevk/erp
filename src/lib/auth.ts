import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { cache } from "react";
import prisma from "./prisma";
import { JWT_SECRET } from "./env";

export type UserRole = "admin" | "teacher" | "student" | "parent" | "accountant";

export interface UserSession {
  id: string;
  username: string;
  role: UserRole;
  name?: string;
  surname?: string;
  email?: string | null;
  img?: string | null;
}

const TOKEN_COOKIE_NAME = "session_token";
const encodedSecret = new TextEncoder().encode(JWT_SECRET);
const DUMMY_HASH = "$2a$10$e8w8G503R6L8u.yP3i0n4u7sJ.rX8YvjL5W1N8Qy6gUjY4h4G.5yq";

/**
 * Hash a plain text password
 */
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

/**
 * Compare a plain password with a hashed password safely
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  if (!hash || !hash.startsWith("$2")) {
    return false;
  }
  try {
    return await bcrypt.compare(password, hash);
  } catch {
    return false;
  }
}

/**
 * Sign a JWT token with user session payload using jose
 */
export async function signJWT(payload: UserSession): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(encodedSecret);
}

/**
 * Verify a JWT token and return the decoded payload using jose
 */
export async function verifyJWT(token: string): Promise<UserSession | null> {
  try {
    const { payload } = await jwtVerify(token, encodedSecret, {
      algorithms: ["HS256"],
    });
    return payload as unknown as UserSession;
  } catch {
    return null;
  }
}

/**
 * Authenticate a user by username and password with timing-attack mitigation
 */
export async function authenticateUser(
  username: string,
  password: string,
  preferredRole?: UserRole
): Promise<{ success: boolean; user?: UserSession; error?: string }> {
  try {
    const trimmedUsername = username.trim();
    let foundPasswordHash: string | null = null;
    let authenticatedUser: UserSession | null = null;

    // 1. Check Admin
    if (!preferredRole || preferredRole === "admin") {
      const admin = await prisma.admin.findUnique({
        where: { username: trimmedUsername },
      });
      if (admin) {
        foundPasswordHash = admin.password;
        if (await verifyPassword(password, admin.password)) {
          authenticatedUser = {
            id: admin.id,
            username: admin.username,
            role: "admin",
            name: "Admin",
            surname: admin.username,
          };
        }
      }
    }

    // 2. Check Accountant
    if (!authenticatedUser && (!preferredRole || preferredRole === "accountant")) {
      const accountant = await prisma.accountant.findUnique({
        where: { username: trimmedUsername },
      });
      if (accountant) {
        foundPasswordHash = accountant.password;
        if (await verifyPassword(password, accountant.password)) {
          authenticatedUser = {
            id: accountant.id,
            username: accountant.username,
            role: "accountant",
            name: accountant.name,
            surname: accountant.surname,
            email: accountant.email,
            img: accountant.img,
          };
        }
      }
    }

    // 3. Check Teacher
    if (!authenticatedUser && (!preferredRole || preferredRole === "teacher")) {
      const teacher = await prisma.teacher.findUnique({
        where: { username: trimmedUsername },
      });
      if (teacher) {
        foundPasswordHash = teacher.password;
        if (await verifyPassword(password, teacher.password)) {
          authenticatedUser = {
            id: teacher.id,
            username: teacher.username,
            role: "teacher",
            name: teacher.name,
            surname: teacher.surname,
            email: teacher.email,
            img: teacher.img,
          };
        }
      }
    }

    // 4. Check Student
    if (!authenticatedUser && (!preferredRole || preferredRole === "student")) {
      const student = await prisma.student.findUnique({
        where: { username: trimmedUsername },
      });
      if (student) {
        foundPasswordHash = student.password;
        if (await verifyPassword(password, student.password)) {
          authenticatedUser = {
            id: student.id,
            username: student.username,
            role: "student",
            name: student.name,
            surname: student.surname,
            email: student.email,
            img: student.img,
          };
        }
      }
    }

    // 5. Check Parent
    if (!authenticatedUser && (!preferredRole || preferredRole === "parent")) {
      const parent = await prisma.parent.findUnique({
        where: { username: trimmedUsername },
      });
      if (parent) {
        foundPasswordHash = parent.password;
        if (await verifyPassword(password, parent.password)) {
          authenticatedUser = {
            id: parent.id,
            username: parent.username,
            role: "parent",
            name: parent.name,
            surname: parent.surname,
            email: parent.email,
          };
        }
      }
    }

    // Timing-attack mitigation: if user was not found, perform dummy bcrypt compare
    if (!foundPasswordHash) {
      await bcrypt.compare(password, DUMMY_HASH);
    }

    if (authenticatedUser) {
      return { success: true, user: authenticatedUser };
    }

    return { success: false, error: "Invalid username or password." };
  } catch (error) {
    console.error("Auth Error:", error);
    return { success: false, error: "An error occurred during authentication." };
  }
}

/**
 * Set session cookie
 */
export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7, // 7 days
  });
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_COOKIE_NAME);
}

/**
 * Get current session user from cookies in server components/actions
 */
export const getCurrentUser = cache(async (): Promise<UserSession | null> => {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE_NAME)?.value;
    if (!token) return null;
    return await verifyJWT(token);
  } catch {
    return null;
  }
});

/**
 * Drop-in helper matching Clerk's auth() interface
 */
export async function auth() {
  const user = await getCurrentUser();
  return {
    userId: user?.id || null,
    sessionClaims: user
      ? {
          metadata: {
            role: user.role,
          },
        }
      : null,
  };
}

/**
 * Drop-in helper matching Clerk's currentUser() interface
 */
export async function currentUser() {
  const user = await getCurrentUser();
  if (!user) return null;
  return {
    id: user.id,
    username: user.username,
    firstName: user.name,
    lastName: user.surname,
    imageUrl: user.img || "/avatar.png",
    emailAddresses: user.email ? [{ emailAddress: user.email }] : [],
    publicMetadata: {
      role: user.role,
    },
  };
}

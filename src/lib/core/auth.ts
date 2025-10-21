/**
 * ProCheff Authentication Service
 * JWT token management ve role-based authorization
 */

import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { getEnv } from "../env";
import { prisma, type User, type Session } from "./database";

// JWT payload type
export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  sessionId: string;
}

// Auth result types
export interface AuthResult {
  success: boolean;
  user?: User;
  session?: Session;
  token?: string;
  error?: string;
}

export interface AuthContext {
  user: User;
  session: Session;
  permissions: string[];
}

/**
 * User registration
 */
export async function registerUser(
  email: string,
  password: string,
  name: string,
  role: "ADMIN" | "MANAGER" | "CLIENT" | "SUPPLIER" = "CLIENT"
): Promise<AuthResult> {
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return {
        success: false,
        error: "Bu email adresi zaten kayıtlı",
      };
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
      },
    });

    // Create session
    const session = await createSession(user.id);

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    return {
      success: true,
      user,
      session,
      token,
    };
  } catch (error) {
    console.error("Registration error:", error);
    return {
      success: false,
      error: "Kayıt işlemi başarısız",
    };
  }
}

/**
 * User login
 */
export async function loginUser(
  email: string,
  password: string
): Promise<AuthResult> {
  try {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      return {
        success: false,
        error: "Geçersiz email veya şifre",
      };
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return {
        success: false,
        error: "Geçersiz email veya şifre",
      };
    }

    // Create new session
    const session = await createSession(user.id);

    // Generate JWT token
    const token = generateJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });

    return {
      success: true,
      user,
      session,
      token,
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      error: "Giriş işlemi başarısız",
    };
  }
}

/**
 * Verify JWT token and get auth context
 */
export async function verifyAuth(token: string): Promise<AuthContext | null> {
  try {
    const env = getEnv();

    // Verify JWT
    const payload = jwt.verify(token, env.JWT_SECRET) as JWTPayload;

    // Get user and session
    const [user, session] = await Promise.all([
      prisma.user.findUnique({
        where: { id: payload.userId },
      }),
      prisma.session.findUnique({
        where: { id: payload.sessionId },
      }),
    ]);

    if (!user || !user.isActive || !session || session.expiresAt < new Date()) {
      return null;
    }

    // Get user permissions based on role
    const permissions = getRolePermissions(user.role);

    return {
      user,
      session,
      permissions,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

/**
 * Logout user (invalidate session)
 */
export async function logoutUser(sessionId: string): Promise<boolean> {
  try {
    await prisma.session.delete({
      where: { id: sessionId },
    });
    return true;
  } catch (error) {
    console.error("Logout error:", error);
    return false;
  }
}

/**
 * Create a new session
 */
async function createSession(userId: string): Promise<Session> {
  // Session expires in 30 days
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);

  return await prisma.session.create({
    data: {
      userId,
      token: generateSessionToken(),
      expiresAt,
    },
  });
}

/**
 * Generate JWT token
 */
function generateJWT(payload: JWTPayload): string {
  const env = getEnv();
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: "30d",
    issuer: "procheff",
    audience: "procheff-users",
  });
}

/**
 * Generate secure session token
 */
function generateSessionToken(): string {
  return require("crypto").randomBytes(32).toString("hex");
}

/**
 * Get permissions for user role
 */
function getRolePermissions(role: string): string[] {
  const permissions: Record<string, string[]> = {
    ADMIN: ["*"], // All permissions
    MANAGER: [
      "user:read",
      "restaurant:*",
      "menu:*",
      "offer:*",
      "tender:*",
      "analysis:*",
    ],
    CLIENT: [
      "restaurant:read",
      "restaurant:write",
      "menu:read",
      "menu:write",
      "offer:read",
      "analysis:read",
    ],
    SUPPLIER: ["tender:read", "tender:bid", "offer:read"],
  };

  return permissions[role] || [];
}

/**
 * Check if user has specific permission
 */
export function hasPermission(
  permissions: string[],
  requiredPermission: string
): boolean {
  // Admin has all permissions
  if (permissions.includes("*")) {
    return true;
  }

  // Check exact match
  if (permissions.includes(requiredPermission)) {
    return true;
  }

  // Check wildcard permissions
  const [resource, action] = requiredPermission.split(":");
  const wildcardPermission = `${resource}:*`;

  return permissions.includes(wildcardPermission);
}

/**
 * Middleware to require authentication
 */
export function requireAuth(requiredPermissions: string[] = []) {
  return async (
    request: Request
  ): Promise<{ success: boolean; context?: AuthContext; error?: string }> => {
    try {
      // Extract token from Authorization header
      const authHeader = request.headers.get("Authorization");
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return {
          success: false,
          error: "Authentication token required",
        };
      }

      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const context = await verifyAuth(token);

      if (!context) {
        return {
          success: false,
          error: "Invalid or expired token",
        };
      }

      // Check permissions
      for (const permission of requiredPermissions) {
        if (!hasPermission(context.permissions, permission)) {
          return {
            success: false,
            error: `Permission denied: ${permission}`,
          };
        }
      }

      return {
        success: true,
        context,
      };
    } catch (error) {
      console.error("Auth middleware error:", error);
      return {
        success: false,
        error: "Authentication failed",
      };
    }
  };
}

import type { Request } from "express";
import type { User } from "../../drizzle/schema";
import * as db from "../db";
import { verifySupabaseToken } from "./supabase";

/**
 * Authenticate a request using Supabase Auth.
 * Extracts the Bearer token from the Authorization header,
 * verifies it with Supabase, and returns the local DB user.
 */
export async function authenticateRequest(req: Request): Promise<User> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.slice(7);
  const supabaseUser = await verifySupabaseToken(token);

  if (!supabaseUser) {
    throw new Error("Invalid or expired token");
  }

  // Upsert user into local DB using Supabase user ID as openId
  await db.upsertUser({
    openId: supabaseUser.id,
    name: supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || null,
    email: supabaseUser.email ?? null,
    loginMethod: supabaseUser.app_metadata?.provider ?? "email",
    lastSignedIn: new Date(),
  });

  const user = await db.getUserByOpenId(supabaseUser.id);
  if (!user) {
    throw new Error("Failed to sync user");
  }

  return user;
}

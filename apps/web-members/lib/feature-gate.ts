
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";

/**
 * requireFeature(featureKey)
 * Server utility that checks Outseta JWT (from cookie or header)
 * and throws if the user lacks a required entitlement.
 */
export async function requireFeature(featureKey: string) {
  const cookieStore = cookies();
  const token = cookieStore.get("outseta_jwt")?.value || "";

  if (!token) {
    throw new Error("Not authenticated.");
  }

  try {
    const audience = process.env.OUTSETA_JWT_AUDIENCE || undefined;
    const decoded: any = jwt.decode(token) || {};

    // Expect Outseta JWT to include entitlements array on claims (adjust path as needed)
    const entitlements: string[] = decoded?.claims?.entitlements || decoded?.entitlements || [];

    if (!entitlements.includes(featureKey)) {
      throw new Error("You don't have access to this feature.");
    }
  } catch (e) {
    throw new Error("Invalid or missing session.");
  }
}

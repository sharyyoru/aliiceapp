import { cookies } from "next/headers";

/**
 * The admin session cookie is base64("admin:<email>:<timestamp>").
 * These helpers decode it for server routes.
 */
export async function getAdminSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session");
  if (!token) return null;
  try {
    const decoded = Buffer.from(token.value, "base64").toString();
    if (!decoded.startsWith("admin:")) return null;
    const parts = decoded.split(":");
    return { email: parts[1] || "" };
  } catch {
    return null;
  }
}

export async function verifyAdmin(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}

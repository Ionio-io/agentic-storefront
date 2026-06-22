const COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE = 60 * 60 * 8; // 8 hours

function getSecret(): string {
  return process.env.ADMIN_SECRET ?? "dev-secret-change-in-production";
}

export function getAdminCredentials() {
  return {
    username: process.env.ADMIN_USERNAME ?? "admin",
    password: process.env.ADMIN_PASSWORD ?? "westside2024",
  };
}

/** Deterministic token via Web Crypto (works in both Node and Edge runtimes). */
export async function makeAdminToken(): Promise<string> {
  const { username, password } = getAdminCredentials();
  const secret = getSecret();

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${username}:${password}`)
  );
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function verifyAdminToken(token: string | undefined): Promise<boolean> {
  if (!token) return false;
  const expected = await makeAdminToken();
  return token === expected;
}

export { COOKIE_NAME, COOKIE_MAX_AGE };

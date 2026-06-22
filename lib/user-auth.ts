// Web Crypto-based password hashing (PBKDF2) and signed session tokens.
// Works in both Node.js and Edge runtimes — no npm dependencies.

const USER_COOKIE = "user_session";
const USER_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

function getUserSecret(): string {
  return process.env.USER_JWT_SECRET ?? process.env.ADMIN_SECRET ?? "user-dev-secret";
}

// ─── Password hashing ─────────────────────────────────────────────────────────

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const saltHex = Array.from(salt).map((b) => b.toString(16).padStart(2, "0")).join("");
  const hashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return `${saltHex}:${hashHex}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const salt = new Uint8Array(saltHex.match(/.{2}/g)!.map((h) => parseInt(h, 16)));
  const keyMaterial = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt, iterations: 100_000, hash: "SHA-256" },
    keyMaterial, 256
  );
  const newHashHex = Array.from(new Uint8Array(bits)).map((b) => b.toString(16).padStart(2, "0")).join("");
  return newHashHex === hashHex;
}

// ─── Session token ────────────────────────────────────────────────────────────

export interface UserPayload {
  userId: string;
  email: string;
  name: string;
  exp: number;
}

function b64url(input: string): string {
  return Buffer.from(input).toString("base64url");
}

function fromB64url(input: string): string {
  return Buffer.from(input, "base64url").toString("utf8");
}

async function hmacSign(data: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw", new TextEncoder().encode(getUserSecret()),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createUserToken(payload: Omit<UserPayload, "exp">): Promise<string> {
  const full: UserPayload = {
    ...payload,
    exp: Date.now() + USER_COOKIE_MAX_AGE * 1000,
  };
  const header = b64url(JSON.stringify(full));
  const sig = await hmacSign(header);
  return `${header}.${sig}`;
}

export async function verifyUserToken(token: string | undefined): Promise<UserPayload | null> {
  if (!token) return null;
  const dot = token.lastIndexOf(".");
  if (dot === -1) return null;
  const header = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacSign(header);
  if (sig !== expected) return null;
  try {
    const payload: UserPayload = JSON.parse(fromB64url(header));
    if (payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export { USER_COOKIE, USER_COOKIE_MAX_AGE };

// In-memory user store — fallback when MongoDB is unavailable.
// Survives HMR module reloads (global), lost on server restart.

interface MemUser {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
}

declare global {
  // eslint-disable-next-line no-var
  var _memUsers: MemUser[] | undefined;
}

if (!global._memUsers) global._memUsers = [];

export function memFindByEmail(email: string): MemUser | undefined {
  return global._memUsers!.find((u) => u.email === email.toLowerCase());
}

export function memCreate(name: string, email: string, passwordHash: string): MemUser {
  const user: MemUser = {
    _id: crypto.randomUUID(),
    name: name.trim(),
    email: email.toLowerCase().trim(),
    passwordHash,
  };
  global._memUsers!.push(user);
  return user;
}

export type { MemUser };

import bcrypt from 'bcrypt';

export async function hashPassword(password: string) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

export async function verifyPassword(password: string, hash?: string | null) {
  if (!hash) return false;
  return await bcrypt.compare(password, hash);
}

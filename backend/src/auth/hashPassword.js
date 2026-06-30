import { scrypt, randomBytes, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);
const KEYLEN = 64;

export async function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = await scryptAsync(password, salt, KEYLEN);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(password, stored) {
  const [salt, storedHash] = stored.split(":");
  const hash = await scryptAsync(password, salt, KEYLEN);
  return timingSafeEqual(Buffer.from(storedHash, "hex"), hash);
}

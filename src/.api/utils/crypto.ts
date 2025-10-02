import crypto from "node:crypto";

export function createRandomString(length = 64): string {
  return crypto.randomBytes(length).toString("hex");
}

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 1_000, 64, "sha512").toString("hex");
}

export function sha256(input: string): string {
  return crypto.createHash("sha256").update(input).digest("hex");
}

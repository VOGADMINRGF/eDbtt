import crypto from "crypto";

const algorithm = "aes-256-gcm";
const key = Buffer.from(process.env.MFA_SECRET_KEY!, "utf-8"); // 32 bytes

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(algorithm, key, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");

  const authTag = cipher.getAuthTag();

  return iv.toString("hex") + ":" + encrypted + ":" + authTag.toString("hex");
}

export function decrypt(enc: string): string {
  const [ivHex, encrypted, authTagHex] = enc.split(":");
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv(algorithm, key, iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encrypted, "hex", "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}

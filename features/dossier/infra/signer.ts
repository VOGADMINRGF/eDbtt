import crypto from "crypto";

export type SignatureResult = {
  signature: string;
  publicKey: string;
  publicKeyId: string;
};

function normalizePrivateKey(privateKeyPem: string) {
  if (privateKeyPem.includes("BEGIN")) return privateKeyPem;
  try {
    return Buffer.from(privateKeyPem, "base64").toString("utf8");
  } catch {
    return privateKeyPem;
  }
}

export function signPayload(payload: string, privateKeyPem: string): SignatureResult {
  const normalizedKey = normalizePrivateKey(privateKeyPem);
  const signature = crypto.sign(null, Buffer.from(payload), normalizedKey);
  const publicKey = crypto.createPublicKey(normalizedKey).export({
    type: "spki",
    format: "pem",
  });
  const publicKeyPem = publicKey.toString();
  const publicKeyId = crypto.createHash("sha256").update(publicKeyPem).digest("hex");

  return {
    signature: signature.toString("base64"),
    publicKey: publicKeyPem,
    publicKeyId,
  };
}

export function verifyPayload(payload: string, signature: string, publicKeyPem: string): boolean {
  try {
    return crypto.verify(
      null,
      Buffer.from(payload),
      publicKeyPem,
      Buffer.from(signature, "base64"),
    );
  } catch {
    return false;
  }
}

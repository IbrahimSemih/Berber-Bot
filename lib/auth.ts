const SECRET_KEY = process.env.SUPERADMIN_SECRET_KEY;

// Convert string key to CryptoKey for Web Crypto API
async function getCryptoKey(): Promise<CryptoKey> {
  if (!SECRET_KEY) {
    throw new Error("SUPERADMIN_SECRET_KEY is not defined in environment variables.");
  }
  const encoder = new TextEncoder();
  return await crypto.subtle.importKey(
    "raw",
    encoder.encode(SECRET_KEY),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

// Convert ArrayBuffer to Hex String
function bufferToHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Convert Hex String to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(Math.ceil(hex.length / 2));
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Generates an HMAC-SHA256 signed token with an expiration timestamp.
 * Format: "timestamp.hmac_signature"
 */
export async function signSuperAdminToken(expiresInHours: number = 24 * 7): Promise<string> {
  const timestamp = Date.now() + expiresInHours * 60 * 60 * 1000;
  const payload = timestamp.toString();
  
  const key = await getCryptoKey();
  const encoder = new TextEncoder();
  const signatureBuffer = await crypto.subtle.sign("HMAC", key, encoder.encode(payload));
  const signature = bufferToHex(signatureBuffer);
  
  return `${payload}.${signature}`;
}

/**
 * Verifies the HMAC-SHA256 signed token.
 * Returns true if valid and not expired, false otherwise.
 */
export async function verifySuperAdminToken(token: string): Promise<boolean> {
  if (!SECRET_KEY || !token) return false;
  
  const [payload, signatureHex] = token.split('.');
  if (!payload || !signatureHex) return false;
  
  const timestamp = parseInt(payload, 10);
  if (isNaN(timestamp)) return false;
  
  // Check expiration
  if (Date.now() > timestamp) return false;
  
  try {
    const key = await getCryptoKey();
    const encoder = new TextEncoder();
    const signatureBytes = hexToUint8Array(signatureHex);
    
    return await crypto.subtle.verify(
      "HMAC",
      key,
      signatureBytes as BufferSource,
      encoder.encode(payload)
    );
  } catch (err) {
    return false;
  }
}

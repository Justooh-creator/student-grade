// Device fingerprint unlock (WebAuthn platform authenticator).
// The signed-in session already lives on this device; the fingerprint
// check guards opening the app. Fingerprint data never leaves the phone.
const key = (userId: string) => `edureport:fingerprint:${userId}`;

export const RELOCK_AFTER_MS = 60_000;

function toB64(buf: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}
function fromB64(s: string) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

export async function fingerprintSupported(): Promise<boolean> {
  if (typeof window === "undefined" || !window.PublicKeyCredential) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch {
    return false;
  }
}

export function fingerprintEnabled(userId: string) {
  return Boolean(localStorage.getItem(key(userId)));
}

export function disableFingerprint(userId: string) {
  localStorage.removeItem(key(userId));
}

export async function enableFingerprint(userId: string, email: string) {
  const cred = (await navigator.credentials.create({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rp: { name: "EduReport Ghana", id: window.location.hostname },
      user: { id: new TextEncoder().encode(userId).slice(0, 64), name: email, displayName: email },
      pubKeyCredParams: [{ type: "public-key", alg: -7 }, { type: "public-key", alg: -257 }],
      authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required", residentKey: "discouraged" },
      timeout: 60_000,
    },
  })) as PublicKeyCredential | null;
  if (!cred) throw new Error("Fingerprint setup was cancelled.");
  localStorage.setItem(key(userId), toB64(cred.rawId));
}

export async function verifyFingerprint(userId: string): Promise<boolean> {
  const id = localStorage.getItem(key(userId));
  if (!id) return true;
  const result = await navigator.credentials.get({
    publicKey: {
      challenge: crypto.getRandomValues(new Uint8Array(32)),
      rpId: window.location.hostname,
      allowCredentials: [{ type: "public-key", id: fromB64(id), transports: ["internal"] }],
      userVerification: "required",
      timeout: 60_000,
    },
  });
  return Boolean(result);
}

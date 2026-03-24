import { getFrontendIdentity } from './frontend-identity'

type UserSigner = (message: Uint8Array) => Promise<{ signature: Uint8Array, publicKey: Uint8Array } | null>

function toHex(buffer: ArrayBufferLike | Uint8Array): string {
  const bytes = ArrayBuffer.isView(buffer) ? buffer : new Uint8Array(buffer as ArrayBufferLike)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Sign a session request body with the frontend Ed25519 identity,
 * and optionally with the user's IC DelegationIdentity for dual-layer auth.
 */
export async function signedSessionHeaders(body: object, userSigner?: UserSigner): Promise<Record<string, string>> {
  const identity = getFrontendIdentity()
  const timestamp = String(Date.now())
  const bodyJson = JSON.stringify(body)
  const message = `${timestamp}:${bodyJson}`
  const msgBytes = new TextEncoder().encode(message)

  const signature = await identity.sign(msgBytes)
  const pubKeyRaw = identity.getPublicKey().toRaw()

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Taco-Timestamp': timestamp,
    'X-Taco-Signature': toHex(signature),
    'X-Taco-PublicKey': toHex(pubKeyRaw),
  }

  if (userSigner) {
    const result = await userSigner(msgBytes)
    if (result) {
      headers['X-Taco-User-Signature'] = toHex(result.signature)
      headers['X-Taco-User-PublicKey'] = toHex(result.publicKey)
    }
  }

  return headers
}

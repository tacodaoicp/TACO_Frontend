import { Principal } from "@dfinity/principal";
import { sha224 } from "js-sha256";

/** Concatenate Uint8Arrays */
const concat = (...chunks: Uint8Array[]) => {
  const len = chunks.reduce((n, a) => n + a.length, 0);
  const out = new Uint8Array(len);
  let o = 0;
  for (const a of chunks) { 
    out.set(a, o); 
    o += a.length; 
  }
  return out;
};

/** Standard CRC-32 (IEEE) over `bytes`, returns 4 bytes big-endian */
const crc32 = (bytes: Uint8Array) => {
  // Build table once
  const table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[n] = c >>> 0;
  }
  
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) {
    c = table[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  }
  c = (~c) >>> 0;
  
  const out = new Uint8Array(4);
  new DataView(out.buffer).setUint32(0, c, false); // big-endian
  return out;
};

/** Format 32-byte id as hex and dashed hex (groups of 8) */
const toHex = (a: Uint8Array) => Array.from(a).map(b => b.toString(16).padStart(2, "0")).join("");
const toDashedHex = (hex: string) => hex.match(/.{1,8}/g)!.join("-");

/**
 * Legacy ICP account identifier from ICRC-1 Account.
 * - owner: Principal
 * - subaccount: optional 32-byte Uint8Array (defaults to 32 zero bytes)
 *
 * Returns { bytes, hex, dashed } where:
 *   bytes  = 32 bytes (CRC32 + SHA-224 hash)
 *   hex    = 64-char lowercase hex
 *   dashed = hex grouped 8-hex chars (UI-friendly)
 */
export function icrc1ToLegacyAccountId(
  owner: Principal,
  subaccount?: Uint8Array
): { bytes: Uint8Array; hex: string; dashed: string } {
  const SUB =
    subaccount === undefined
      ? new Uint8Array(32) // default account (all-zero subaccount)
      : (subaccount.length === 32
          ? subaccount
          : (() => { throw new Error("subaccount must be exactly 32 bytes"); })());

  // Domain separator: 0x0a + "account-id"
  const sep = new Uint8Array([0x0a, ...new TextEncoder().encode("account-id")]);
  const data = concat(sep, owner.toUint8Array(), SUB);

  // js-sha256 returns hex; convert to bytes
  const hashHex = sha224.update(data as unknown as number[]).hex(); // 28-byte SHA-224
  const hash = new Uint8Array(hashHex.match(/.{1,2}/g)!.map(h => parseInt(h, 16)));

  const id = concat(crc32(hash), hash);
  const hex = toHex(id);
  return { bytes: id, hex, dashed: toDashedHex(hex) };
}

/**
 * Get legacy ICP account identifier for a principal (with default subaccount)
 */
export function getLegacyAccountId(principal: string): { hex: string; dashed: string } {
  const owner = Principal.fromText(principal);
  const { hex, dashed } = icrc1ToLegacyAccountId(owner);
  return { hex, dashed };
}

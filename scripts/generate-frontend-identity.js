/**
 * One-time script to generate an Ed25519 key pair for the frontend identity.
 * Run: node scripts/generate-frontend-identity.js
 *
 * Output: secret key (hex), public key (hex), and the resulting IC principal.
 * Use the secret key to populate the obfuscated frontend-identity.ts module.
 */

import { Ed25519KeyIdentity } from '@dfinity/identity';
import { webcrypto } from 'crypto';

const identity = Ed25519KeyIdentity.generate();
const keyPair = identity.getKeyPair();

// Secret key is the first 32 bytes of the 64-byte keypair secretKey
const secretKeyBytes = new Uint8Array(keyPair.secretKey).slice(0, 32);
const publicKeyBytes = new Uint8Array(keyPair.publicKey);

const toHex = (bytes) => Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');

console.log('=== Frontend Identity Generated ===');
console.log('Secret Key (32 bytes hex):', toHex(secretKeyBytes));
console.log('Public Key (hex):', toHex(publicKeyBytes));
console.log('Principal:', identity.getPrincipal().toText());
console.log('');

// Generate the XOR obfuscation data for frontend-identity.ts
const masks = [];
const chunks = [];
for (let i = 0; i < 4; i++) {
    const mask = new Uint8Array(8);
    webcrypto.getRandomValues(mask);
    const chunk = secretKeyBytes.slice(i * 8, (i + 1) * 8);
    const xored = new Uint8Array(8);
    for (let j = 0; j < 8; j++) {
        xored[j] = chunk[j] ^ mask[j];
    }
    masks.push(Buffer.from(mask).toString('base64'));
    chunks.push(Buffer.from(xored).toString('base64'));
}

console.log('=== Obfuscation Data (copy into frontend-identity.ts) ===');
console.log('Chunks (XOR\'d):', JSON.stringify(chunks));
console.log('Masks:', JSON.stringify(masks));
console.log('');
console.log('Verification - reassembled secret key should match above:');

// Verify reassembly
const reassembled = new Uint8Array(32);
for (let i = 0; i < 4; i++) {
    const xored = Buffer.from(chunks[i], 'base64');
    const mask = Buffer.from(masks[i], 'base64');
    for (let j = 0; j < 8; j++) {
        reassembled[i * 8 + j] = xored[j] ^ mask[j];
    }
}
console.log('Reassembled:', toHex(reassembled));
console.log('Match:', toHex(reassembled) === toHex(secretKeyBytes));

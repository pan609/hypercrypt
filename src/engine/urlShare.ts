import type { Stack } from './types';

export const MAX_RECOMMENDED_SHARE_URL_LENGTH = 16_000;

function bytesToBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 =
    typeof btoa === 'function'
      ? btoa(binary)
      : Buffer.from(bytes).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlToBytes(encoded: string): Uint8Array {
  const padded = encoded.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (encoded.length % 4)) % 4);
  if (typeof atob === 'function') {
    const binary = atob(padded);
    const out = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      out[i] = binary.charCodeAt(i);
    }
    return out;
  }
  return new Uint8Array(Buffer.from(padded, 'base64'));
}

export function encodeStackToHash(stack: Stack): string {
  const json = JSON.stringify(stack);
  const bytes = new TextEncoder().encode(json);
  return `#stack=${bytesToBase64Url(bytes)}`;
}

export function decodeStackFromHash(hash: string): Stack | null {
  if (!hash) return null;
  const cleaned = hash.startsWith('#') ? hash.slice(1) : hash;
  const match = cleaned.match(/(?:^|&)stack=([A-Za-z0-9_-]+)/);
  if (!match) return null;
  try {
    const bytes = base64UrlToBytes(match[1]);
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as Stack;
    if (parsed && parsed.schemaVersion === 1 && Array.isArray(parsed.cards) && parsed.cards.length > 0) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

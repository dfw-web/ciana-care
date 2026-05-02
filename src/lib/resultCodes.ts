// Generates RES-XXXXXXXX style access codes (no ambiguous chars: I,O,0,1).
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generateResultCode(length = 8): string {
  let s = "";
  const arr = new Uint32Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) s += ALPHABET[arr[i] % ALPHABET.length];
  return `RES-${s}`;
}

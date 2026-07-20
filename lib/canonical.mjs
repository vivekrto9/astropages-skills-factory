import { createHash } from 'node:crypto';

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.keys(value).sort().map((key) => [key, sorted(value[key])]),
    );
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sorted(value));
}

export function canonicalJsonFile(value) {
  return `${canonicalJson(value)}\n`;
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

export function normalizeRoutingTerm(value) {
  return value.normalize('NFKC').toLowerCase().replace(/\s+/gu, ' ').trim();
}

export function normalizeTextBytes(value) {
  return Buffer.from(value.replace(/\r\n?/gu, '\n'), 'utf8');
}

export function decodeUtf8(bytes, location) {
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error(`ill-formed UTF-8 in ${location}`);
  }
}

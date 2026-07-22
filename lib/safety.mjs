import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { FactoryValidationError, validateFactory } from './validation.mjs';

const RULES = [
  {
    label: 'possible secret value',
    pattern: /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|sk_(?:live|test)_[A-Za-z0-9]{16,})\b/u,
  },
  {
    label: 'possible secret value',
    pattern: /(?:^|\s)(?:[A-Z][A-Z0-9_]*(?:TOKEN|SECRET|PASSWORD|API_KEY|PRIVATE_KEY)[A-Z0-9_]*)\s*=\s*(?!\$\{|<|\[|"?REPLACE|"?YOUR[_ -])["']?(?:gh[pousr]_|sk_(?:live|test)_|[A-Za-z0-9_+/.=-]{20,})/imu,
  },
  {
    label: 'possible secret value',
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/u,
  },
  {
    label: 'legacy generated-site name',
    pattern: /\b(?:(?:PREVIEW|PROD|PRODUCTION)_(?:ASTROCONNECT|ASTRAGURU|PANDIT)_|BUILDER_MCP_TOKEN|BUILDER_MCP_PROVISION_SECRET)\w*/u,
  },
  {
    label: 'unsafe browser-secret guidance',
    pattern: /(?:store|put|save|expose|send|embed)[^\n.]{0,80}(?:secret|api[_ -]?key|credential)[^\n.]{0,80}(?:localStorage|sessionStorage|browser|client[- ]side|public env|PUBLIC_|VITE_)/iu,
  },
  {
    label: 'unsafe browser-secret guidance',
    pattern: /(?:localStorage|sessionStorage|browser|client[- ]side|public env|PUBLIC_|VITE_)[^\n.]{0,80}(?:secret|api[_ -]?key|credential)/iu,
  },
  {
    label: 'unsafe browser-secret guidance',
    pattern: /\b(?:PUBLIC|VITE)_[A-Z0-9_]*(?:SECRET|TOKEN|PASSWORD|API_KEY)\b/u,
  },
];

async function regularFiles(root, relative = '') {
  const records = [];
  for (const name of (await readdir(path.join(root, relative))).sort()) {
    const rel = relative ? `${relative}/${name}` : name;
    const stat = await lstat(path.join(root, rel));
    if (stat.isDirectory()) records.push(...await regularFiles(root, rel));
    else if (stat.isFile()) records.push(rel);
  }
  return records;
}

export async function scanSafety(root, { validated } = {}) {
  const factory = validated ?? await validateFactory(root);
  const findings = [];
  for (const relative of await regularFiles(factory.sourceRoot)) {
    const bytes = await readFile(path.join(factory.sourceRoot, relative));
    if (bytes.includes(0)) {
      findings.push(`binary or NUL payload is forbidden: ${relative}`);
      continue;
    }
    const text = bytes.toString('utf8');
    for (const rule of RULES) {
      if (rule.pattern.test(text)) findings.push(`${rule.label} in source/${relative}`);
    }
  }
  if (findings.length) throw new FactoryValidationError(findings);
  return { ...factory, scannedFiles: (await regularFiles(factory.sourceRoot)).length };
}

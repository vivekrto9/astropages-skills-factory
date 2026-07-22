#!/usr/bin/env node
import path from 'node:path';
import { auditTemplateEvidence } from '../lib/audit.mjs';
import { buildFactory, verifyReproducibility } from '../lib/build.mjs';
import { scanSafety } from '../lib/safety.mjs';
import { validateFactory } from '../lib/validation.mjs';

const COMMAND_FLAGS = Object.freeze({
  validate: new Set(['root']),
  safety: new Set(['root']),
  audit: new Set(['root', 'templates-root']),
  build: new Set(['root', 'expected-commit']),
  reproducibility: new Set(['root', 'expected-commit']),
});

function options(command, argv) {
  const allowed = COMMAND_FLAGS[command];
  if (!allowed) throw new Error('usage: factory.mjs <validate|safety|audit|build|reproducibility>');
  const parsed = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith('--')) throw new Error(`invalid argument: ${argument}`);
    const name = argument.slice(2);
    if (!allowed.has(name)) throw new Error(`unknown flag --${name}; not valid for ${command}`);
    if (name in parsed) throw new Error(`duplicate flag --${name}`);
    if (index + 1 >= argv.length || argv[index + 1].startsWith('--')) throw new Error(`missing value for --${name}`);
    parsed[name] = argv[index + 1];
    index += 1;
  }
  return parsed;
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const flags = options(command, rest);
  const root = path.resolve(flags.root ?? process.cwd());
  if (command === 'validate') {
    const result = await validateFactory(root);
    process.stdout.write(`Validated ${result.categories.length} categories, ${result.intents.length} intent${result.intents.length === 1 ? '' : 's'}, ${result.skills.length} skill${result.skills.length === 1 ? '' : 's'}.\n`);
  } else if (command === 'safety') {
    const result = await scanSafety(root);
    process.stdout.write(`Safety scan passed for ${result.scannedFiles} source files.\n`);
  } else if (command === 'audit') {
    const result = await auditTemplateEvidence(root, { templatesRoot: flags['templates-root'] ? path.resolve(flags['templates-root']) : undefined });
    process.stdout.write(`Audited ${result.auditedTemplates} template evidence record${result.auditedTemplates === 1 ? '' : 's'}${result.checkoutVerified ? ' against checked-out templates' : ''}.\n`);
  } else if (command === 'build') {
    const result = await buildFactory(root, {
      expectedCommit: flags['expected-commit'],
    });
    process.stdout.write(`Built ${result.manifest.files.length} payload files; content ${result.manifest.contentSha256}; artifact ${result.attestation.artifactSha256}.\n`);
  } else if (command === 'reproducibility') {
    const result = await verifyReproducibility(root, { expectedCommit: flags['expected-commit'] });
    process.stdout.write(`Reproducible content ${result.contentSha256}; artifact ${result.artifactSha256}.\n`);
  } else {
    throw new Error('usage: factory.mjs <validate|safety|audit|build|reproducibility>');
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});

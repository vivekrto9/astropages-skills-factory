import { execFile } from 'node:child_process';
import { lstat, realpath } from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { FactoryValidationError, validateFactory } from './validation.mjs';

const execFileAsync = promisify(execFile);

async function git(repository, ...args) {
  const { stdout } = await execFileAsync('git', ['-C', repository, ...args]);
  return stdout.trim();
}

async function verifyGitEvidencePath(repository, commit, evidencePath, templateKey, errors) {
  const components = evidencePath.split('/');
  let prefix = '';
  for (const component of components) {
    prefix = prefix ? `${prefix}/${component}` : component;
    let listing;
    try {
      listing = await git(repository, 'ls-tree', commit, '--', prefix);
    } catch (error) {
      errors.push(`template evidence ${templateKey} cannot inspect ${prefix} in declared Git object ${commit}: ${error.message}`);
      return;
    }
    const entry = listing.split('\n').find((line) => line.slice(line.indexOf('\t') + 1) === prefix);
    if (!entry) {
      errors.push(`template evidence ${templateKey} path is not present in declared Git object ${commit}: ${evidencePath}`);
      return;
    }
    const mode = entry.split(/\s+/u, 1)[0];
    if (mode === '120000') {
      errors.push(`template evidence ${templateKey} path has a symlinked component in declared Git object: ${prefix}`);
      return;
    }
  }

  let current = repository;
  for (const component of components) {
    current = path.join(current, component);
    try {
      const componentStat = await lstat(current);
      if (componentStat.isSymbolicLink()) {
        errors.push(`template evidence ${templateKey} checkout path has a symlinked component: ${path.relative(repository, current)}`);
        return;
      }
      const resolved = await realpath(current);
      if (resolved !== repository && !resolved.startsWith(`${repository}${path.sep}`)) {
        errors.push(`template evidence ${templateKey} checkout path escapes repository: ${evidencePath}`);
        return;
      }
    } catch {
      errors.push(`template evidence ${templateKey} checkout path is missing: ${evidencePath}`);
      return;
    }
  }
}

export async function auditTemplateEvidence(root, { templatesRoot, validated } = {}) {
  const factory = validated ?? await validateFactory(root);
  if (!templatesRoot) return { ...factory, auditedTemplates: factory.evidence.length, checkoutVerified: false };

  const errors = [];
  const resolvedTemplatesRoot = await realpath(templatesRoot).catch(() => null);
  if (!resolvedTemplatesRoot) throw new FactoryValidationError([`templates root does not exist: ${templatesRoot}`]);
  for (const record of factory.evidence) {
    const repository = path.join(resolvedTemplatesRoot, record.repository);
    const resolvedRepository = await realpath(repository).catch(() => null);
    if (!resolvedRepository || (resolvedRepository !== resolvedTemplatesRoot && !resolvedRepository.startsWith(`${resolvedTemplatesRoot}${path.sep}`))) {
      errors.push(`template evidence ${record.templateKey} repository is missing or escapes templates root: ${record.repository}`);
      continue;
    }
    try {
      const commit = await git(resolvedRepository, 'rev-parse', 'HEAD');
      if (commit !== record.commit) errors.push(`template evidence ${record.templateKey} commit mismatch: expected ${record.commit}, found ${commit}`);
    } catch (error) {
      errors.push(`template evidence ${record.templateKey} is not a readable Git checkout: ${error.message}`);
      continue;
    }
    for (const evidencePath of record.paths) {
      await verifyGitEvidencePath(resolvedRepository, record.commit, evidencePath, record.templateKey, errors);
    }
  }
  if (errors.length) throw new FactoryValidationError(errors);
  return { ...factory, auditedTemplates: factory.evidence.length, checkoutVerified: true };
}

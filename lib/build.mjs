import { execFile } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { chmod, lstat, mkdtemp, mkdir, readFile, readdir, realpath, rename, rm, stat, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import { auditTemplateEvidence } from './audit.mjs';
import { canonicalJson, canonicalJsonFile, decodeUtf8, normalizeTextBytes, sha256 } from './canonical.mjs';
import { BUILDER_VERSION, COMPATIBLE_RUNTIME, LIMITS, SCHEMA_VERSION } from './constants.mjs';
import { scanSafety } from './safety.mjs';
import { FactoryValidationError, validateFactory } from './validation.mjs';

const execFileAsync = promisify(execFile);

const DIST_MARKER = 'astropages-skills-factory-dist-v1\n';

async function git(root, ...args) {
  try {
    const { stdout } = await execFileAsync('git', ['-C', root, ...args]);
    return stdout.trim();
  } catch (error) {
    throw new FactoryValidationError([`Git provenance check failed: ${error.stderr?.trim() || error.message}`]);
  }
}

async function collectBuildInputFiles(root, relative) {
  const current = path.join(root, relative);
  const currentStat = await lstat(current);
  if (currentStat.isSymbolicLink() || (!currentStat.isDirectory() && !currentStat.isFile())) {
    throw new FactoryValidationError([`build input must be a regular file or directory without symlinks: ${relative}`]);
  }
  if (currentStat.isFile()) return [relative];
  const files = [];
  for (const name of (await readdir(current)).sort()) {
    files.push(...await collectBuildInputFiles(root, `${relative}/${name}`));
  }
  return files;
}

async function verifyBuildInputs(root, head) {
  const roots = ['source', 'schemas', 'lib', 'scripts'];
  const rootFiles = ['package.json', 'package-lock.json', '.node-version'];
  const actual = [];
  for (const rootFile of rootFiles) actual.push(...await collectBuildInputFiles(root, rootFile));
  for (const inputRoot of roots) actual.push(...await collectBuildInputFiles(root, inputRoot));
  actual.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));

  const trackedTree = await git(root, 'ls-tree', '-r', '--name-only', head, '--', ...roots);
  const expected = [...rootFiles, ...trackedTree.split('\n').filter(Boolean)]
    .sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new FactoryValidationError([`every build input must be a regular file tracked at exact HEAD; input path inventory differs from HEAD`]);
  }

  for (const relative of actual) {
    let headBytes;
    try {
      const result = await execFileAsync('git', ['-C', root, 'cat-file', 'blob', `${head}:${relative}`], {
        encoding: 'buffer',
        maxBuffer: LIMITS.sourceTotalBytes + LIMITS.sourceFileBytes,
      });
      headBytes = result.stdout;
    } catch {
      throw new FactoryValidationError([`build input is not a regular tracked HEAD blob: ${relative}`]);
    }
    const workingBytes = await readFile(path.join(root, relative));
    if (!workingBytes.equals(headBytes)) {
      throw new FactoryValidationError([`build input must be byte-identical to its exact HEAD blob: ${relative}`]);
    }
  }
}

function isAllowedIgnoredPath(relative) {
  return relative === 'dist/'
    || relative.startsWith('dist/')
    || relative === 'node_modules/'
    || relative.startsWith('node_modules/')
    || /^\.skills-dist-(?:staging|previous)-[^/]+(?:\/|$)/u.test(relative);
}

async function resolveGitProvenance(root, expectedCommit) {
  const canonicalRoot = await realpath(root);
  const topLevel = await realpath(await git(root, 'rev-parse', '--show-toplevel'));
  if (topLevel !== canonicalRoot) throw new FactoryValidationError([`factory root must be the exact Git checkout root: ${root}`]);
  const head = await git(root, 'rev-parse', '--verify', 'HEAD^{commit}');
  if (!/^[a-f0-9]{40}$/u.test(head)) throw new FactoryValidationError([`Git HEAD is not an exact 40-character commit SHA: ${head}`]);
  if (expectedCommit !== undefined) {
    if (!/^[a-f0-9]{40}$/u.test(expectedCommit)) throw new FactoryValidationError([`expected commit must be a 40-character lowercase hexadecimal SHA`]);
    try {
      await execFileAsync('git', ['-C', root, 'cat-file', '-e', `${expectedCommit}^{commit}`]);
    } catch {
      throw new FactoryValidationError([`expected commit does not exist in this Git repository: ${expectedCommit}`]);
    }
    if (expectedCommit !== head) throw new FactoryValidationError([`expected commit ${expectedCommit} does not match exact HEAD ${head}`]);
  }
  const status = await git(root, 'status', '--porcelain=v1', '--untracked-files=all');
  if (status) throw new FactoryValidationError([`Git checkout must be completely clean before attesting; dirty or untracked paths are present`]);
  const ignoredStatus = await git(root, 'status', '--ignored', '--porcelain=v1', '--untracked-files=all');
  const disallowedIgnored = ignoredStatus.split('\n')
    .filter((line) => line.startsWith('!! '))
    .map((line) => line.slice(3))
    .filter((relative) => !isAllowedIgnoredPath(relative));
  if (disallowedIgnored.length) {
    throw new FactoryValidationError([`ignored paths are not allowed outside generated/dependency directories: ${disallowedIgnored.join(', ')}`]);
  }
  await verifyBuildInputs(root, head);
  return head;
}

async function writeNormalized(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, typeof value === 'string' ? normalizeTextBytes(value) : value, { mode: 0o644 });
}

async function bundleFiles(root, relative = '') {
  const files = [];
  for (const name of (await readdir(path.join(root, relative))).sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)))) {
    const rel = relative ? `${relative}/${name}` : name;
    const info = await stat(path.join(root, rel));
    if (info.isDirectory()) files.push(...await bundleFiles(root, rel));
    else files.push(rel);
  }
  return files.sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
}

function writeOctal(header, offset, length, value) {
  const encoded = value.toString(8).padStart(length - 1, '0');
  if (encoded.length >= length) throw new Error(`tar numeric value ${value} does not fit`);
  header.write(encoded, offset, length - 1, 'ascii');
  header[offset + length - 1] = 0;
}

function tarName(name) {
  const bytes = Buffer.byteLength(name);
  if (bytes <= 100) return { name, prefix: '' };
  const separator = name.lastIndexOf('/');
  if (separator < 1) throw new FactoryValidationError([`bundle path is too long for deterministic ustar archive: ${name}`]);
  const prefix = name.slice(0, separator);
  const leaf = name.slice(separator + 1);
  if (Buffer.byteLength(prefix) > 155 || Buffer.byteLength(leaf) > 100) {
    throw new FactoryValidationError([`bundle path is too long for deterministic ustar archive: ${name}`]);
  }
  return { name: leaf, prefix };
}

function tarHeader(name, size) {
  const header = Buffer.alloc(512, 0);
  const split = tarName(name);
  header.write(split.name, 0, 100, 'utf8');
  writeOctal(header, 100, 8, 0o644);
  writeOctal(header, 108, 8, 0);
  writeOctal(header, 116, 8, 0);
  writeOctal(header, 124, 12, size);
  writeOctal(header, 136, 12, 0);
  header.fill(0x20, 148, 156);
  header.write('0', 156, 1, 'ascii');
  header.write('ustar\0', 257, 6, 'ascii');
  header.write('00', 263, 2, 'ascii');
  if (split.prefix) header.write(split.prefix, 345, 155, 'utf8');
  const checksum = header.reduce((sum, byte) => sum + byte, 0);
  const checksumText = checksum.toString(8).padStart(6, '0');
  header.write(checksumText, 148, 6, 'ascii');
  header[154] = 0;
  header[155] = 0x20;
  return header;
}

async function createTar(bundleRoot, paths) {
  const chunks = [];
  for (const relative of paths) {
    const bytes = await readFile(path.join(bundleRoot, relative));
    chunks.push(tarHeader(relative, bytes.length), bytes);
    const remainder = bytes.length % 512;
    if (remainder) chunks.push(Buffer.alloc(512 - remainder, 0));
  }
  chunks.push(Buffer.alloc(1024, 0));
  return Buffer.concat(chunks);
}

async function assertOwnedDist(root) {
  const dist = path.join(root, 'dist');
  let distStat;
  try {
    distStat = await lstat(dist);
  } catch (error) {
    if (error.code === 'ENOENT') return false;
    throw error;
  }
  if (distStat.isSymbolicLink()) throw new FactoryValidationError([`output dist must not be a symlink; factory ownership cannot be established`]);
  if (!distStat.isDirectory()) throw new FactoryValidationError([`dist is not a recognized factory-owned directory; ownership marker required`]);
  try {
    const markerStat = await lstat(path.join(dist, '.astropages-skills-factory-output'));
    if (markerStat.isSymbolicLink() || !markerStat.isFile()) throw new Error('invalid marker');
    const marker = decodeUtf8(await readFile(path.join(dist, '.astropages-skills-factory-output')), 'dist ownership marker');
    if (marker !== DIST_MARKER) throw new Error('invalid marker');
    return true;
  } catch (error) {
    throw new FactoryValidationError([`dist is not recognized as factory-owned; valid ownership marker required before replacement`]);
  }
}

async function prepareFactory(root, expectedCommit) {
  const commit = await resolveGitProvenance(root, expectedCommit);
  const factory = await validateFactory(root);
  await scanSafety(root, { validated: factory });
  await auditTemplateEvidence(root, { validated: factory });
  return { factory, commit };
}

async function renderFactory(factory, commit, outDir) {
  const bundleRoot = path.join(outDir, 'bundle');
  await mkdir(path.join(bundleRoot, '.agents/skills'), { recursive: true });
  await writeNormalized(path.join(bundleRoot, 'AGENTS.md'), factory.foundation);
  await writeNormalized(path.join(bundleRoot, 'catalog/intents.json'), canonicalJsonFile({
    schemaVersion: SCHEMA_VERSION,
    categories: factory.categories,
    intents: factory.intents,
  }));
  await writeNormalized(path.join(bundleRoot, 'catalog/skills.json'), canonicalJsonFile({
    schemaVersion: SCHEMA_VERSION,
    skills: factory.skills,
  }));
  for (const skill of factory.skills) {
    for (const relative of [skill.entry, ...skill.resources]) {
      const bytes = await readFile(path.join(factory.sourceRoot, 'skills', skill.id, relative));
      await writeNormalized(path.join(bundleRoot, '.agents/skills', skill.id, relative), normalizeTextBytes(decodeUtf8(bytes, `source/skills/${skill.id}/${relative}`)));
    }
  }

  const payloadPaths = (await bundleFiles(bundleRoot)).filter((file) => file !== 'bundle.manifest.json');
  if (payloadPaths.length + 1 > LIMITS.bundleFiles) throw new FactoryValidationError([`bundle file count exceeds ${LIMITS.bundleFiles}`]);
  const records = [];
  let bundleTotalBytes = 0;
  for (const relative of payloadPaths) {
    const bytes = await readFile(path.join(bundleRoot, relative));
    if (bytes.length > LIMITS.sourceFileBytes) throw new FactoryValidationError([`bundle file ${relative} exceeds ${LIMITS.sourceFileBytes} bytes`]);
    bundleTotalBytes += bytes.length;
    records.push({ path: relative, size: bytes.length, sha256: sha256(bytes) });
  }
  if (bundleTotalBytes > LIMITS.bundleTotalBytes) throw new FactoryValidationError([`bundle payload bytes exceed ${LIMITS.bundleTotalBytes}`]);
  const contentSha256 = sha256(canonicalJson(records));
  const manifest = {
    schemaVersion: SCHEMA_VERSION,
    builderVersion: BUILDER_VERSION,
    sourceCommit: commit,
    compatibleAiRuntime: COMPATIBLE_RUNTIME,
    contentSha256,
    files: records,
  };
  const validateManifest = factory.schemaValidators['bundle-manifest.schema.json'];
  if (!validateManifest?.(manifest)) {
    const detail = validateManifest?.errors?.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ') ?? 'validator unavailable';
    throw new FactoryValidationError([`bundle manifest violates its published schema: ${detail}`]);
  }
  const manifestText = canonicalJsonFile(manifest);
  const manifestBytes = Buffer.byteLength(manifestText);
  if (manifestBytes > LIMITS.sourceFileBytes) throw new FactoryValidationError([`bundle manifest exceeds ${LIMITS.sourceFileBytes} bytes`]);
  if (bundleTotalBytes + manifestBytes > LIMITS.bundleTotalBytes) throw new FactoryValidationError([`bundle total bytes exceed ${LIMITS.bundleTotalBytes}`]);
  await writeNormalized(path.join(bundleRoot, 'bundle.manifest.json'), manifestText);
  const archivePaths = await bundleFiles(bundleRoot);
  const archive = await createTar(bundleRoot, archivePaths);
  if (archive.length > LIMITS.archiveBytes) throw new FactoryValidationError([`archive bytes exceed ${LIMITS.archiveBytes}`]);
  await writeFile(path.join(outDir, 'skills-bundle.tar'), archive, { mode: 0o644 });
  const artifactSha256 = sha256(archive);
  const attestation = {
    schemaVersion: SCHEMA_VERSION,
    builderVersion: BUILDER_VERSION,
    sourceCommit: commit,
    contentSha256,
    artifactSha256,
  };
  await writeNormalized(path.join(outDir, 'build-attestation.json'), canonicalJsonFile(attestation));
  await writeNormalized(path.join(outDir, '.astropages-skills-factory-output'), DIST_MARKER);
  return { manifest, attestation, outDir };
}

export async function buildFactory(root, { expectedCommit } = {}) {
  const hadDist = await assertOwnedDist(root);
  const { factory, commit } = await prepareFactory(root, expectedCommit);
  const staging = await mkdtemp(path.join(root, '.skills-dist-staging-'));
  await chmod(staging, 0o755);
  const backup = path.join(root, `.skills-dist-previous-${randomUUID()}`);
  let movedOld = false;
  try {
    const rendered = await renderFactory(factory, commit, staging);
    if (hadDist) {
      await rename(path.join(root, 'dist'), backup);
      movedOld = true;
    }
    try {
      await rename(staging, path.join(root, 'dist'));
    } catch (error) {
      if (movedOld) await rename(backup, path.join(root, 'dist'));
      throw error;
    }
    if (movedOld) await rm(backup, { recursive: true });
    return { ...rendered, outDir: path.join(root, 'dist') };
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

export async function verifyReproducibility(root, { expectedCommit } = {}) {
  const { factory, commit } = await prepareFactory(root, expectedCommit);
  const temporary = await realpath(await mkdtemp(path.join(os.tmpdir(), 'astropages-skills-repro-')));
  try {
    const firstDir = await mkdtemp(path.join(temporary, 'first-'));
    const secondDir = await mkdtemp(path.join(temporary, 'second-'));
    const first = await renderFactory(factory, commit, firstDir);
    const second = await renderFactory(factory, commit, secondDir);
    const firstTar = await readFile(path.join(first.outDir, 'skills-bundle.tar'));
    const secondTar = await readFile(path.join(second.outDir, 'skills-bundle.tar'));
    const firstManifest = await readFile(path.join(first.outDir, 'bundle/bundle.manifest.json'));
    const secondManifest = await readFile(path.join(second.outDir, 'bundle/bundle.manifest.json'));
    if (!firstTar.equals(secondTar) || !firstManifest.equals(secondManifest)) {
      throw new FactoryValidationError(['reproducibility failed: repeated builds differ byte-for-byte']);
    }
    return first.attestation;
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
}

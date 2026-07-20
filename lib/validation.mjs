import { lstat, readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  CATEGORY_LABELS,
  CATEGORY_KEYS,
  COMPATIBLE_RUNTIME,
  LIMITS,
  PUBLISHED_SCHEMAS,
  SCHEMA_VERSION,
  SOURCE_CATALOG_FILES,
  TOOL_DEPENDENCIES,
} from './constants.mjs';
import { decodeUtf8, normalizeRoutingTerm } from './canonical.mjs';

export class FactoryValidationError extends Error {
  constructor(errors) {
    super(`Factory validation failed:\n- ${errors.join('\n- ')}`);
    this.name = 'FactoryValidationError';
    this.errors = errors;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function exactKeys(value, allowed, location, errors) {
  if (!isObject(value)) {
    errors.push(`${location} must be an object`);
    return false;
  }
  const extra = Object.keys(value).filter((key) => !allowed.includes(key));
  const missing = allowed.filter((key) => !(key in value));
  if (missing.length) errors.push(`${location} is missing fields: ${missing.join(', ')}`);
  if (extra.length) errors.push(`${location} has undeclared fields: ${extra.join(', ')}`);
  return missing.length === 0;
}

function requireString(value, location, errors, { pattern, max = 1024 } = {}) {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) {
    errors.push(`${location} must be a non-empty string of at most ${max} characters`);
    return false;
  }
  if (/[\u0000-\u001f\u007f-\u009f]/u.test(value)) {
    errors.push(`${location} must not contain C0/C1 control characters`);
    return false;
  }
  if (pattern && !pattern.test(value)) {
    errors.push(`${location} has invalid format: ${value}`);
    return false;
  }
  return true;
}

function requireStringArray(value, location, errors, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0) || value.some((item) => typeof item !== 'string' || !item)) {
    errors.push(`${location} must be ${nonEmpty ? 'a non-empty' : 'an'} array of non-empty strings`);
    return false;
  }
  const duplicates = value.filter((item, index) => value.indexOf(item) !== index);
  if (duplicates.length) errors.push(`${location} has duplicate values: ${[...new Set(duplicates)].join(', ')}`);
  return true;
}

function enforceArrayLimit(value, limit, location, errors) {
  if (Array.isArray(value) && value.length > limit) errors.push(`${location} must contain at most ${limit} items`);
}

export function assertRelativePath(value, location, errors) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || path.posix.isAbsolute(value)) {
    errors.push(`${location} is an invalid relative path and must be confined to its skill directory: ${String(value)}`);
    return false;
  }
  const parts = value.split('/');
  if (parts.some((part) => !part || part === '.' || part === '..') || path.posix.normalize(value) !== value) {
    errors.push(`${location} is an invalid relative path and must be confined to its skill directory: ${value}`);
    return false;
  }
  return true;
}

function assertResourcePath(value, location, errors) {
  if (!assertRelativePath(value, location, errors)) return false;
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*(?:\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/u.test(value)) {
    errors.push(`${location} must use unambiguous printable ASCII path segments: ${value}`);
    return false;
  }
  return true;
}

function assertEvidencePath(value, location, errors) {
  if (!assertRelativePath(value, location, errors)) return false;
  if (!/^[\x20-\x7e]+$/u.test(value)) {
    errors.push(`${location} must be a printable canonical ASCII repository path: ${value}`);
    return false;
  }
  return true;
}

async function readJson(file, location, errors) {
  try {
    const fileStat = await lstat(file);
    if (fileStat.isSymbolicLink() || !fileStat.isFile()) {
      errors.push(`${location} must be a regular file, not a symlink or special payload`);
      return null;
    }
    if (fileStat.size > LIMITS.sourceFileBytes) {
      errors.push(`${location} size exceeds ${LIMITS.sourceFileBytes} bytes`);
      return null;
    }
    return JSON.parse(decodeUtf8(await readFile(file), location));
  } catch (error) {
    errors.push(error.code === 'ENOENT' ? `${location} is missing` : `${location} is not readable JSON: ${error.message}`);
    return null;
  }
}

function compileSchemas(schemaDocuments, errors) {
  const validators = {};
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  for (const [name, schema] of Object.entries(schemaDocuments)) {
    if (!schema) continue;
    try {
      validators[name] = ajv.compile(schema);
    } catch (error) {
      errors.push(`schemas/${name} is not a valid draft 2020-12 schema: ${error.message}`);
    }
  }
  return validators;
}

function applySchema(validator, values, label, errors) {
  if (!validator || !Array.isArray(values)) return;
  values.forEach((value, index) => {
    if (!validator(value)) {
      const detail = validator.errors.map((error) => `${error.instancePath || '/'} ${error.message}`).join('; ');
      errors.push(`${label}[${index}] violates its published schema: ${detail}`);
    }
  });
}

async function listTree(root, relative = '') {
  const directory = path.join(root, relative);
  const names = await readdir(directory).catch(() => []);
  const records = [];
  for (const name of names.sort()) {
    const rel = relative ? `${relative}/${name}` : name;
    const stat = await lstat(path.join(root, rel));
    records.push({ path: rel, stat });
    if (stat.isDirectory() && !stat.isSymbolicLink()) records.push(...await listTree(root, rel));
  }
  return records;
}

function parseFrontmatter(text, location, errors) {
  const normalized = text.replace(/\r\n?/gu, '\n');
  if (!normalized.startsWith('---\n')) {
    errors.push(`${location} must begin with YAML frontmatter`);
    return null;
  }
  const end = normalized.indexOf('\n---\n', 4);
  if (end < 0) {
    errors.push(`${location} has unterminated YAML frontmatter`);
    return null;
  }
  if (end > 1028) errors.push(`${location} frontmatter exceeds 1024 characters`);
  const values = {};
  for (const line of normalized.slice(4, end).split('\n')) {
    const separator = line.indexOf(':');
    if (separator < 1) {
      errors.push(`${location} frontmatter line is invalid: ${line}`);
      continue;
    }
    const key = line.slice(0, separator).trim();
    let value = line.slice(separator + 1).trim();
    if (value.startsWith('"') && value.endsWith('"')) {
      try { value = JSON.parse(value); } catch { errors.push(`${location} frontmatter has invalid quoted value for ${key}`); }
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.slice(1, -1).replace(/''/gu, "'");
    }
    if (key in values) errors.push(`${location} frontmatter repeats ${key}`);
    values[key] = value;
  }
  exactKeys(values, ['name', 'description'], `${location} frontmatter`, errors);
  if (!normalized.slice(end + 5).trim()) errors.push(`${location} must contain skill instructions after frontmatter`);
  return values;
}

function validateCategories(document, errors) {
  exactKeys(document, ['schemaVersion', 'categories'], 'categories.json', errors);
  if (document?.schemaVersion !== SCHEMA_VERSION) errors.push(`categories.json schemaVersion must be ${SCHEMA_VERSION}`);
  if (!Array.isArray(document?.categories)) {
    errors.push('categories.json categories must be an array');
    return [];
  }
  if (document.categories.length !== CATEGORY_LABELS.length) {
    errors.push(`categories.json must contain exactly ${CATEGORY_LABELS.length} categories in approved order`);
  }
  const keys = new Set();
  document.categories.forEach((category, index) => {
    const where = `categories[${index}]`;
    exactKeys(category, ['key', 'label', 'description', 'icon', 'order'], where, errors);
    if (!isObject(category)) return;
    requireString(category?.key, `${where}.key`, errors, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, max: 64 });
    requireString(category?.label, `${where}.label`, errors, { max: 80 });
    requireString(category?.description, `${where}.description`, errors, { max: 240 });
    requireString(category?.icon, `${where}.icon`, errors, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, max: 64 });
    if (category?.key !== CATEGORY_KEYS[index] || category?.label !== CATEGORY_LABELS[index] || category?.order !== index + 1) {
      errors.push(`${where} must be ${CATEGORY_KEYS[index]} / ${CATEGORY_LABELS[index]} at order ${index + 1}`);
    }
    if (typeof category.key === 'string') {
      if (keys.has(category.key)) errors.push(`duplicate category key: ${category.key}`);
      keys.add(category.key);
    }
  });
  return document.categories.filter(isObject);
}

function validateIntents(document, categoryKeys, errors) {
  exactKeys(document, ['schemaVersion', 'intents'], 'intents.json', errors);
  if (document?.schemaVersion !== SCHEMA_VERSION) errors.push(`intents.json schemaVersion must be ${SCHEMA_VERSION}`);
  if (!Array.isArray(document?.intents)) {
    errors.push('intents.json intents must be an array');
    return [];
  }
  enforceArrayLimit(document.intents, LIMITS.intents, 'intents.json intents', errors);
  const ids = new Set();
  const routingTerms = new Map();
  document.intents.forEach((intent, index) => {
    const where = `intents[${index}]`;
    exactKeys(intent, ['key', 'label', 'categoryKey', 'description', 'aliases', 'userExamples', 'internalSkills', 'toolDependencies'], where, errors);
    if (!isObject(intent)) return;
    requireString(intent?.key, `${where}.key`, errors, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, max: 80 });
    requireString(intent?.label, `${where}.label`, errors, { max: 100 });
    requireString(intent?.categoryKey, `${where}.categoryKey`, errors, { max: 64 });
    requireString(intent?.description, `${where}.description`, errors, { max: 500 });
    requireStringArray(intent?.aliases, `${where}.aliases`, errors);
    requireStringArray(intent?.userExamples, `${where}.userExamples`, errors, { nonEmpty: true });
    requireStringArray(intent?.internalSkills, `${where}.internalSkills`, errors, { nonEmpty: true });
    requireStringArray(intent?.toolDependencies, `${where}.toolDependencies`, errors, { nonEmpty: true });
    enforceArrayLimit(intent?.aliases, LIMITS.aliasesPerIntent, `${where}.aliases`, errors);
    enforceArrayLimit(intent?.userExamples, LIMITS.examplesPerIntent, `${where}.userExamples`, errors);
    enforceArrayLimit(intent?.internalSkills, LIMITS.skillsPerIntent, `${where}.internalSkills`, errors);
    enforceArrayLimit(intent?.toolDependencies, LIMITS.toolsPerIntent, `${where}.toolDependencies`, errors);
    if (typeof intent.key === 'string') {
      if (ids.has(intent.key)) errors.push(`duplicate intent key: ${intent.key}`);
      ids.add(intent.key);
    }
    if (!categoryKeys.has(intent?.categoryKey)) errors.push(`intent ${intent?.key} references unknown category ${intent?.categoryKey}`);
    const toolDependencies = Array.isArray(intent?.toolDependencies) ? intent.toolDependencies : [];
    for (const dependency of toolDependencies) {
      if (!TOOL_DEPENDENCIES.has(dependency)) errors.push(`intent ${intent?.key} has unknown tool dependency ${dependency}`);
    }
    if (toolDependencies.includes('none') && toolDependencies.length > 1) {
      errors.push(`intent ${intent.key} cannot combine tool dependency none with another dependency`);
    }
    const aliases = Array.isArray(intent?.aliases) ? intent.aliases : [];
    for (const [kind, term] of [['key', intent?.key], ['label', intent?.label], ...aliases.map((alias) => ['alias', alias])]) {
      if (typeof term !== 'string' || !term) continue;
      const normalized = normalizeRoutingTerm(term);
      if (!normalized) {
        errors.push(`intent ${intent?.key} ${kind} must not normalize to an empty routing term`);
        continue;
      }
      const prior = routingTerms.get(normalized);
      if (prior) errors.push(`normalized routing term collision for "${normalized}": ${prior} and intent ${intent?.key} ${kind} "${term}"`);
      else routingTerms.set(normalized, `intent ${intent?.key} ${kind} "${term}"`);
    }
  });
  return document.intents.filter(isObject);
}

function validateSkillCatalog(document, errors) {
  exactKeys(document, ['schemaVersion', 'skills'], 'skills.json', errors);
  if (document?.schemaVersion !== SCHEMA_VERSION) errors.push(`skills.json schemaVersion must be ${SCHEMA_VERSION}`);
  if (!Array.isArray(document?.skills)) {
    errors.push('skills.json skills must be an array');
    return [];
  }
  enforceArrayLimit(document.skills, LIMITS.skills, 'skills.json skills', errors);
  const ids = new Set();
  document.skills.forEach((skill, index) => {
    const where = `skills[${index}]`;
    exactKeys(skill, ['id', 'version', 'description', 'compatibleAiRuntime', 'entry', 'resources', 'intents'], where, errors);
    if (!isObject(skill)) return;
    requireString(skill?.id, `${where}.id`, errors, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, max: 64 });
    requireString(skill?.version, `${where}.version`, errors, { pattern: /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)$/u, max: 32 });
    requireString(skill?.description, `${where}.description`, errors, { max: 500 });
    if (skill?.compatibleAiRuntime !== COMPATIBLE_RUNTIME) errors.push(`${where}.compatibleAiRuntime must be ${COMPATIBLE_RUNTIME}`);
    if (skill?.entry !== 'SKILL.md') errors.push(`${where}.entry must be SKILL.md`);
    requireStringArray(skill?.resources, `${where}.resources`, errors);
    requireStringArray(skill?.intents, `${where}.intents`, errors, { nonEmpty: true });
    enforceArrayLimit(skill?.resources, LIMITS.resourcesPerSkill, `${where}.resources`, errors);
    enforceArrayLimit(skill?.intents, LIMITS.intentsPerSkill, `${where}.intents`, errors);
    const resources = Array.isArray(skill?.resources) ? skill.resources : [];
    for (const resource of resources) assertResourcePath(resource, `${where}.resource`, errors);
    if (resources.includes(skill?.entry)) errors.push(`${where} entry/resource overlap creates duplicate bundle path: ${skill.entry}`);
    if (typeof skill.id === 'string') {
      if (ids.has(skill.id)) errors.push(`duplicate skill id: ${skill.id}`);
      ids.add(skill.id);
    }
  });
  return document.skills.filter(isObject);
}

async function validateSkillFiles(sourceRoot, skills, errors) {
  const skillsRoot = path.join(sourceRoot, 'skills');
  const tree = await listTree(skillsRoot);
  for (const record of tree) {
    if (record.stat.isSymbolicLink()) errors.push(`symlink payload is forbidden: ${record.path}`);
    if (record.stat.isFile() && (record.stat.mode & 0o111)) errors.push(`executable payload is forbidden: ${record.path}`);
    if (!record.stat.isFile() && !record.stat.isDirectory() && !record.stat.isSymbolicLink()) errors.push(`special payload is forbidden: ${record.path}`);
  }
  const actualSkillDirs = tree.filter(({ path: rel, stat }) => stat.isDirectory() && !rel.includes('/')).map(({ path: rel }) => rel);
  const expectedIds = new Set(skills.map(({ id }) => id));
  for (const directory of actualSkillDirs) if (!expectedIds.has(directory)) errors.push(`undeclared skill directory: ${directory}`);

  for (const skill of skills) {
    if (typeof skill?.id !== 'string' || typeof skill?.entry !== 'string') continue;
    const directory = path.join(skillsRoot, skill.id);
    const expected = new Set([skill.entry, ...(Array.isArray(skill.resources) ? skill.resources : [])]);
    const records = await listTree(directory);
    const files = records.filter(({ stat }) => stat.isFile() || stat.isSymbolicLink());
    for (const record of files) {
      if (!expected.has(record.path)) errors.push(`undeclared skill file in ${skill.id}: ${record.path}`);
    }
    for (const declared of expected) {
      const record = files.find(({ path: rel }) => rel === declared);
      if (!record) errors.push(`skill ${skill.id} declares missing file: ${declared}`);
    }
    const entryFile = path.join(directory, skill.entry);
    try {
      const entryStat = await lstat(entryFile);
      if (entryStat.isSymbolicLink() || !entryStat.isFile()) continue;
      const text = decodeUtf8(await readFile(entryFile), `source/skills/${skill.id}/${skill.entry}`);
      const frontmatter = parseFrontmatter(text, `${skill.id}/${skill.entry}`, errors);
      if (frontmatter) {
        requireString(frontmatter.name, `${skill.id}/${skill.entry} frontmatter.name`, errors, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, max: 64 });
        requireString(frontmatter.description, `${skill.id}/${skill.entry} frontmatter.description`, errors, { max: 500 });
      }
      if (frontmatter?.name !== skill.id) errors.push(`${skill.id}/${skill.entry} frontmatter name must equal skill id ${skill.id}`);
      if (frontmatter && (typeof frontmatter.description !== 'string' || !frontmatter.description.startsWith('Use when '))) {
        errors.push(`${skill.id}/${skill.entry} frontmatter description must start with "Use when "`);
      }
      if (typeof frontmatter?.description === 'string' && frontmatter.description.length > 500) errors.push(`${skill.id}/${skill.entry} frontmatter description exceeds 500 characters`);
    } catch (error) {
      errors.push(`skill ${skill.id} entry is unreadable: ${error.message}`);
    }
  }
}

async function validateDeclaredSourceFiles(sourceRoot, skills, errors) {
  const declared = new Set([
    'foundation/AGENTS.md',
    ...SOURCE_CATALOG_FILES.map((file) => `catalog/${file}`),
    ...skills.flatMap((skill) => [skill.entry, ...(Array.isArray(skill.resources) ? skill.resources : [])].map((file) => `skills/${skill.id}/${file}`)),
  ]);
  const tree = await listTree(sourceRoot);
  const files = tree.filter(({ stat }) => stat.isFile());
  if (files.length > LIMITS.sourceFiles) errors.push(`source file count exceeds ${LIMITS.sourceFiles}`);
  const totalBytes = files.reduce((sum, { stat }) => sum + stat.size, 0);
  if (totalBytes > LIMITS.sourceTotalBytes) errors.push(`source total bytes exceed ${LIMITS.sourceTotalBytes}`);
  for (const record of tree) {
    if ((record.stat.isFile() || record.stat.isSymbolicLink()) && !declared.has(record.path)) {
      errors.push(`undeclared source file: ${record.path}`);
    }
    if (record.stat.isFile()) {
      if (record.stat.size > LIMITS.sourceFileBytes) errors.push(`source file ${record.path} size exceeds ${LIMITS.sourceFileBytes} bytes`);
      try {
        decodeUtf8(await readFile(path.join(sourceRoot, record.path)), `source/${record.path}`);
      } catch (error) {
        errors.push(error.message);
      }
    }
  }
}

function validateBundlePathUniqueness(skills, errors) {
  const seen = new Set(['AGENTS.md', 'catalog/intents.json', 'catalog/skills.json', 'bundle.manifest.json']);
  for (const skill of skills) {
    for (const relative of [skill.entry, ...(Array.isArray(skill.resources) ? skill.resources : [])]) {
      const output = `.agents/skills/${skill.id}/${relative}`;
      if (seen.has(output)) errors.push(`duplicate bundle path: ${output}`);
      seen.add(output);
    }
  }
}

function validateEvidence(document, errors) {
  exactKeys(document, ['schemaVersion', 'templates'], 'template-evidence.json', errors);
  if (document?.schemaVersion !== SCHEMA_VERSION) errors.push(`template-evidence.json schemaVersion must be ${SCHEMA_VERSION}`);
  if (!Array.isArray(document?.templates)) {
    errors.push('template-evidence.json templates must be an array');
    return [];
  }
  enforceArrayLimit(document.templates, LIMITS.templates, 'template-evidence.json templates', errors);
  const keys = new Set();
  document.templates.forEach((record, index) => {
    const where = `templates[${index}]`;
    exactKeys(record, ['templateKey', 'repository', 'commit', 'paths'], where, errors);
    if (!isObject(record)) return;
    requireString(record?.templateKey, `${where}.templateKey`, errors, { pattern: /^[a-z0-9]+(?:-[a-z0-9]+)*$/u, max: 80 });
    requireString(record?.repository, `${where}.repository`, errors, { pattern: /^[a-zA-Z0-9._-]+$/u, max: 120 });
    requireString(record?.commit, `${where}.commit`, errors, { pattern: /^[a-f0-9]{40}$/u, max: 40 });
    requireStringArray(record?.paths, `${where}.paths`, errors, { nonEmpty: true });
    enforceArrayLimit(record?.paths, LIMITS.evidencePathsPerTemplate, `${where}.paths`, errors);
    for (const evidencePath of Array.isArray(record?.paths) ? record.paths : []) assertEvidencePath(evidencePath, `${where}.path`, errors);
    if (typeof record.templateKey === 'string') {
      if (keys.has(record.templateKey)) errors.push(`duplicate template evidence key: ${record.templateKey}`);
      keys.add(record.templateKey);
    }
  });
  return document.templates.filter(isObject);
}

export async function validateFactory(root) {
  const errors = [];
  const sourceRoot = path.join(root, 'source');
  const schemaDocuments = {};
  for (const schemaName of PUBLISHED_SCHEMAS) {
    const schema = await readJson(path.join(root, 'schemas', schemaName), `schemas/${schemaName}`, errors);
    schemaDocuments[schemaName] = schema;
    if (schema && (schema.$schema !== 'https://json-schema.org/draft/2020-12/schema' || schema.type !== 'object' || schema.additionalProperties !== false)) {
      errors.push(`schemas/${schemaName} must be a closed draft 2020-12 object schema`);
    }
    if (schema && schema.$id !== `https://astropages.com/schemas/builder-skills/v1/${schemaName}`) {
      errors.push(`schemas/${schemaName} must use the stable AstroPages-owned $id`);
    }
  }
  const schemaValidators = compileSchemas(schemaDocuments, errors);
  try {
    const sourceStat = await lstat(sourceRoot);
    if (sourceStat.isSymbolicLink()) errors.push(`source root must not be a symlink: ${sourceRoot}`);
    for (const record of await listTree(sourceRoot)) {
      if (record.stat.isSymbolicLink()) errors.push(`symlink payload is forbidden: ${record.path}`);
      if (record.stat.isFile() && (record.stat.mode & 0o111)) errors.push(`executable payload is forbidden: ${record.path}`);
      if (!record.stat.isFile() && !record.stat.isDirectory() && !record.stat.isSymbolicLink()) errors.push(`special payload is forbidden: ${record.path}`);
    }
  } catch (error) {
    errors.push(`source root is missing: ${error.message}`);
  }
  const catalogs = {};
  for (const file of SOURCE_CATALOG_FILES) catalogs[file] = await readJson(path.join(sourceRoot, 'catalog', file), file, errors);
  let foundation = '';
  try {
    const foundationFile = path.join(sourceRoot, 'foundation/AGENTS.md');
    const foundationStat = await lstat(foundationFile);
    if (foundationStat.isSymbolicLink() || !foundationStat.isFile()) throw new Error('must be a regular file, not a symlink or special payload');
    foundation = decodeUtf8(await readFile(foundationFile), 'source/foundation/AGENTS.md');
    if (!foundation.trim()) errors.push('source/foundation/AGENTS.md must not be empty');
  } catch (error) {
    errors.push(`source/foundation/AGENTS.md is missing: ${error.message}`);
  }
  const categories = validateCategories(catalogs['categories.json'], errors);
  const intents = validateIntents(catalogs['intents.json'], new Set(categories.map(({ key }) => key)), errors);
  const skills = validateSkillCatalog(catalogs['skills.json'], errors);
  const evidence = validateEvidence(catalogs['template-evidence.json'], errors);
  applySchema(schemaValidators['category.schema.json'], categories, 'category', errors);
  applySchema(schemaValidators['intent.schema.json'], intents, 'intent', errors);
  applySchema(schemaValidators['skill.schema.json'], skills, 'skill', errors);
  applySchema(schemaValidators['template-evidence-record.schema.json'], catalogs['template-evidence.json']?.templates ?? [], 'template evidence', errors);
  const intentIds = new Set(intents.map(({ key }) => key));
  const skillIds = new Set(skills.map(({ id }) => id));
  for (const intent of intents) {
    for (const skillId of Array.isArray(intent.internalSkills) ? intent.internalSkills : []) if (!skillIds.has(skillId)) errors.push(`intent ${intent.key} references unknown skill ${skillId}`);
  }
  for (const skill of skills) {
    const mappedIntents = Array.isArray(skill.intents) ? skill.intents : [];
    for (const intentId of mappedIntents) if (!intentIds.has(intentId)) errors.push(`skill ${skill.id} references unknown intent ${intentId}`);
    for (const intentId of mappedIntents) {
      const intent = intents.find(({ key }) => key === intentId);
      if (intent && (!Array.isArray(intent.internalSkills) || !intent.internalSkills.includes(skill.id))) errors.push(`skill ${skill.id} and intent ${intentId} mappings are not reciprocal`);
    }
  }
  for (const intent of intents) {
    for (const skillId of Array.isArray(intent.internalSkills) ? intent.internalSkills : []) {
      const skill = skills.find(({ id }) => id === skillId);
      if (skill && (!Array.isArray(skill.intents) || !skill.intents.includes(intent.key))) errors.push(`intent ${intent.key} and skill ${skillId} mappings are not reciprocal`);
    }
  }
  await validateDeclaredSourceFiles(sourceRoot, skills, errors);
  await validateSkillFiles(sourceRoot, skills, errors);
  validateBundlePathUniqueness(skills, errors);
  if (errors.length) throw new FactoryValidationError(errors);
  return { root, sourceRoot, categories, intents, skills, evidence, foundation, schemaValidators };
}

import assert from 'node:assert/strict';
import { execFile } from 'node:child_process';
import { createHash } from 'node:crypto';
import { chmod, cp, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import test from 'node:test';
import { makeFactory, writeJson } from './helpers.mjs';

const execFileAsync = promisify(execFile);
const cli = path.resolve('scripts/factory.mjs');

async function run(command, root, ...args) {
  try {
    const result = await execFileAsync(process.execPath, [cli, command, '--root', root, ...args], {
      cwd: path.resolve('.'),
    });
    return { code: 0, ...result };
  } catch (error) {
    return { code: error.code, stdout: error.stdout ?? '', stderr: error.stderr ?? '' };
  }
}

async function fixture() {
  const root = await mkdtemp(path.join(os.tmpdir(), 'skills-factory-test-'));
  await makeFactory(root);
  await execFileAsync('git', ['init', '-q', root]);
  await execFileAsync('git', ['-C', root, 'config', 'user.email', 'test@example.com']);
  await execFileAsync('git', ['-C', root, 'config', 'user.name', 'Test']);
  await execFileAsync('git', ['-C', root, 'add', '.']);
  await execFileAsync('git', ['-C', root, 'commit', '-qm', 'factory fixture']);
  return root;
}

const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, canonical(value[key])]));
  }
  return value;
}

function parseTar(buffer) {
  const entries = [];
  for (let offset = 0; offset + 512 <= buffer.length;) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const string = (start, length) => header.subarray(start, start + length).toString('utf8').replace(/\0.*$/su, '');
    const octal = (start, length) => Number.parseInt(string(start, length).trim() || '0', 8);
    const name = string(0, 100);
    const prefix = string(345, 155);
    const size = octal(124, 12);
    const storedChecksum = octal(148, 8);
    const checksumHeader = Buffer.from(header);
    checksumHeader.fill(0x20, 148, 156);
    entries.push({
      path: prefix ? `${prefix}/${name}` : name,
      mode: octal(100, 8),
      uid: octal(108, 8),
      gid: octal(116, 8),
      size,
      mtime: octal(136, 12),
      type: string(156, 1),
      checksumValid: storedChecksum === checksumHeader.reduce((sum, byte) => sum + byte, 0),
      body: buffer.subarray(offset + 512, offset + 512 + size),
    });
    offset += 512 + Math.ceil(size / 512) * 512;
  }
  return entries;
}

test('validate accepts a complete factory source', async () => {
  const root = await fixture();
  const result = await run('validate', root);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /validated 11 categories, 1 intent, 1 skill/i);
});

test('validate rejects a missing published schema', async () => {
  const root = await fixture();
  await rm(path.join(root, 'schemas/intent.schema.json'));
  const result = await run('validate', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /intent\.schema\.json.*missing|missing.*intent\.schema\.json/i);
});

test('validate compiles schemas and applies them to authored records', async (t) => {
  await t.test('malformed draft schema', async () => {
    const root = await fixture();
    const file = path.join(root, 'schemas/intent.schema.json');
    const schema = JSON.parse(await readFile(file, 'utf8'));
    schema.$defs = { broken: { type: 'not-a-json-schema-type' } };
    await writeJson(file, schema);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /intent\.schema\.json.*schema|schema.*not-a-json-schema-type/i);
  });

  await t.test('catalog/schema drift', async () => {
    const root = await fixture();
    const file = path.join(root, 'schemas/category.schema.json');
    const schema = JSON.parse(await readFile(file, 'utf8'));
    schema.required.push('schema-only-field');
    await writeJson(file, schema);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /category.*schema-only-field|schema-only-field.*category/i);
  });

  await t.test('unowned schema id', async () => {
    const root = await fixture();
    const file = path.join(root, 'schemas/category.schema.json');
    const schema = JSON.parse(await readFile(file, 'utf8'));
    schema.$id = 'https://astropages.example/category.schema.json';
    await writeJson(file, schema);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /stable AstroPages-owned \$id/i);
  });
});

test('validate rejects a globally normalized alias collision', async () => {
  const root = await fixture();
  const file = path.join(root, 'source/catalog/intents.json');
  const catalog = JSON.parse(await readFile(file, 'utf8'));
  catalog.intents[0].aliases = ['ＲＥＦＲＥＳＨ－ＨＯＭＥＰＡＧＥ'];
  await writeJson(file, catalog);
  const result = await run('validate', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /normalized routing term.*collision.*refresh-homepage/i);
});

test('validate rejects missing intent-to-skill references', async () => {
  const root = await fixture();
  const file = path.join(root, 'source/catalog/intents.json');
  const catalog = JSON.parse(await readFile(file, 'utf8'));
  catalog.intents[0].internalSkills = ['missing-skill'];
  await writeJson(file, catalog);
  const result = await run('validate', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /intent refresh-homepage.*unknown skill missing-skill/i);
});

test('validate requires a human-facing activity label for every internal skill', async () => {
  const root = await fixture();
  const file = path.join(root, 'source/catalog/skills.json');
  const catalog = JSON.parse(await readFile(file, 'utf8'));
  delete catalog.skills[0].activityLabel;
  await writeJson(file, catalog);
  const result = await run('validate', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /skills\[0\]\.activityLabel|activityLabel.*required|missing fields: activityLabel/i);
});

test('validate rejects internal skill activity labels without visible characters', async (t) => {
  for (const [name, activityLabel] of [
    ['whitespace-only', '   '],
    ['format-character-only', '\u200B'],
    ['embedded-format-character', 'Building\u200Bsite'],
  ]) {
    await t.test(name, async () => {
      const root = await fixture();
      const file = path.join(root, 'source/catalog/skills.json');
      const catalog = JSON.parse(await readFile(file, 'utf8'));
      catalog.skills[0].activityLabel = activityLabel;
      await writeJson(file, catalog);
      const result = await run('validate', root);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /skills\[0\]\.activityLabel|activityLabel.*visible|activityLabel.*format/i);
    });
  }
});

test('validate accepts activity labels with combining marks and international separators', async (t) => {
  for (const [name, activityLabel] of [
    ['combining-mark', 'Cafe\u0301 builder'],
    ['non-ascii-separator', 'Building\u2003site'],
  ]) {
    await t.test(name, async () => {
      const root = await fixture();
      const file = path.join(root, 'source/catalog/skills.json');
      const catalog = JSON.parse(await readFile(file, 'utf8'));
      catalog.skills[0].activityLabel = activityLabel;
      await writeJson(file, catalog);
      const result = await run('validate', root);
      assert.equal(result.code, 0, result.stderr);
    });
  }
});

test('validate requires model-native skill selection descriptions', async () => {
  const root = await fixture();
  await writeFile(
    path.join(root, 'source/skills/test-site-routing/SKILL.md'),
    '---\nname: test-site-routing\ndescription: Use when locating generated-site routes before a bounded edit.\n---\n\n# Instructions\n',
  );
  const result = await run('validate', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /frontmatter description must start with "Use this skill when\s*"/i);
});

test('validate rejects traversal and undeclared skill resources', async (t) => {
  await t.test('traversal', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/skills.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.skills[0].resources = ['../outside.md'];
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /resource.*confined|invalid relative path/i);
  });

  await t.test('undeclared file', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'source/skills/test-site-routing/surprise.md'), 'not declared\n');
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /undeclared.*surprise\.md/i);
  });
});

test('validate rejects entry/resource overlap and duplicate bundle paths', async (t) => {
  await t.test('entry listed as resource', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/skills.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.skills[0].resources.push('SKILL.md');
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /entry.*resource.*overlap|duplicate bundle path/i);
  });

  await t.test('duplicate declared resource', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/skills.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.skills[0].resources.push('references/contracts.md');
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /duplicate.*references\/contracts\.md|duplicate bundle path/i);
  });
});

test('validate rejects ill-formed UTF-8 before decoding', async (t) => {
  for (const relative of [
    'source/foundation/AGENTS.md',
    'source/skills/test-site-routing/references/contracts.md',
  ]) {
    await t.test(relative, async () => {
      const root = await fixture();
      await writeFile(path.join(root, relative), Buffer.from([0xc3, 0x28]));
      const result = await run('validate', root);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /ill-formed UTF-8.*(?:AGENTS\.md|contracts\.md)|(?:AGENTS\.md|contracts\.md).*ill-formed UTF-8/i);
    });
  }
});

test('validate bounds source and catalog complexity', async (t) => {
  await t.test('oversized source file', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'source/skills/test-site-routing/references/contracts.md'), 'a'.repeat(1_048_577));
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /source file.*size|exceeds.*1048576/i);
  });

  await t.test('maximum source file size is accepted', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'source/skills/test-site-routing/references/contracts.md'), 'a'.repeat(1_048_576));
    const result = await run('validate', root);
    assert.equal(result.code, 0, result.stderr);
  });

  await t.test('too many aliases', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/intents.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.intents[0].aliases = Array.from({ length: 21 }, (_, index) => `alias-${index}`);
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /aliases.*20|must NOT have more than 20/i);
  });

  await t.test('control character in catalog string', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/intents.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.intents[0].description = 'unsafe\u0001description';
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /control character|pattern/i);
  });

  await t.test('path-confusing resource name', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/skills.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.skills[0].resources = ['references/contract name.md'];
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /printable ASCII|invalid relative path/i);
  });
});

test('malformed catalog records and frontmatter produce actionable validation errors', async (t) => {
  await t.test('non-array aliases', async () => {
    const root = await fixture();
    const file = path.join(root, 'source/catalog/intents.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.intents[0].aliases = { malformed: true };
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /^Factory validation failed:/u);
    assert.match(result.stderr, /intents\[0\]\.aliases/i);
    assert.doesNotMatch(result.stderr, /TypeError/u);
  });

  await t.test('missing frontmatter description', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'source/skills/test-site-routing/SKILL.md'), '---\nname: test-site-routing\n---\n\n# Instructions\n');
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /^Factory validation failed:/u);
    assert.match(result.stderr, /frontmatter.*description/i);
    assert.doesNotMatch(result.stderr, /TypeError/u);
  });

  for (const [catalogName, arrayKey, missingId] of [
    ['categories', 'categories', { label: 'Missing key' }],
    ['intents', 'intents', { label: 'Missing key' }],
    ['skills', 'skills', { description: 'Missing id' }],
    ['template-evidence', 'templates', { repository: 'missing-template-key' }],
  ]) {
    for (const [shape, records] of [
      ['repeated nulls', [null, null]],
      ['repeated scalars', [7, 7, 'malformed', 'malformed']],
      ['repeated missing-ID objects', [missingId, { ...missingId }]],
      ['mixed invalid shapes', [null, 7, missingId, [], 'malformed', null]],
    ]) {
      await t.test(`${catalogName} ${shape}`, async () => {
        const root = await fixture();
        const file = path.join(root, `source/catalog/${catalogName}.json`);
        const catalog = JSON.parse(await readFile(file, 'utf8'));
        catalog[arrayKey] = records;
        await writeJson(file, catalog);
        const result = await run('validate', root);
        assert.notEqual(result.code, 0);
        assert.match(result.stderr, /^Factory validation failed:/u);
        assert.doesNotMatch(result.stderr, /TypeError|Cannot (?:read|convert)|is not iterable/u);
      });
    }
  }
});

test('template evidence paths are schema-backed printable canonical paths', async (t) => {
  for (const [label, evidencePath] of [
    ['newline', 'src/pages/index.astro\nsecond'],
    ['backslash', 'src\\pages\\index.astro'],
    ['traversal', 'src/../secret.txt'],
    ['non-ascii', 'src/café.md'],
  ]) {
    await t.test(label, async () => {
      const root = await fixture();
      await writeJson(path.join(root, 'source/catalog/template-evidence.json'), {
        schemaVersion: '1',
        templates: [{ templateKey: 'neutral-base', repository: 'base-template', commit: '0'.repeat(40), paths: [evidencePath] }],
      });
      const result = await run('validate', root);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /template.*path|printable canonical/i);
    });
  }
});

test('validate rejects symlinks and executable payloads', async (t) => {
  await t.test('symlink', async () => {
    const root = await fixture();
    await symlink('contracts.md', path.join(root, 'source/skills/test-site-routing/references/link.md'));
    const file = path.join(root, 'source/catalog/skills.json');
    const catalog = JSON.parse(await readFile(file, 'utf8'));
    catalog.skills[0].resources.push('references/link.md');
    await writeJson(file, catalog);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /symlink.*references\/link\.md/i);
  });

  await t.test('executable', async () => {
    const root = await fixture();
    const resource = path.join(root, 'source/skills/test-site-routing/references/contracts.md');
    await chmod(resource, 0o755);
    const result = await run('validate', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /executable.*references\/contracts\.md/i);
  });
});

test('safety rejects secret values, legacy names, and browser-secret guidance', async (t) => {
  const cases = [
    ['API_TOKEN=ghp_abcdefghijklmnopqrstuvwxyz1234567890', /possible secret value/i],
    ['PREVIEW_ASTROCONNECT_D1_DATABASE_ID', /legacy generated-site name/i],
    ['Store the API secret in localStorage for the browser.', /unsafe browser-secret guidance/i],
  ];
  for (const [contamination, expected] of cases) {
    await t.test(contamination.slice(0, 24), async () => {
      const root = await fixture();
      await writeFile(path.join(root, 'source/skills/test-site-routing/references/contracts.md'), `${contamination}\n`);
      const result = await run('safety', root);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, expected);
    });
  }
});

test('audit validates evidence and can verify a checked-out template', async () => {
  const root = await fixture();
  const templates = await mkdtemp(path.join(os.tmpdir(), 'skills-template-test-'));
  const template = path.join(templates, 'base-template');
  await execFileAsync('git', ['init', '-q', template]);
  await execFileAsync('git', ['-C', template, 'config', 'user.email', 'test@example.com']);
  await execFileAsync('git', ['-C', template, 'config', 'user.name', 'Test']);
  await cp(path.join(root, 'source/foundation/AGENTS.md'), path.join(template, 'AGENTS.md'));
  await writeFile(path.join(template, 'index.txt'), 'fixture\n');
  await execFileAsync('git', ['-C', template, 'add', '.']);
  await execFileAsync('git', ['-C', template, 'commit', '-qm', 'fixture']);
  const { stdout: commit } = await execFileAsync('git', ['-C', template, 'rev-parse', 'HEAD']);
  const evidenceFile = path.join(root, 'source/catalog/template-evidence.json');
  await writeJson(evidenceFile, {
    schemaVersion: '1',
    templates: [{ templateKey: 'neutral-base', repository: 'base-template', commit: commit.trim(), paths: ['AGENTS.md'] }],
  });
  const result = await run('audit', root, '--templates-root', templates);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /audited 1 template evidence record/i);
});

test('audit reads evidence from the declared Git object', async (t) => {
  async function repositoryFixture() {
    const root = await fixture();
    const templates = await mkdtemp(path.join(os.tmpdir(), 'skills-template-hostile-'));
    const template = path.join(templates, 'base-template');
    await execFileAsync('git', ['init', '-q', template]);
    await execFileAsync('git', ['-C', template, 'config', 'user.email', 'test@example.com']);
    await execFileAsync('git', ['-C', template, 'config', 'user.name', 'Test']);
    await writeFile(path.join(template, 'tracked.txt'), 'tracked\n');
    await execFileAsync('git', ['-C', template, 'add', '.']);
    await execFileAsync('git', ['-C', template, 'commit', '-qm', 'fixture']);
    const { stdout } = await execFileAsync('git', ['-C', template, 'rev-parse', 'HEAD']);
    return { root, templates, template, commit: stdout.trim() };
  }

  await t.test('untracked evidence path', async () => {
    const fixtureState = await repositoryFixture();
    await writeFile(path.join(fixtureState.template, 'untracked.txt'), 'untracked\n');
    await writeJson(path.join(fixtureState.root, 'source/catalog/template-evidence.json'), {
      schemaVersion: '1',
      templates: [{ templateKey: 'neutral-base', repository: 'base-template', commit: fixtureState.commit, paths: ['untracked.txt'] }],
    });
    const result = await run('audit', fixtureState.root, '--templates-root', fixtureState.templates);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /not present in declared Git object|untracked/i);
  });

  await t.test('symlinked evidence path component', async () => {
    const fixtureState = await repositoryFixture();
    await mkdir(path.join(fixtureState.template, 'real'));
    await writeFile(path.join(fixtureState.template, 'real/evidence.md'), 'evidence\n');
    await symlink('real', path.join(fixtureState.template, 'linked'));
    await execFileAsync('git', ['-C', fixtureState.template, 'add', '.']);
    await execFileAsync('git', ['-C', fixtureState.template, 'commit', '-qm', 'symlink fixture']);
    const { stdout } = await execFileAsync('git', ['-C', fixtureState.template, 'rev-parse', 'HEAD']);
    await writeJson(path.join(fixtureState.root, 'source/catalog/template-evidence.json'), {
      schemaVersion: '1',
      templates: [{ templateKey: 'neutral-base', repository: 'base-template', commit: stdout.trim(), paths: ['linked/evidence.md'] }],
    });
    const result = await run('audit', fixtureState.root, '--templates-root', fixtureState.templates);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /symlink.*linked|linked.*symlink/i);
  });
});

test('build rejects an output path redirected through a symlink ancestor', async () => {
  const root = await fixture();
  await symlink(path.join(root, 'source'), path.join(root, 'dist'));
  const result = await run('build', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /output.*symlink|output.*source|canonical output/i);
});

test('CLI rejects unknown, duplicate, missing-value, and inapplicable flags', async (t) => {
  const root = await fixture();
  for (const [name, command, args, expected] of [
    ['unknown audit typo', 'audit', ['--templates-rooot', root], /unknown flag.*templates-rooot/i],
    ['duplicate root', 'validate', ['--root', root, '--root', root], /duplicate flag.*root/i],
    ['missing value', 'audit', ['--templates-root'], /missing value.*templates-root/i],
    ['inapplicable flag', 'validate', ['--expected-commit', '0'.repeat(40)], /not valid for validate|inapplicable/i],
    ['removed out-dir', 'build', ['--out-dir', path.join(root, 'elsewhere')], /unknown flag.*out-dir|not valid for build/i],
    ['removed source override', 'build', ['--source-commit', '0'.repeat(40)], /unknown flag.*source-commit|not valid for build/i],
  ]) {
    await t.test(name, async () => {
      const result = await run(command, root, ...args);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, expected);
    });
  }
});

test('build requires clean exact Git provenance', async (t) => {
  await t.test('dirty checkout', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'untracked.txt'), 'dirty\n');
    const result = await run('build', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /Git checkout.*clean|dirty|untracked/i);
  });

  await t.test('expected commit mismatch', async () => {
    const root = await fixture();
    await writeFile(path.join(root, 'second.txt'), 'second\n');
    await execFileAsync('git', ['-C', root, 'add', '.']);
    await execFileAsync('git', ['-C', root, 'commit', '-qm', 'second']);
    const { stdout: previous } = await execFileAsync('git', ['-C', root, 'rev-parse', 'HEAD^']);
    const result = await run('build', root, '--expected-commit', previous.trim());
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /expected commit.*does not match.*HEAD/i);
  });

  await t.test('nonexistent expected commit', async () => {
    const root = await fixture();
    const result = await run('build', root, '--expected-commit', '0'.repeat(40));
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /expected commit.*does not exist|not.*existing commit/i);
  });

  await t.test('ignored declared source resource', async () => {
    const root = await fixture();
    const catalogFile = path.join(root, 'source/catalog/skills.json');
    const catalog = JSON.parse(await readFile(catalogFile, 'utf8'));
    catalog.skills[0].resources.push('references/ignored.md');
    await writeJson(catalogFile, catalog);
    await execFileAsync('git', ['-C', root, 'add', catalogFile]);
    await execFileAsync('git', ['-C', root, 'commit', '-qm', 'declare ignored resource']);
    await writeFile(path.join(root, '.git/info/exclude'), 'source/skills/test-site-routing/references/ignored.md\n');
    await writeFile(path.join(root, 'source/skills/test-site-routing/references/ignored.md'), 'ignored but declared\n');
    const result = await run('build', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /build input.*tracked|ignored.*not allowed|HEAD blob/i);
  });

  await t.test('assume-unchanged tracked source bytes', async () => {
    const root = await fixture();
    const resource = path.join(root, 'source/skills/test-site-routing/references/contracts.md');
    await execFileAsync('git', ['-C', root, 'update-index', '--assume-unchanged', 'source/skills/test-site-routing/references/contracts.md']);
    await writeFile(resource, 'changed while hidden from status\n');
    const result = await run('build', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /byte-identical.*HEAD|differs from.*HEAD blob/i);
  });

  for (const relative of ['package.json', 'package-lock.json', '.node-version']) {
    await t.test(`assume-unchanged byte-identical external symlink for ${relative}`, async () => {
      const root = await fixture();
      const external = path.join(await mkdtemp(path.join(os.tmpdir(), 'skills-factory-external-')), path.basename(relative));
      await writeFile(external, await readFile(path.join(root, relative)));
      await execFileAsync('git', ['-C', root, 'update-index', '--assume-unchanged', relative]);
      await rm(path.join(root, relative));
      await symlink(external, path.join(root, relative));
      const result = await run('build', root);
      assert.notEqual(result.code, 0);
      assert.match(result.stderr, /build input.*regular file|symlink/i);
      assert.match(result.stderr, /^Factory validation failed:/u);
      assert.doesNotMatch(result.stderr, /TypeError|Cannot (?:read|convert)/u);
    });
  }
});

test('build refuses to replace an unrecognized dist directory', async () => {
  const root = await fixture();
  await mkdir(path.join(root, 'dist'));
  await writeFile(path.join(root, 'dist/user-file.txt'), 'preserve me\n');
  const result = await run('build', root);
  assert.notEqual(result.code, 0);
  assert.match(result.stderr, /dist.*not recognized|ownership marker/i);
  assert.equal(await readFile(path.join(root, 'dist/user-file.txt'), 'utf8'), 'preserve me\n');
});

test('pre-marker artifacts are always preserved and rejected', async (t) => {
  await t.test('pristine pre-marker artifact', async () => {
    const root = await fixture();
    assert.equal((await run('build', root)).code, 0);
    await rm(path.join(root, 'dist/.astropages-skills-factory-output'));
    const before = await readFile(path.join(root, 'dist/skills-bundle.tar'));
    const result = await run('build', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /ownership marker|required before replacement/i);
    assert.deepEqual(await readFile(path.join(root, 'dist/skills-bundle.tar')), before);
  });

  await t.test('digest-adjusted tampered pre-marker artifact', async () => {
    const root = await fixture();
    assert.equal((await run('build', root)).code, 0);
    await rm(path.join(root, 'dist/.astropages-skills-factory-output'));
    const archiveFile = path.join(root, 'dist/skills-bundle.tar');
    const archive = Buffer.from(await readFile(archiveFile));
    archive[600] ^= 0xff;
    await writeFile(archiveFile, archive);
    const attestationFile = path.join(root, 'dist/build-attestation.json');
    const attestation = JSON.parse(await readFile(attestationFile, 'utf8'));
    attestation.artifactSha256 = hash(archive);
    await writeJson(attestationFile, attestation);
    const before = await readFile(archiveFile);
    const result = await run('build', root);
    assert.notEqual(result.code, 0);
    assert.match(result.stderr, /ownership marker|required before replacement/i);
    assert.deepEqual(await readFile(archiveFile), before);
  });
});

test('build emits the exact contract with valid hashes and no attestation inside the tar', async () => {
  const root = await fixture();
  const result = await run('build', root);
  assert.equal(result.code, 0, result.stderr);
  const bundle = path.join(root, 'dist/bundle');
  const manifest = JSON.parse(await readFile(path.join(bundle, 'bundle.manifest.json'), 'utf8'));
  const bundledSkillCatalog = JSON.parse(await readFile(path.join(bundle, 'catalog/skills.json'), 'utf8'));
  assert.equal(bundledSkillCatalog.skills[0].activityLabel, 'Inspecting site structure');
  assert.deepEqual(manifest.files.map(({ path: file }) => file), [
    '.agents/skills/test-site-routing/SKILL.md',
    '.agents/skills/test-site-routing/references/contracts.md',
    'AGENTS.md',
    'catalog/intents.json',
    'catalog/skills.json',
  ]);
  assert.match(manifest.contentSha256, /^[a-f0-9]{64}$/);
  for (const record of manifest.files) {
    const bytes = await readFile(path.join(bundle, record.path));
    assert.equal(record.size, bytes.length);
    assert.equal(record.sha256, hash(bytes));
  }
  assert.equal(manifest.contentSha256, hash(Buffer.from(JSON.stringify(canonical(manifest.files)))));
  const attestation = JSON.parse(await readFile(path.join(root, 'dist/build-attestation.json'), 'utf8'));
  assert.match(attestation.artifactSha256, /^[a-f0-9]{64}$/);
  assert.equal(attestation.contentSha256, manifest.contentSha256);
  const tar = await readFile(path.join(root, 'dist/skills-bundle.tar'));
  assert.equal(attestation.artifactSha256, hash(tar));
  assert.equal(tar.includes(Buffer.from('build-attestation.json')), false);
  assert.equal(tar.includes(Buffer.from('artifactSha256')), false);
  const entries = parseTar(tar);
  assert.deepEqual(entries.map(({ path: entryPath }) => entryPath), [
    '.agents/skills/test-site-routing/SKILL.md',
    '.agents/skills/test-site-routing/references/contracts.md',
    'AGENTS.md',
    'bundle.manifest.json',
    'catalog/intents.json',
    'catalog/skills.json',
  ]);
  for (const entry of entries) {
    assert.equal(entry.mode, 0o644);
    assert.equal(entry.uid, 0);
    assert.equal(entry.gid, 0);
    assert.equal(entry.mtime, 0);
    assert.equal(entry.type, '0');
    assert.equal(entry.checksumValid, true);
    assert.equal(entry.size, entry.body.length);
    assert.deepEqual(entry.body, await readFile(path.join(bundle, entry.path)));
  }
});

test('reproducibility produces byte-identical archives and manifests', async () => {
  const root = await fixture();
  const a = await run('build', root);
  const firstTar = await readFile(path.join(root, 'dist/skills-bundle.tar'));
  const firstManifest = await readFile(path.join(root, 'dist/bundle/bundle.manifest.json'));
  const b = await run('build', root);
  assert.equal(a.code, 0, a.stderr);
  assert.equal(b.code, 0, b.stderr);
  assert.deepEqual(firstTar, await readFile(path.join(root, 'dist/skills-bundle.tar')));
  assert.deepEqual(firstManifest, await readFile(path.join(root, 'dist/bundle/bundle.manifest.json')));
  const result = await run('reproducibility', root);
  assert.equal(result.code, 0, result.stderr);
  assert.match(result.stdout, /reproducible.*artifact/i);
});

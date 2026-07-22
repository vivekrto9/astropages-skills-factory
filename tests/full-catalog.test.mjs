import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';

const root = path.resolve('.');
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const readText = async (relative) => readFile(path.join(root, relative), 'utf8');

test('runtime catalog exactly publishes the approved 90 public intents and 29 private skills', async () => {
  const inventory = await readJson('docs/research/skill-inventory-v1.json');
  const runtimeIntents = await readJson('source/catalog/intents.json');
  const runtimeSkills = await readJson('source/catalog/skills.json');

  assert.equal(inventory.intents.length, 90);
  assert.equal(inventory.internalSkills.length, 29);
  assert.equal(runtimeIntents.intents.length, 90);
  assert.equal(runtimeSkills.skills.length, 29);

  assert.deepEqual(runtimeIntents.intents, inventory.intents.map((intent) => ({
    key: intent.key,
    label: intent.label,
    categoryKey: intent.categoryKey,
    description: intent.description,
    aliases: intent.aliases,
    userExamples: intent.userExamples,
    internalSkills: intent.internalSkills,
    toolDependencies: intent.toolDependencies,
  })));

  assert.deepEqual(runtimeSkills.skills.map(({ id }) => id), inventory.internalSkills.map(({ key }) => key));
  for (const record of runtimeSkills.skills) {
    const inventorySkill = inventory.internalSkills.find(({ key }) => key === record.id);
    assert.ok(inventorySkill, `unknown runtime skill: ${record.id}`);
    assert.equal(record.version, '1.0.0');
    assert.equal(record.compatibleAiRuntime, '>=1.24.0 <1.25.0');
    assert.equal(record.entry, 'SKILL.md');
    assert.match(record.activityLabel, /^(?=.*[\p{L}\p{N}\p{P}\p{S}])(?!.*\p{C}).{1,80}$/u);
    assert.deepEqual(record.intents, inventory.intents
      .filter(({ internalSkills }) => internalSkills.includes(record.id))
      .map(({ key }) => key));
  }
});

test('all 11 approved categories retain stable UI metadata and every intent belongs to one', async () => {
  const inventory = await readJson('docs/research/skill-inventory-v1.json');
  const { categories } = await readJson('source/catalog/categories.json');
  const { intents } = await readJson('source/catalog/intents.json');

  assert.equal(categories.length, 11);
  assert.deepEqual(categories.map(({ key, label }) => ({ key, name: label })), inventory.categories);
  assert.deepEqual(categories.map(({ order }) => order), Array.from({ length: 11 }, (_, index) => index + 1));
  for (const category of categories) {
    assert.match(category.icon, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    assert.ok(intents.some(({ categoryKey }) => categoryKey === category.key), `empty category: ${category.key}`);
  }
  assert.ok(intents.every(({ categoryKey }) => categories.some(({ key }) => key === categoryKey)));
});

test('public intent copy stays separate from private skill identifiers and implementation instructions', async () => {
  const { intents } = await readJson('source/catalog/intents.json');
  const { skills } = await readJson('source/catalog/skills.json');
  const publicCopy = intents.flatMap((intent) => [
    intent.label,
    intent.description,
    ...intent.aliases,
    ...intent.userExamples,
  ]).join('\n').toLowerCase();

  const preservedEvaluatedSkills = new Set([
    'generated-site-discovery-and-routing',
    'astro-ui-and-design-system',
    'responsive-accessibility-and-performance',
    'astrology-provider-adapters',
    'horoscope-panchang-numerology-and-tarot',
    'research-external-integrations',
    'integrations-webhooks-automation-and-consent',
    'runtime-config-secrets-and-provider-readiness',
  ]);
  for (const skill of skills) {
    assert.doesNotMatch(publicCopy, new RegExp(skill.id, 'u'));
    const text = await readText(`source/skills/${skill.id}/${skill.entry}`);
    assert.match(text, /^---\nname: [a-z0-9-]+\ndescription: Use this skill when /u);
    if (preservedEvaluatedSkills.has(skill.id)) continue;
    assert.match(text, /inspect|trace|confirm|inventory/iu, `${skill.id} must require target inspection`);
    assert.match(text, /smallest|bounded|requested|within scope/iu, `${skill.id} must bound the change`);
    assert.match(text, /test|verify|validation/iu, `${skill.id} must require verification`);
    assert.match(text, /report|claim|evidence|limitation|unsupported|unresolved/iu, `${skill.id} must report evidence or limits`);
  }
});

test('complete catalog and skills contain no legacy branding or secret values', async () => {
  const { skills } = await readJson('source/catalog/skills.json');
  const paths = [
    'source/catalog/categories.json',
    'source/catalog/intents.json',
    'source/catalog/skills.json',
    'source/foundation/AGENTS.md',
    ...skills.flatMap((skill) => [skill.entry, ...skill.resources]
      .map((relative) => `source/skills/${skill.id}/${relative}`)),
  ];
  const text = (await Promise.all(paths.map(readText))).join('\n');

  assert.doesNotMatch(text, /PREVIEW_ASTROCONNECT_|PREVIEW_ASTRAGURU_|PROD_ASTRAGURU_|astropages-capabilities/iu);
  assert.doesNotMatch(text, /(?:api[_-]?key|token|secret|password)\s*[:=]\s*["'][^"']{8,}["']/iu);
});

test('foundation activates genuinely relevant skills without exposing routing internals', async () => {
  const foundation = await readText('source/foundation/AGENTS.md');
  assert.match(foundation, /inspect (?:all )?available skills for every request/i);
  assert.match(foundation, /invoke each genuinely relevant skill before implementation/i);
  assert.match(foundation, /explicitly selected skills?.*mandatory/i);
  assert.match(foundation, /supporting skills/i);
  assert.match(foundation, /weak keyword overlap/i);
  assert.doesNotMatch(foundation, /Use only the internal skills mapped by the pinned public intent/i);
});

test('all skill descriptions encode user intent, implicit cases, and meaningful exclusions', async () => {
  const { skills } = await readJson('source/catalog/skills.json');
  const genericClause = /^(?:implicit|related|relevant|other|unrelated) (?:cases|requests|work)$/iu;
  const words = (clause) => clause.match(/[\p{L}\p{N}]+(?:[-'][\p{L}\p{N}]+)*/gu) ?? [];

  for (const skill of skills) {
    const text = await readText(`source/skills/${skill.id}/${skill.entry}`);
    const description = text.match(/^description: (.+)$/mu)?.[1] ?? '';
    const selection = description.match(
      /^Use this skill when (?<intent>.+?), including (?<implicit>.+?); not for (?<exclusion>.+)\.$/u,
    );

    assert.ok(selection?.groups, `${skill.id} must encode intent, implicit cases, and a near-miss exclusion`);
    const { intent, implicit, exclusion } = selection.groups;
    assert.match(intent, /\b(?:a user|user request|a request)\b/iu, `${skill.id} must frame selection as user intent`);
    for (const [kind, clause, minimumWords, minimumCharacters] of [
      ['intent', intent, 6, 30],
      ['implicit-case', implicit, 2, 15],
      ['near-miss exclusion', exclusion, 2, 20],
    ]) {
      assert.ok(words(clause).length >= minimumWords, `${skill.id} ${kind} clause is too generic: ${clause}`);
      assert.ok(clause.length >= minimumCharacters, `${skill.id} ${kind} clause is too generic: ${clause}`);
      assert.doesNotMatch(clause, genericClause, `${skill.id} ${kind} clause is generic: ${clause}`);
    }
  }
});

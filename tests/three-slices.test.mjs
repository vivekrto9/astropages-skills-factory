import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
import { normalizeRoutingTerm } from '../lib/canonical.mjs';

const root = path.resolve('.');
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const readText = async (relative) => readFile(path.join(root, relative), 'utf8');

const EXPECTED_INTENTS = {
  'refresh-homepage': {
    label: 'Refresh homepage',
    categoryKey: 'website-design',
    internalSkills: [
      'generated-site-discovery-and-routing',
      'astro-ui-and-design-system',
      'responsive-accessibility-and-performance',
    ],
    toolDependencies: ['none'],
  },
  'add-daily-panchang': {
    label: 'Add daily Panchang',
    categoryKey: 'astrology-experiences',
    internalSkills: [
      'generated-site-discovery-and-routing',
      'astrology-provider-adapters',
      'horoscope-panchang-numerology-and-tarot',
    ],
    toolDependencies: ['astrologyapi-mcp', 'project-secrets'],
  },
  'integrate-unsupported-provider': {
    label: 'Integrate unsupported provider',
    categoryKey: 'integrations-and-automation',
    internalSkills: [
      'research-external-integrations',
      'integrations-webhooks-automation-and-consent',
      'runtime-config-secrets-and-provider-readiness',
    ],
    toolDependencies: ['official-web-research', 'project-secrets'],
  },
};

const EXPECTED_SKILLS = Object.values(EXPECTED_INTENTS).flatMap(({ internalSkills }) => internalSkills);

async function skillText(id) {
  return readText(`source/skills/${id}/SKILL.md`);
}

test('the evaluated three intents and eight private skills remain exact catalog slices', async () => {
  const { intents } = await readJson('source/catalog/intents.json');
  const { skills } = await readJson('source/catalog/skills.json');

  assert.deepEqual(intents.filter(({ key }) => key in EXPECTED_INTENTS).map(({ key }) => key), Object.keys(EXPECTED_INTENTS));
  assert.deepEqual(
    skills.filter(({ id }) => EXPECTED_SKILLS.includes(id)).map(({ id }) => id).sort(),
    [...new Set(EXPECTED_SKILLS)].sort(),
  );
  assert.equal(new Set(EXPECTED_SKILLS).size, 8);

  for (const intent of intents.filter(({ key }) => key in EXPECTED_INTENTS)) {
    const expected = EXPECTED_INTENTS[intent.key];
    assert.equal(intent.label, expected.label);
    assert.equal(intent.categoryKey, expected.categoryKey);
    assert.deepEqual(intent.internalSkills, expected.internalSkills);
    assert.deepEqual(intent.toolDependencies, expected.toolDependencies);
  }
  for (const skill of skills.filter(({ id }) => EXPECTED_SKILLS.includes(id))) {
    assert.equal(skill.version, '1.0.0');
    assert.equal(skill.compatibleAiRuntime, '>=1.24.0 <1.25.0');
    assert.equal(skill.entry, 'SKILL.md');
    assert.ok(skill.intents.some((intent) => Object.keys(EXPECTED_INTENTS).includes(intent)));
  }
});

test('public catalog copy never exposes private internal skill identifiers', async () => {
  const { intents } = await readJson('source/catalog/intents.json');
  const publicCopy = intents.flatMap((intent) => [
    intent.label,
    intent.description,
    ...intent.aliases,
    ...intent.userExamples,
  ]).join('\n').toLowerCase();

  for (const skillId of EXPECTED_SKILLS) assert.doesNotMatch(publicCopy, new RegExp(skillId, 'u'));
});

test('homepage refresh instructions preserve the target source of truth and bound visual work', async () => {
  const discovery = await skillText('generated-site-discovery-and-routing');
  const design = await skillText('astro-ui-and-design-system');
  const quality = await skillText('responsive-accessibility-and-performance');

  assert.match(discovery, /inspect.*routes.*components.*content bindings.*runtime configuration.*tests/is);
  assert.match(discovery, /smallest.*change surface/is);
  assert.match(design, /preserve.*copy.*EmDash.*bindings.*brand/is);
  assert.match(design, /existing design system/is);
  assert.match(design, /do not copy.*Pandit.*branding/is);
  assert.match(quality, /responsive.*keyboard.*focus.*reduced motion/is);
  assert.match(quality, /focused.*full.*verification/is);
});

test('Panchang instructions use AstrologyAPI MCP only for builder-time discovery and safe runtime integration', async () => {
  const foundation = await readText('source/foundation/AGENTS.md');
  const discovery = await skillText('generated-site-discovery-and-routing');
  const adapter = await skillText('astrology-provider-adapters');
  const experience = await skillText('horoscope-panchang-numerology-and-tarot');
  const all = `${adapter}\n${experience}`;

  assert.match(foundation, /catalog-managed.*reserved.*must not.*astropages\/secrets\.manifest\.json/is);
  assert.match(discovery, /existing.*route.*component.*server handler.*reuse/is);
  assert.match(discovery, /do not create.*parallel.*content.*collection/is);
  assert.match(adapter, /sole owner.*AstrologyAPI MCP/is);
  assert.match(adapter, /builder-time.*official.*capabilit.*schema.*discover/is);
  assert.match(adapter, /not.*generated-site runtime.*calculation tool/is);
  assert.match(adapter, /catalog-managed.*reserved.*X_ASTROLOGYAPI_KEY/is);
  assert.match(adapter, /target repository.*current secret resolver/is);
  assert.match(adapter, /must not.*X_ASTROLOGYAPI_KEY.*astropages\/secrets\.manifest\.json/is);
  assert.match(adapter, /missing.*X_ASTROLOGYAPI_KEY.*no live call.*catalog-managed integration-not-ready state/is);
  assert.match(adapter, /Task 11.*out of scope/is);
  assert.match(adapter, /inspect.*MCP.*during.*builder/is);
  assert.match(experience, /date.*location.*time ?zone/is);
  assert.match(experience, /verify.*provider output/is);
  assert.match(experience, /do not.*claim.*calculation/is);
  assert.doesNotMatch(all, /advanced_panchang|ASTROLOGY_API_USER_ID|ASTROLOGY_API_KEY|astropages-capabilities/iu);
});

test('only the declared provider-adapter package mentions AstrologyAPI MCP', async () => {
  const { skills } = await readJson('source/catalog/skills.json');
  const owners = [];
  for (const skill of skills) {
    for (const relative of [skill.entry, ...skill.resources]) {
      const text = await readText(`source/skills/${skill.id}/${relative}`);
      if (/AstrologyAPI[ -]MCP|astrologyapi-mcp/iu.test(text)) owners.push(`${skill.id}/${relative}`);
    }
  }
  assert.ok(owners.length > 0);
  assert.ok(owners.every((relative) => relative.startsWith('astrology-provider-adapters/')), owners.join('\n'));
});

test('unsupported integration instructions require official research, real server mechanics, and Project Secrets readiness', async () => {
  const research = await skillText('research-external-integrations');
  const mechanics = await skillText('integrations-webhooks-automation-and-consent');
  const readiness = await skillText('runtime-config-secrets-and-provider-readiness');

  assert.match(research, /current official.*documentation/is);
  assert.match(research, /not.*model memory.*third-party tutorial/is);
  assert.match(research, /actionable unsupported state/is);
  assert.match(mechanics, /server-side.*authentication.*request.*response/is);
  assert.match(mechanics, /when.*verified official contract.*webhook/is);
  assert.match(mechanics, /strongest.*official.*authenticity.*replay/is);
  assert.match(mechanics, /authenticity.*cannot be established.*actionable unsupported state/is);
  assert.match(mechanics, /do not invent.*signature.*timestamp.*event ID/is);
  assert.match(mechanics, /consent.*idempot/is);
  assert.match(mechanics, /inspect.*CSRF.*origin.*spam.*abuse.*rate.?limit.*duplicate.?submit.*idempotency/is);
  assert.match(mechanics, /proportionate.*public mutation endpoint/is);
  assert.match(mechanics, /consent.*retention.*deletion.*conditional.*data purpose.*provider contract.*existing policy.*requested scope/is);
  assert.match(mechanics, /do not create.*broad.*policy.*database/is);
  assert.match(readiness, /same exact generated-repository commit/is);
  assert.match(readiness, /astropages\/secrets\.manifest\.json/is);
  assert.match(readiness, /optional.*HTTPS.*documentationUrl/is);
  assert.match(readiness, /missing.*secret.*no live call/is);
  assert.match(readiness, /generated runtime.*structured.*readiness state/is);
  assert.match(readiness, /Builder Client.*owns.*Setup card.*Project Secrets/is);
  assert.match(readiness, /do not hardcode.*dashboard URL.*generated/is);
  assert.match(readiness, /catalog-managed.*reserved.*must not.*manifest/is);
  assert.match(readiness, /never.*secret value/is);
});

test('three-slice eval contract is deterministic and forbids fake success claims', async () => {
  const contract = await readJson('evals/contracts/three-slices.json');
  const baseline = await readJson('evals/baselines/scenarios.json');
  const baselineById = new Map(baseline.scenarios.map((scenario) => [scenario.id, scenario]));
  const fixtureCommit = '7e36d4b875c53c9690fa17be699bf17dea9fa8a8';
  const activationByIntent = {
    'refresh-homepage': { mode: 'explicit', selectedIntentKey: 'refresh-homepage', expectedInvokedSkills: ['generated-site-discovery-and-routing', 'astro-ui-and-design-system', 'responsive-accessibility-and-performance'] },
    'add-daily-panchang': { mode: 'native-openhands', selectedIntentKey: null, expectedInvokedSkills: ['generated-site-discovery-and-routing', 'astrology-provider-adapters', 'horoscope-panchang-numerology-and-tarot'] },
    'integrate-unsupported-provider': { mode: 'explicit', selectedIntentKey: 'integrate-unsupported-provider', expectedInvokedSkills: ['research-external-integrations', 'integrations-webhooks-automation-and-consent', 'runtime-config-secrets-and-provider-readiness'] },
  };
  assert.equal(contract.schemaVersion, '1');
  assert.deepEqual(contract.scenarios.map(({ intentKey }) => intentKey), Object.keys(EXPECTED_INTENTS));
  for (const scenario of contract.scenarios) {
    assert.match(scenario.id, /^[a-z0-9]+(?:-[a-z0-9]+)*$/u);
    assert.equal(typeof scenario.prompt, 'string');
    assert.ok(scenario.prompt.length > 20);
    assert.ok(scenario.requiredOutcomes.length >= 3);
    assert.ok(scenario.forbiddenOutcomes.length >= 2);
    assert.ok(scenario.skillTextInvariants.length >= 2);
    assert.equal(new Set(scenario.requiredOutcomes).size, scenario.requiredOutcomes.length);
    assert.equal(new Set(scenario.forbiddenOutcomes).size, scenario.forbiddenOutcomes.length);
    assert.equal(scenario.prompt, baselineById.get(scenario.baselineScenarioId)?.prompt);
    assert.deepEqual(scenario.fixture, {
      repository: 'base-template',
      commit: fixtureCommit,
      checkoutMode: 'new-clean-disposable-worktree',
      skillsBundleMode: 'candidate-under-test',
      reuseBaselineOutput: false,
    });
    assert.deepEqual(scenario.activation, activationByIntent[scenario.intentKey]);
  }
  const panchang = contract.scenarios.find(({ intentKey }) => intentKey === 'add-daily-panchang');
  assert.deepEqual(panchang.dependencySetup, {
    toolDependency: 'astrologyapi-mcp',
    requiredProvenance: 'OpenHands invokes the provider-adapter skill at runtime, then uses only the AI-service compact AstrologyAPI gateway attached to the pinned release',
    currentAvailability: 'compact-gateway-available-when-configured',
    whenAvailable: {
      expectedStatus: 'implementation-eligible',
      requireObservedOfficialToolSchema: true,
    },
    whenUnavailable: {
      expectedStatus: 'actionable-blocked',
      generateProviderCode: false,
      fabricateToolOutput: false,
    },
  });
  const serialized = JSON.stringify(contract);
  assert.match(serialized, /must not claim provider success without a controlled live verification/i);
  assert.match(serialized, /Builder Client owns the Project Secrets Setup card/i);
  assert.match(serialized, /must not declare X_ASTROLOGYAPI_KEY in astropages\/secrets\.manifest\.json/i);
  assert.doesNotMatch(serialized, /generated-domain hardcoded.*Project Secrets/i);
  assert.doesNotMatch(serialized, /https:\/\/[^" ]*\/api\//iu);
});

test('Daily Panchang public picker metadata stays collision-free while runtime activation remains OpenHands-native', async () => {
  const inventory = await readJson('docs/research/skill-inventory-v1.json');
  const runtime = await readJson('source/catalog/intents.json');
  const baseline = await readJson('evals/baselines/scenarios.json');
  const forward = await readJson('evals/contracts/three-slices.json');
  const inventoryIntent = inventory.intents.find(({ key }) => key === 'add-daily-panchang');
  const runtimeIntent = runtime.intents.find(({ key }) => key === 'add-daily-panchang');
  const baselinePrompt = baseline.scenarios.find(({ id }) => id === 'astrology-daily-panchang').prompt;
  const forwardScenario = forward.scenarios.find(({ intentKey }) => intentKey === 'add-daily-panchang');

  assert.ok(inventoryIntent.aliases.includes('daily panchang'));
  assert.deepEqual(runtimeIntent, {
    key: inventoryIntent.key,
    label: inventoryIntent.label,
    categoryKey: inventoryIntent.categoryKey,
    description: inventoryIntent.description,
    aliases: inventoryIntent.aliases,
    userExamples: inventoryIntent.userExamples,
    internalSkills: inventoryIntent.internalSkills,
    toolDependencies: inventoryIntent.toolDependencies,
  });

  const owners = new Map();
  for (const intent of inventory.intents) {
    for (const [kind, term] of [['key', intent.key], ['label', intent.label], ...intent.aliases.map((alias) => ['alias', alias])]) {
      const normalized = normalizeRoutingTerm(term);
      assert.ok(!owners.has(normalized), `routing collision: ${normalized} owned by ${owners.get(normalized)} and ${intent.key}/${kind}`);
      owners.set(normalized, `${intent.key}/${kind}`);
    }
  }
  assert.equal(inventory.intents.length, 90);

  assert.equal(forwardScenario.prompt, baselinePrompt);
  assert.deepEqual(forwardScenario.activation, {
    mode: 'native-openhands',
    selectedIntentKey: null,
    expectedInvokedSkills: [
      'generated-site-discovery-and-routing',
      'astrology-provider-adapters',
      'horoscope-panchang-numerology-and-tarot',
    ],
  });
});

test('template evidence pins only real slice-relevant files at full commits', async () => {
  const { templates } = await readJson('source/catalog/template-evidence.json');
  assert.ok(templates.length >= 2);
  for (const template of templates) {
    assert.match(template.commit, /^[a-f0-9]{40}$/u);
    assert.ok(template.paths.length > 0);
  }
  const paths = templates.flatMap(({ paths }) => paths);
  assert.ok(paths.includes('src/pages/index.astro'));
  assert.ok(paths.some((value) => /panchang/iu.test(value)));
});

import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readJson = async (relative) => JSON.parse(await readFile(path.join(root, relative), 'utf8'));
const writeJson = async (relative, value) => writeFile(
  path.join(root, relative),
  `${JSON.stringify(value, null, 2)}\n`,
  'utf8',
);

const inventory = await readJson('docs/research/skill-inventory-v1.json');
const evaluatedMetadata = {
  'generated-site-discovery-and-routing': ['Locate the generated-site architecture, ownership boundaries, and smallest safe change surface.', []],
  'astro-ui-and-design-system': ["Implement coherent Astro presentation changes within the target site's existing design language.", []],
  'responsive-accessibility-and-performance': ['Verify responsive, accessible, motion-safe, and measured frontend behavior.', []],
  'astrology-provider-adapters': ['Translate inspected official AstrologyAPI contracts into safe generated-site runtime adapters.', ['references/provider-verification.md']],
  'horoscope-panchang-numerology-and-tarot': ['Implement truthful astrology experience states around provider-backed domain data.', []],
  'research-external-integrations': ['Research current official vendor contracts and decide whether an unbundled integration is supportable.', ['references/official-contract-record.md']],
  'integrations-webhooks-automation-and-consent': ['Implement external provider request, webhook, automation, and consent mechanics.', []],
  'runtime-config-secrets-and-provider-readiness': ['Implement Project Secrets declarations, setup states, and provider readiness without accessing values.', ['references/secrets-manifest.md']],
};

const intents = inventory.intents.map((intent) => ({
  key: intent.key,
  label: intent.label,
  categoryKey: intent.categoryKey,
  description: intent.description,
  aliases: intent.aliases,
  userExamples: intent.userExamples,
  internalSkills: intent.internalSkills,
  toolDependencies: intent.toolDependencies,
}));

const skills = inventory.internalSkills.map((inventorySkill) => {
  const [description, resources] = evaluatedMetadata[inventorySkill.key] ?? [inventorySkill.purpose, []];
  return {
    id: inventorySkill.key,
    version: '1.0.0',
    description,
    compatibleAiRuntime: '>=1.24.0 <1.25.0',
    entry: 'SKILL.md',
    resources,
    intents: intents.filter(({ internalSkills }) => internalSkills.includes(inventorySkill.key)).map(({ key }) => key),
  };
});

await writeJson('source/catalog/intents.json', { schemaVersion: '1', intents });
await writeJson('source/catalog/skills.json', { schemaVersion: '1', skills });

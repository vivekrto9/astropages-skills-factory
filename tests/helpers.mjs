import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

export const CATEGORY_LABELS = [
  'Website Design',
  'Content & Languages',
  'Assets & Media',
  'SEO & Discoverability',
  'Marketing & Analytics',
  'Store & Orders',
  'Services & Bookings',
  'Astrology Experiences',
  'Customer Accounts',
  'Integrations & Automation',
  'Fix & Improve',
];

const categoryKey = (label) => label
  .normalize('NFKC')
  .toLowerCase()
  .replace(/&/g, 'and')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

export async function writeJson(file, value) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, `${JSON.stringify(value, null, 2)}\n`);
}

export async function makeFactory(root) {
  await cp(path.resolve('schemas'), path.join(root, 'schemas'), { recursive: true });
  await cp(path.resolve('lib'), path.join(root, 'lib'), { recursive: true });
  await cp(path.resolve('scripts'), path.join(root, 'scripts'), { recursive: true });
  for (const file of ['package.json', 'package-lock.json', '.node-version']) {
    await cp(path.resolve(file), path.join(root, file));
  }
  await writeFile(path.join(root, '.gitignore'), 'dist/\nnode_modules/\n.skills-dist-staging-*\n.skills-dist-previous-*\n');
  const categories = CATEGORY_LABELS.map((label, index) => ({
    key: categoryKey(label),
    label,
    description: `${label} actions`,
    icon: `icon-${index + 1}`,
    order: index + 1,
  }));
  const skill = {
    id: 'test-site-routing',
    version: '1.0.0',
    description: 'Locate the generated-site change surface.',
    compatibleAiRuntime: '>=1.24.0 <1.25.0',
    entry: 'SKILL.md',
    resources: ['references/contracts.md'],
    intents: ['refresh-homepage'],
  };
  const intent = {
    key: 'refresh-homepage',
    label: 'Refresh homepage',
    categoryKey: categories[0].key,
    description: 'Refresh the homepage without changing business content.',
    aliases: ['redesign my homepage'],
    userExamples: ['Give my homepage a visual refresh.'],
    internalSkills: [skill.id],
    toolDependencies: ['none'],
  };

  await writeJson(path.join(root, 'source/catalog/categories.json'), {
    schemaVersion: '1',
    categories,
  });
  await writeJson(path.join(root, 'source/catalog/intents.json'), {
    schemaVersion: '1',
    intents: [intent],
  });
  await writeJson(path.join(root, 'source/catalog/skills.json'), {
    schemaVersion: '1',
    skills: [skill],
  });
  await writeJson(path.join(root, 'source/catalog/template-evidence.json'), {
    schemaVersion: '1',
    templates: [{
      templateKey: 'neutral-base',
      repository: 'base-template',
      commit: '7e36d4b875c53c9690fa17be699bf17dea9fa8a8',
      paths: ['src/pages/index.astro'],
    }],
  });
  await mkdir(path.join(root, 'source/foundation'), { recursive: true });
  await writeFile(path.join(root, 'source/foundation/AGENTS.md'), '# AstroPages builder foundation\n');
  await mkdir(path.join(root, 'source/skills/test-site-routing/references'), { recursive: true });
  await writeFile(
    path.join(root, 'source/skills/test-site-routing/SKILL.md'),
    '---\nname: test-site-routing\ndescription: Use when locating generated-site routes before a bounded edit.\n---\n\n# Test Site Routing\n\nInspect the current project before editing.\n',
  );
  await writeFile(
    path.join(root, 'source/skills/test-site-routing/references/contracts.md'),
    '# Contracts\n\nPreserve generic generated-site contracts.\n',
  );
}

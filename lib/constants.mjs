export const SCHEMA_VERSION = '1';
export const BUILDER_VERSION = '1.0.0';
export const COMPATIBLE_RUNTIME = '>=1.24.0 <1.25.0';
export const LIMITS = Object.freeze({
  intents: 500,
  skills: 128,
  templates: 128,
  aliasesPerIntent: 20,
  examplesPerIntent: 20,
  skillsPerIntent: 8,
  toolsPerIntent: 6,
  resourcesPerSkill: 64,
  intentsPerSkill: 100,
  evidencePathsPerTemplate: 64,
  sourceFiles: 1024,
  sourceFileBytes: 1_048_576,
  sourceTotalBytes: 16_777_216,
  bundleFiles: 1024,
  bundleTotalBytes: 16_777_216,
  archiveBytes: 20_971_520,
});

export const CATEGORY_LABELS = Object.freeze([
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
]);

export const CATEGORY_KEYS = Object.freeze([
  'website-design',
  'content-and-languages',
  'assets-and-media',
  'seo-and-discoverability',
  'marketing-and-analytics',
  'store-and-orders',
  'services-and-bookings',
  'astrology-experiences',
  'customer-accounts',
  'integrations-and-automation',
  'fix-and-improve',
]);

export const TOOL_DEPENDENCIES = new Set([
  'emdash-mcp',
  'project-assets',
  'astrologyapi-mcp',
  'official-web-research',
  'project-secrets',
  'none',
]);

export const SOURCE_CATALOG_FILES = Object.freeze([
  'categories.json',
  'intents.json',
  'skills.json',
  'template-evidence.json',
]);

export const BUNDLE_STATIC_FILES = Object.freeze([
  'AGENTS.md',
  'catalog/intents.json',
  'catalog/skills.json',
]);

export const PUBLISHED_SCHEMAS = Object.freeze([
  'category.schema.json',
  'intent.schema.json',
  'skill.schema.json',
  'template-evidence-record.schema.json',
  'bundle-manifest.schema.json',
]);

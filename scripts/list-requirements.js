#!/usr/bin/env node
/**
 * List requirements for a project, with optional filters.
 * Usage: ./list-requirements.js <project-slug> [options] [--instance <name>]
 *
 * Options:
 *   --feature <uuid>            Filter by feature
 *   --epic <uuid>               Filter by epic
 *   --release <uuid>            Filter by release
 *   --secondary-feature <uuid>  Filter by secondary feature
 *   --refs <1.2,3.4>            Filter by fully qualified refs (integers only)
 *   --include-deprecated        Include deprecated requirements
 */
const cli = require('../lib/cli');

const args = process.argv.slice(2);
const [slug] = cli.positionals(args);

if (!slug) {
  cli.usage('Usage: ./list-requirements.js <project-slug> [--feature <uuid>] [--epic <uuid>] [--release <uuid>] [--refs <1.2,3.4>] [--include-deprecated]');
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  const params = cli.buildBody(flags, {
    feature: 'featureId',
    epic: 'epicId',
    release: 'releaseId',
    'secondary-feature': 'secondaryFeatureId',
    refs: 'refs',
    'include-deprecated': { key: 'includeDeprecated', transform: cli.bool },
  });
  params.projectId = project.id;

  const requirements = await cli.fetchAll(client, '/api/v1/requirement', params);

  if (requirements.length === 0) return console.log('No requirements found.');

  console.log(`\n=== Requirements for project: ${project.name} ===\n`);
  requirements.forEach(r => {
    const type = r.requirementType ? ` [${r.requirementType}]` : '';
    const status = r.status ? ` (${r.status})` : '';
    console.log(`${r.fullyQualifiedRef}${type}${status}`);
    console.log(`  ${r.description}`);
    console.log(`  ID: ${r.id}`);
    console.log();
  });

  console.log(`Total: ${requirements.length} requirement(s)`);
});

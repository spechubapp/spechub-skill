#!/usr/bin/env node
/**
 * List all entities for a project with their details.
 * Usage: ./get-entities.js <project-slug> [options] [--instance <name>]
 *
 * Options:
 *   --feature <uuid>            Filter by feature
 *   --epic <uuid>               Filter by epic
 *   --release <uuid>            Filter by release
 *   --secondary-feature <uuid>  Filter by secondary feature
 *   --refs <1.2,3.4>            Filter by fully qualified refs (integers only)
 *   --include-deprecated        Include deprecated entities
 */
const cli = require('../lib/cli');

const args = process.argv.slice(2);
const [slug] = cli.positionals(args);

if (!slug) {
  cli.usage('Usage: ./get-entities.js <project-slug> [--feature <uuid>] [--epic <uuid>] [--release <uuid>] [--refs <1.2,3.4>] [--include-deprecated]');
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

  const entities = await cli.fetchAll(client, '/api/v1/entity', params);

  console.log(`\n=== Entities for project: ${project.name} ===\n`);
  if (entities.length === 0) return console.log('No entities found.');

  entities.forEach((entity, i) => {
    const status = entity.status ? ` (${entity.status})` : '';
    console.log(`${entity.fullyQualifiedRef}. ${entity.entityName}${status}`);
    if (entity.description) {
      console.log(`   Description: ${entity.description}`);
    }
    if (entity.fields && entity.fields.length > 0) {
      console.log(`   Fields: ${entity.fields.length} field(s)`);
      entity.fields.forEach(f => console.log(`      - ${f.name} (${f.type})`));
    }
    console.log(`   ID: ${entity.id}`);
    console.log();
  });

  console.log(`Total: ${entities.length} entity(ies)`);
});

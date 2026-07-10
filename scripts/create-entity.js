#!/usr/bin/env node
/**
 * Create a new entity (data model entity) in a project.
 * Usage: ./create-entity.js <project-slug> <feature-uuid> <entity-name> [options] [--instance <name>]
 *
 * Options:
 *   --release <release-uuid>
 *   --secondary-feature <feature-uuid>
 *   --status Untested|Passing|Failing
 *   --source <text>
 *   --notes <text>
 *   --business-critical true|false
 */
const cli = require('../lib/cli');

const args = process.argv.slice(2);
const [slug, featureId, entityName] = cli.positionals(args);

if (!slug || !featureId || !entityName) {
  cli.usage(
    'Usage: ./create-entity.js <project-slug> <feature-uuid> <entity-name> [options]',
    'Options: --release <uuid>, --secondary-feature <uuid>, --status, --source, --notes, --business-critical true|false',
    'Example: ./create-entity.js spechub abc-123 "Order"'
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 3);
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  const body = cli.buildBody(flags, {
    release: 'releaseId',
    'secondary-feature': 'secondaryFeatureId',
    status: 'status',
    source: 'source',
    notes: 'notes',
    'business-critical': { key: 'businessCritical', transform: cli.bool },
  });
  Object.assign(body, { projectId: project.id, featureId, entityName });

  const res = await client.post('/api/v1/entity', body);
  const entity = res.data.data;

  console.log(`\nEntity created successfully!\n`);
  console.log(`  Ref:         ${entity.fullyQualifiedRef}`);
  console.log(`  Entity name: ${entity.entityName}`);
  if (entity.status) console.log(`  Status:      ${entity.status}`);
  console.log(`  ID:          ${entity.id}`);
  if (entity.webUrl) console.log(`  URL:         ${entity.webUrl}`);
});

#!/usr/bin/env node
/**
 * Delete an entity by ref or UUID.
 * Usage: ./delete-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the entity.
 * Note: Entity deletion is idempotent (returns 204 on repeated calls).
 */
const cli = require('../lib/cli');
const { resolveEntity } = require('../lib/api-client');

const [projectSlug, refOrId] = cli.positionals(process.argv.slice(2));

if (!projectSlug || !refOrId) {
  cli.usage(
    'Usage: ./delete-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]',
    'Example: ./delete-entity.js spechub 1.1',
    'Example: ./delete-entity.js spechub 123e4567-e89b-12d3-a456-426614174000',
    '',
    '⚠️  WARNING: This permanently deletes the entity.',
    'Note: Entity deletion is idempotent (returns 204 on repeated calls).'
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const entity = await resolveEntity(client, project.id, refOrId);
  
  await client.delete(`/api/v1/entity/${entity.id}`);
  
  console.log(`\nEntity ${entity.fullyQualifiedRef} deleted successfully.`);
  console.log(`  Entity name: ${entity.entityName}`);
});

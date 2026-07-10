#!/usr/bin/env node
/**
 * Delete a requirement by ref or UUID.
 * Usage: ./delete-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the requirement.
 */
const cli = require('../lib/cli');
const { resolveRequirement } = require('../lib/api-client');

const [projectSlug, refOrId] = cli.positionals(process.argv.slice(2));

if (!projectSlug || !refOrId) {
  cli.usage(
    'Usage: ./delete-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]',
    'Example: ./delete-requirement.js spechub 1.23',
    'Example: ./delete-requirement.js spechub 123e4567-e89b-12d3-a456-426614174000',
    '',
    '⚠️  WARNING: This permanently deletes the requirement.'
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const requirement = await resolveRequirement(client, project.id, refOrId);
  
  await client.delete(`/api/v1/requirement/${requirement.id}`);
  console.log(`\nRequirement ${requirement.fullyQualifiedRef} deleted successfully.`);
  console.log(`  Description: ${requirement.description}`);
});

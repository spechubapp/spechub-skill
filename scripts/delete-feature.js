#!/usr/bin/env node
/**
 * Delete a feature by ID.
 * Usage: ./delete-feature.js <feature-id> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the feature.
 */
const cli = require('../lib/cli');

const [id] = cli.positionals(process.argv.slice(2));

if (!id) {
  cli.usage(
    'Usage: ./delete-feature.js <feature-id> [--instance <name>]',
    'Example: ./delete-feature.js 123e4567-e89b-12d3-a456-426614174000',
    '',
    '⚠️  WARNING: This permanently deletes the feature.'
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/feature/${id}`);
  console.log(`\nFeature ${id} deleted successfully.`);
});

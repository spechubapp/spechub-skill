#!/usr/bin/env node
/**
 * Delete a release by ID.
 * Usage: ./delete-release.js <release-id> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the release.
 */
const cli = require('../lib/cli');

const [id] = cli.positionals(process.argv.slice(2));

if (!id) {
  cli.usage(
    'Usage: ./delete-release.js <release-id> [--instance <name>]',
    'Example: ./delete-release.js 123e4567-e89b-12d3-a456-426614174000',
    '',
    '⚠️  WARNING: This permanently deletes the release.'
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/release/${id}`);
  console.log(`\nRelease ${id} deleted successfully.`);
});

#!/usr/bin/env node
/**
 * Delete a user role by ID.
 * Usage: ./delete-userrole.js <userrole-id> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the user role.
 */
const cli = require("../lib/cli");

const [id] = cli.positionals(process.argv.slice(2));

if (!id) {
  cli.usage(
    "Usage: ./delete-userrole.js <userrole-id> [--instance <name>]",
    "Example: ./delete-userrole.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: This permanently deletes the user role.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/userrole/${id}`);
  console.log(`\nUser role ${id} deleted successfully.`);
});

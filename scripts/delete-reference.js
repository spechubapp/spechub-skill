#!/usr/bin/env node
/**
 * Delete an external reference of any type by ID. Deleting a Replacement
 * reference removes the requirement's replacement. REQ 17.3
 * Usage: ./delete-reference.js <reference-uuid> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the external reference.
 */
const cli = require("../lib/cli");

const [id] = cli.positionals(process.argv.slice(2));

if (!id) {
  cli.usage(
    "Usage: ./delete-reference.js <reference-uuid> [--instance <name>]",
    "Example: ./delete-reference.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: This permanently deletes the external reference.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/reference/${id}`);
  console.log(`\nExternal reference ${id} deleted successfully.`);
});

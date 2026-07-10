#!/usr/bin/env node
/**
 * Delete an epic by ID.
 * Usage: ./delete-epic.js <epic-id> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the epic.
 */
const cli = require("../lib/cli");

const [id] = cli.positionals(process.argv.slice(2));

if (!id) {
  cli.usage(
    "Usage: ./delete-epic.js <epic-id> [--instance <name>]",
    "Example: ./delete-epic.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: This permanently deletes the epic.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/epic/${id}`);
  console.log(`\nEpic ${id} deleted successfully.`);
});

#!/usr/bin/env node
/**
 * Delete a project by ID.
 * Usage: ./delete-project.js <project-id> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the project.
 * This also deletes all associated data.
 */
const cli = require("../lib/cli");

const [id] = cli.positionals(process.argv.slice(2));

if (!id) {
  cli.usage(
    "Usage: ./delete-project.js <project-id> [--instance <name>]",
    "Example: ./delete-project.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: This permanently deletes the project.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/project/${id}`);
  console.log(`\nProject ${id} deleted successfully.`);
});

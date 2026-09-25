#!/usr/bin/env node
/**
 * Delete a project by slug or UUID.
 * Usage: ./delete-project.js <project> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the project.
 * This also deletes all associated data.
 */
const cli = require("../lib/cli");

const [projectArg] = cli.positionals(process.argv.slice(2));

if (!projectArg) {
  cli.usage(
    "Usage: ./delete-project.js <project> [--instance <name>]",
    "Example: ./delete-project.js acme-portal",
    "Example: ./delete-project.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: This permanently deletes the project.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectArg); // REQ 8.4
  await client.delete(`/api/v1/project/${project.id}`);
  console.log(
    `\nProject ${project.name} (${project.slug}, ${project.id}) deleted successfully.`,
  );
});

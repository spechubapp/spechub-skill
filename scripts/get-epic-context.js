#!/usr/bin/env node
/**
 * Get the context (markdown) for an epic, identified by UUID.
 * Usage: ./get-epic-context.js <epic-uuid> [output-file] [--instance <name>]
 *
 * To find the epic UUID, run: ./scripts/list-epics.js <project-slug>
 */
const cli = require("../lib/cli");

const [epicId, outputFile] = cli.positionals(process.argv.slice(2));

if (!epicId) {
  cli.usage(
    "Usage: ./get-epic-context.js <epic-uuid> [output-file]",
    "Example: ./get-epic-context.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "To find epic UUIDs: ./scripts/list-epics.js <project-slug>",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  console.log(`\nFetching context for epic: ${epicId}\n`);
  await cli.printContext(
    client,
    "/api/v1/epic/context",
    { epicId },
    {
      title: "Epic Context",
      outputFile,
    },
  );
});

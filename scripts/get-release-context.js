#!/usr/bin/env node
/**
 * Get the context (markdown) for a release, identified by UUID.
 * Usage: ./get-release-context.js <release-uuid> [output-file] [--instance <name>]
 *
 * To find the release UUID, run: ./scripts/list-releases.js <project-slug>
 */
const cli = require("../lib/cli");

const [releaseId, outputFile] = cli.positionals(process.argv.slice(2));

if (!releaseId) {
  cli.usage(
    "Usage: ./get-release-context.js <release-uuid> [output-file]",
    "Example: ./get-release-context.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "To find release UUIDs: ./scripts/list-releases.js <project-slug>",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  console.log(`\nFetching context for release: ${releaseId}\n`);
  await cli.printContext(
    client,
    "/api/v1/release/context",
    { releaseId },
    {
      title: "Release Context",
      outputFile,
    },
  );
});

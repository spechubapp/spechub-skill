#!/usr/bin/env node
/**
 * List features associated with an epic.
 * Usage: ./get-epic-features.js <epic-uuid> [--instance <name>]
 */
const cli = require("../lib/cli");

const [epicId] = cli.positionals(process.argv.slice(2));

if (!epicId)
  cli.usage(
    "Usage: ./get-epic-features.js <epic-uuid>",
    "Example: ./get-epic-features.js 123e4567-e89b-12d3-a456-426614174000",
  );

cli.run(async () => {
  const client = await cli.createClient();
  const features = await cli.fetchAll(client, `/api/v1/epic/${epicId}/feature`);

  if (features.length === 0)
    return console.log("No features found for this epic.");

  console.log(`\n=== Features for epic ${epicId} ===\n`);
  features.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name}`);
    console.log(`   ID:   ${f.id}`);
    console.log(`   Ref:  ${f.ref}`);
    if (f.description) console.log(`   Description: ${f.description}`);
    console.log();
  });

  console.log(`Total: ${features.length} feature(s)`);
});

#!/usr/bin/env node
/**
 * Update an external reference (PATCH — only provided fields are changed).
 * GitHub-enriched and Replacement references cannot be edited. REQ 17.2
 * Usage: ./update-reference.js <reference-uuid> [--name] [--url] [--type] [--notes] [--instance <name>]
 *
 * --type: Documentation | Test | Implementation | Other
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [referenceId] = cli.positionals(args);

if (!referenceId) {
  cli.usage(
    "Usage: ./update-reference.js <reference-uuid> [--name <text>] [--url <url>] [--type <type>] [--notes <text>]",
    'Example: ./update-reference.js 123e4567-e89b-12d3-a456-426614174000 --name "Design notes"',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const body = cli.buildBody(flags, {
    name: "name",
    url: "url",
    type: "type",
    notes: "notes",
  });

  if (Object.keys(body).length === 0)
    cli.abort(
      "provide at least one field to update (--name, --url, --type, --notes)",
    );

  const client = await cli.createClient();
  const res = await client.patch(`/api/v1/reference/${referenceId}`, body);

  console.log(`\nExternal reference updated successfully!\n`);
  cli.printReference(res.data.data);
});

#!/usr/bin/env node
/**
 * Update an existing release (PATCH — only provided fields are changed).
 * Usage: ./update-release.js <release-uuid> [--name "..."] [--description "..."] [--slug "..."] [--shipped true|false] [--shipped-date YYYY-MM-DD|none] [--instance <name>]
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [releaseId] = cli.positionals(args);

if (!releaseId) {
  cli.usage(
    'Usage: ./update-release.js <release-uuid> [--name "..."] [--description "..."] [--slug "..."] [--shipped true|false] [--shipped-date YYYY-MM-DD|none]',
    "Example: ./update-release.js 123e4567-e89b-12d3-a456-426614174000 --shipped true",
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const body = cli.buildBody(flags, {
    name: "name",
    description: "description",
    slug: "slug",
    shipped: { key: "shipped", transform: cli.bool },
    "shipped-date": { key: "shippedDate", transform: cli.shippedDate }, // REQ 9.6
  });

  if (Object.keys(body).length === 0)
    cli.abort(
      "provide at least one field to update (--name, --description, --slug, --shipped, --shipped-date)",
    );

  const client = await cli.createClient();
  const res = await client.patch(`/api/v1/release/${releaseId}`, body);
  const release = res.data.data;

  console.log(`\nRelease updated successfully!\n`);
  console.log(`  Name:    ${release.name}`);
  console.log(`  ID:      ${release.id}`);
  console.log(
    `  Shipped: ${release.shipped ? (release.shippedDate ?? "yes, no date") : "no"}`,
  );
  if (release.description) console.log(`  Description: ${release.description}`);
  cli.printWebUrl(release);
});

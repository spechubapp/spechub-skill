#!/usr/bin/env node
/**
 * Update an existing feature (PATCH — only provided fields are changed).
 * Usage: ./update-feature.js <feature-uuid> [--name "..."] [--description "..."] [--notes "..."] [--source "..."] [--instance <name>]
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [featureId] = cli.positionals(args);

if (!featureId) {
  cli.usage(
    'Usage: ./update-feature.js <feature-uuid> [--name "..."] [--description "..."] [--notes "..."] [--source "..."]',
    'Example: ./update-feature.js 123e4567-e89b-12d3-a456-426614174000 --name "New name"',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const body = cli.buildBody(flags, {
    name: "name",
    description: "description",
    notes: "notes",
    source: "source",
  });

  if (Object.keys(body).length === 0)
    cli.abort(
      "provide at least one field to update (--name, --description, --notes, --source)",
    );

  const client = await cli.createClient();
  const res = await client.patch(`/api/v1/feature/${featureId}`, body);
  const feature = res.data.data;

  console.log(`\nFeature updated successfully!\n`);
  console.log(`  Name: ${feature.name}`);
  console.log(`  ID:   ${feature.id}`);
  if (feature.description) console.log(`  Description: ${feature.description}`);
});

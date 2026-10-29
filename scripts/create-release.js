#!/usr/bin/env node
/**
 * Create a new release in a project.
 * Usage: ./create-release.js <project-slug> <name> [description] [--shipped true|false] [--shipped-date YYYY-MM-DD] [--instance <name>]
 *
 * A shipped release without --shipped-date gets today's date. REQ 9.6
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
// Positionals end at the first flag, so flag values are not read as a description.
const firstFlag = args.findIndex((a) => a.startsWith("--"));
const [slug, name, description] = cli.positionals(
  firstFlag < 0 ? args : args.slice(0, firstFlag),
);

if (!slug || !name) {
  cli.usage(
    "Usage: ./create-release.js <project-slug> <name> [description] [--shipped true|false] [--shipped-date YYYY-MM-DD] [--instance <name>]",
    'Example: ./create-release.js spechub "v1.0" "Initial public release"',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args);
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  const body = {
    projectId: project.id,
    name,
    ...cli.buildBody(flags, {
      shipped: { key: "shipped", transform: cli.bool },
      "shipped-date": { key: "shippedDate", transform: cli.shippedDate },
    }),
  };
  if (description) body.description = description;

  const res = await client.post("/api/v1/release", body);
  const created = res.data.data;

  console.log("\nRelease created successfully!\n");
  console.log(`  Name: ${created.name}`);
  console.log(`  ID:   ${created.id}`);
  if (created.shipped)
    console.log(`  Shipped: ${created.shippedDate ?? "yes, no date"}`);
  if (created.description) console.log(`  Description: ${created.description}`);
  cli.printWebUrl(created);
});

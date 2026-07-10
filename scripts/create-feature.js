#!/usr/bin/env node
/**
 * Create a new feature in a project.
 * Usage: ./create-feature.js <project-slug> <name> [description] [--instance <name>]
 */
const cli = require("../lib/cli");

const [slug, name, description] = cli.positionals(process.argv.slice(2));

if (!slug || !name) {
  cli.usage(
    "Usage: ./create-feature.js <project-slug> <name> [description] [--instance <name>]",
    'Example: ./create-feature.js spechub "User authentication" "Login and registration flows"',
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  const body = { projectId: project.id, name };
  if (description) body.description = description;

  const res = await client.post("/api/v1/feature", body);
  const created = res.data.data;

  console.log("\nFeature created successfully!\n");
  console.log(`  Name: ${created.name}`);
  console.log(`  ID:   ${created.id}`);
  if (created.description) console.log(`  Description: ${created.description}`);
});

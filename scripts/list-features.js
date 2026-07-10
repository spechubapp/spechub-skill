#!/usr/bin/env node
/**
 * List all features for a project.
 * Usage: ./list-features.js <project-slug> [--instance <name>]
 */
const cli = require("../lib/cli");

const [slug] = cli.positionals(process.argv.slice(2));

if (!slug)
  cli.usage(
    "Usage: ./list-features.js <project-slug> [--instance <name>]",
    "Example: ./list-features.js my-project",
  );

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const features = await cli.fetchAll(client, "/api/v1/feature", {
    projectId: project.id,
  });

  console.log(`\nFeatures for: ${project.name}\n`);
  if (features.length === 0) return console.log("No features found.");

  features.forEach((f, i) => {
    console.log(`${i + 1}. ${f.name}`);
    console.log(`   ID: ${f.id}`);
    if (f.description) {
      const desc = f.description.substring(0, 100);
      console.log(`   ${desc}${f.description.length > 100 ? "..." : ""}`);
    }
    console.log("");
  });

  console.log(`Total: ${features.length} feature(s)\n`);
  console.log(
    "Use ./scripts/get-feature-context.js <feature-id> to view full context\n",
  );
});

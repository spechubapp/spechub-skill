#!/usr/bin/env node
/**
 * List releases for a project.
 * Usage: ./list-releases.js <project-slug> [--instance <name>]
 */
const cli = require("../lib/cli");

const [slug] = cli.positionals(process.argv.slice(2));

if (!slug)
  cli.usage("Usage: ./list-releases.js <project-slug> [--instance <name>]");

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const releases = await cli.fetchAll(client, "/api/v1/release", {
    projectId: project.id,
  });

  if (releases.length === 0) return console.log("No releases found.");

  console.log(`\n=== Releases for project: ${project.name} ===\n`);
  releases.forEach((r, i) => {
    console.log(
      `${i + 1}. ${r.name}${r.shipped ? " ✓ shipped" : " (unshipped)"}`,
    );
    console.log(`   ID: ${r.id}`);
    if (r.description) console.log(`   ${r.description}`);
    console.log();
  });

  console.log(`Total: ${releases.length} release(s)`);
});

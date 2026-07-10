#!/usr/bin/env node
/**
 * List all projects accessible with the configured PAT.
 * Usage: ./list-projects.js [--instance <name>]
 */
const cli = require("../lib/cli");

cli.run(async () => {
  const client = await cli.createClient();
  const projects = await cli.fetchAll(client, "/api/v1/project");

  if (projects.length === 0) return console.log("No projects found.");

  console.log(`\nFound ${projects.length} project(s):\n`);
  projects.forEach((p, i) => {
    console.log(`${i + 1}. ${p.name} (${p.slug})`);
    console.log(`   ID: ${p.id}`);
    if (p.updatedAt)
      console.log(`   Updated: ${new Date(p.updatedAt).toLocaleDateString()}`);
    console.log("");
  });

  console.log(
    "Use ./scripts/get-project-context.js <project-slug> to view full context\n",
  );
});

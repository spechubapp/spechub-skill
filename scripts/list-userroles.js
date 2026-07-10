#!/usr/bin/env node
/**
 * List user roles for a project.
 * Usage: ./list-userroles.js <project-slug> [--instance <name>]
 */
const cli = require("../lib/cli");

const [slug] = cli.positionals(process.argv.slice(2));

if (!slug)
  cli.usage("Usage: ./list-userroles.js <project-slug> [--instance <name>]");

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const roles = await cli.fetchAll(client, "/api/v1/userrole", {
    projectId: project.id,
  });

  if (roles.length === 0) return console.log("No user roles found.");

  console.log(`\n=== User Roles for project: ${project.name} ===\n`);
  roles.forEach((r, i) => {
    console.log(`${i + 1}. ${r.name}`);
    console.log(`   ID: ${r.id}`);
    if (r.description) console.log(`   ${r.description}`);
    console.log();
  });

  console.log(`Total: ${roles.length} user role(s)`);
});

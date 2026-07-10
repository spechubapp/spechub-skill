#!/usr/bin/env node
/**
 * Analyze a project: fetch context + summary stats.
 * Usage: ./analyze-project.js <project-slug> [--instance <name>]
 */
const cli = require("../lib/cli");

const [slug] = cli.positionals(process.argv.slice(2));

if (!slug)
  cli.usage(
    "Usage: ./analyze-project.js <project-slug>",
    "Example: ./analyze-project.js my-project",
  );

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  console.log(`\n=== Project Analysis: ${project.name} ===\n`);
  console.log(`ID:      ${project.id}`);
  console.log(`Slug:    ${project.slug}`);
  if (project.updatedAt)
    console.log(`Updated: ${new Date(project.updatedAt).toLocaleString()}`);
  console.log();

  const params = { projectId: project.id };
  const [features, epics, releases, requirements, userRoles] =
    await Promise.all([
      cli.fetchAll(client, "/api/v1/feature", params),
      cli.fetchAll(client, "/api/v1/epic", params),
      cli.fetchAll(client, "/api/v1/release", params),
      cli.fetchAll(client, "/api/v1/requirement", params),
      cli.fetchAll(client, "/api/v1/userrole", params),
    ]);

  console.log("--- Summary ---");
  console.log(`Features:     ${features.length}`);
  console.log(`Epics:        ${epics.length}`);
  console.log(`Releases:     ${releases.length}`);
  console.log(`Requirements: ${requirements.length}`);
  console.log(`User Roles:   ${userRoles.length}`);

  console.log();
  await cli.printContext(
    client,
    "/api/v1/project/context",
    { projectId: project.id },
    {
      title: "Project Context",
    },
  );
});

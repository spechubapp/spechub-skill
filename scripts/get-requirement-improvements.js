#!/usr/bin/env node
/**
 * Get AI-suggested improved requirement descriptions.
 * Usage: ./get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...] [--instance <name>]
 */
const cli = require("../lib/cli");

const [slug, ...requirementIds] = cli.positionals(process.argv.slice(2));

if (!slug || requirementIds.length === 0) {
  cli.usage(
    "Usage: ./get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...]",
    "Example: ./get-requirement-improvements.js spechub abc-123 def-456",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  // requirementIds uses style=form, explode=false: pass as a single
  // comma-separated param (?requirementIds=uuid1,uuid2), not repeated params.
  const res = await client.get("/api/v1/requirement/improve", {
    params: { projectId: project.id, requirementIds: requirementIds.join(",") },
  });

  const improvements = res.data.requirementImprovements;
  const keys = Object.keys(improvements);

  if (keys.length === 0) return console.log("No improvements returned.");

  console.log(`\n=== Requirement Improvements ===\n`);
  keys.forEach((id) => {
    console.log(`Requirement ID: ${id}`);
    console.log(`Suggested text: ${improvements[id]}`);
    console.log();
  });
});

#!/usr/bin/env node
/**
 * Show drafted requirement descriptions and their AI-standardized rewrites
 * side by side. Standardization applies SpecHub's formulation types and the
 * project's roles, entities, and fields, and changes no SpecHub data. REQ 14.11
 * Usage: ./standardize-requirements.js <project-slug> <description> [<description> ...] [--instance <name>]
 *
 * Example:
 *   ./standardize-requirements.js spechub "usernames can only have letters and numbers"
 */
const cli = require("../lib/cli");

const MAX_DESCRIPTIONS = 20; // REQ 14.12

const [slug, ...descriptions] = cli.positionals(process.argv.slice(2));
if (!slug || descriptions.length === 0) {
  cli.usage(
    "Usage: ./standardize-requirements.js <project-slug> <description> [<description> ...]",
  );
}
if (descriptions.length > MAX_DESCRIPTIONS) {
  cli.abort(`at most ${MAX_DESCRIPTIONS} descriptions per request`);
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const res = await client.post(
    `/api/v1/project/${project.id}/requirements/standardize`,
    { requirements: descriptions },
  );

  console.log(`\n=== Standardized Requirements — ${project.name} ===\n`);
  // Results keep the input order, one per submitted description.
  res.data.requirements.forEach((item, i) => {
    console.log(`Draft ${i + 1}`);
    cli.printComparison(
      "Draft",
      item.original,
      "Standardized",
      item.standardized,
    );
    console.log();
  });
});

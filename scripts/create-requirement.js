#!/usr/bin/env node
/**
 * Create a new requirement in a project.
 * Usage: ./create-requirement.js <project-slug> <feature-uuid> <description> [options] [--instance <name>]
 *
 * Options:
 *   --type Functional|Design|Performance
 *   --status Untested|Passing|Failing
 *   --release <release-uuid>
 *   --secondary-feature <feature-uuid>
 *   --source <text>
 *   --notes <text>
 *   --business-critical true|false
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [slug, featureId, description] = cli.positionals(args);

if (!slug || !featureId || !description) {
  cli.usage(
    "Usage: ./create-requirement.js <project-slug> <feature-uuid> <description> [options]",
    "Options: --type, --status, --release <uuid>, --secondary-feature <uuid>, --source, --notes, --business-critical true|false",
    'Example: ./create-requirement.js spechub abc-123 "The system shall allow users to log in" --status Untested',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 3);
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  const body = cli.buildBody(flags, {
    type: "requirementType",
    status: "status",
    release: "releaseId",
    "secondary-feature": "secondaryFeatureId",
    source: "source",
    notes: "notes",
    "business-critical": { key: "businessCritical", transform: cli.bool },
  });
  Object.assign(body, { projectId: project.id, featureId, description });

  const res = await client.post("/api/v1/requirement", body);
  const req = res.data.data;

  console.log(`\nRequirement created successfully!\n`);
  console.log(`  Ref:  ${req.fullyQualifiedRef}`);
  console.log(`  Type: ${req.requirementType}`);
  console.log(`  Description: ${req.description}`);
  console.log(`  ID:   ${req.id}`);
  if (req.webUrl) console.log(`  URL:  ${req.webUrl}`);
});

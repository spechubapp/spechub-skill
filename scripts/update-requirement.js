#!/usr/bin/env node
/**
 * Update an existing requirement (PATCH — only provided fields are changed).
 * Usage: ./update-requirement.js <project-slug> <requirement-ref-or-uuid> [options] [--instance <name>]
 *
 * Options:
 *   --description <text>
 *   --type Functional|Design|Performance
 *   --status Untested|Passing|Failing
 *   --feature <feature-uuid>
 *   --release <release-uuid>
 *   --secondary-feature <feature-uuid>
 *   --source <text>
 *   --notes <text>
 *   --acceptance-criteria <text>
 *   --business-critical true|false
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [projectSlug, refOrId] = cli.positionals(args);

if (!projectSlug || !refOrId) {
  cli.usage(
    "Usage: ./update-requirement.js <project-slug> <requirement-ref-or-uuid> [options]",
    "Options: --description, --type, --status, --feature <uuid>, --release <uuid>,",
    "         --secondary-feature <uuid>, --source, --notes, --acceptance-criteria, --business-critical true|false",
    "Example: ./update-requirement.js spechub 1.23 --status Passing",
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 2);
  const body = cli.buildBody(flags, {
    description: "description",
    type: "requirementType",
    status: "status",
    feature: "featureId",
    release: "releaseId",
    "secondary-feature": "secondaryFeatureId",
    source: "source",
    notes: "notes",
    "acceptance-criteria": "acceptanceCriteria",
    "business-critical": { key: "businessCritical", transform: cli.bool },
  });

  if (Object.keys(body).length === 0)
    cli.abort("provide at least one field to update");

  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const { resolveRequirement } = require("../lib/api-client");
  const requirement = await resolveRequirement(client, project.id, refOrId);

  const res = await client.patch(`/api/v1/requirement/${requirement.id}`, body);
  const req = res.data.data;

  console.log(`\nRequirement updated successfully!\n`);
  console.log(`  Ref:    ${req.fullyQualifiedRef}`);
  console.log(`  Status: ${req.status}`);
  console.log(`  Description: ${req.description}`);
  console.log(`  ID:     ${req.id}`);
});

#!/usr/bin/env node
/**
 * Update an existing entity (PATCH — only provided fields are changed).
 * Usage: ./update-entity.js <project-slug> <entity-ref-or-uuid> [options] [--instance <name>]
 *
 * Options:
 *   --entity-name <text>
 *   --feature <feature-uuid>
 *   --release <release-uuid>
 *   --secondary-feature <feature-uuid>
 *   --status Untested|Passing|Failing|Deprecated
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
    "Usage: ./update-entity.js <project-slug> <entity-ref-or-uuid> [options]",
    "Options: --entity-name, --feature <uuid>, --release <uuid>, --secondary-feature <uuid>,",
    "         --status, --source, --notes, --acceptance-criteria, --business-critical true|false",
    'Example: ./update-entity.js spechub 1.1 --entity-name "Customer"',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 2);
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const entity = await cli.resolveEntity(client, project.id, refOrId);

  const body = cli.buildBody(flags, {
    "entity-name": "entityName",
    feature: "featureId",
    release: "releaseId",
    "secondary-feature": "secondaryFeatureId",
    status: "status",
    source: "source",
    notes: "notes",
    "acceptance-criteria": "acceptanceCriteria",
    "business-critical": { key: "businessCritical", transform: cli.bool },
  });

  if (Object.keys(body).length === 0)
    cli.abort("provide at least one field to update");

  const res = await client.patch(`/api/v1/entity/${entity.id}`, body);
  const updated = res.data.data;

  console.log(`\nEntity updated successfully!\n`);
  console.log(`  Ref:         ${updated.fullyQualifiedRef}`);
  console.log(`  Entity name: ${updated.entityName}`);
  if (updated.status) console.log(`  Status:      ${updated.status}`);
  console.log(`  ID:          ${updated.id}`);
  cli.printWebUrl(updated);
});

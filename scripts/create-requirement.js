#!/usr/bin/env node
/**
 * Create a new requirement in a project.
 * Usage: ./create-requirement.js <project-slug> <feature-uuid> <description> [options] [--instance <name>]
 *
 * Options:
 *   --type Functional|Design|Performance
 *   --formulation simple|user-role-capability|event-triggered|constraint|state-based
 *   --status Untested|Passing|Failing|Deprecated
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
    "Options: --formulation <type>, --type, --status, --release <uuid>, --secondary-feature <uuid>, --source, --notes, --business-critical true|false",
    'Example: ./create-requirement.js spechub abc-123 "The application displays a login form." --formulation simple --status Untested',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 3);
  cli.validateRequirementFormulation(description, flags.formulation);
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

  // Handle description length limit (300 chars)
  const { description: truncatedDesc, notes: combinedNotes } =
    cli.splitDescription(description, body.notes);

  Object.assign(body, {
    projectId: project.id,
    featureId,
    description: truncatedDesc,
    notes: combinedNotes,
  });

  const res = await client.post("/api/v1/requirement", body);
  // The create response reports feature ref 0; re-read for the stored ref.
  const req = (await client.get(`/api/v1/requirement/${res.data.data.id}`)).data
    .data;

  console.log(`\nRequirement created successfully!\n`);
  console.log(`  Ref:  ${req.fullyQualifiedRef}`);
  console.log(`  Type: ${req.requirementType}`);
  console.log(`  Description: ${req.description}`);
  if (req.notes)
    console.log(
      `  Notes: ${req.notes.slice(0, 100)}${req.notes.length > 100 ? "..." : ""}`,
    );
  console.log(`  ID:   ${req.id}`);
  cli.printWebUrl(req);
});

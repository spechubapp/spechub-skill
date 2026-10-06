#!/usr/bin/env node
/**
 * Update an existing requirement (PATCH — only provided fields are changed).
 * Usage: ./update-requirement.js <project-slug> <requirement-ref-or-uuid> [options] [--instance <name>]
 *
 * Options:
 *   --description <text>
 *   --formulation simple|user-role-capability|event-triggered|constraint|state-based (required with --description)
 *   --type Functional|Design|Performance
 *   --status Untested|Passing|Failing|Deprecated
 *   --feature <feature-uuid>
 *   --release <release-uuid>
 *   --secondary-feature <feature-uuid>
 *   --source <text>
 *   --notes <text>
 *   --acceptance-criteria <text>
 *   --business-critical true|false
 *   --test-coverage "No automated test"|"Has automated test"|"Needs automated test"
 *   --replacement <ref-or-uuid>|none   (requirement replacing this Deprecated one)
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [projectSlug, refOrId] = cli.positionals(args);

if (!projectSlug || !refOrId) {
  cli.usage(
    "Usage: ./update-requirement.js <project-slug> <requirement-ref-or-uuid> [options]",
    "Options: --description, --formulation <type>, --type, --status, --feature <uuid>, --release <uuid>,",
    "         --secondary-feature <uuid>, --source, --notes, --acceptance-criteria, --business-critical true|false,",
    "         --test-coverage <type>, --replacement <ref-or-uuid>|none",
    "Example: ./update-requirement.js spechub 1.23 --status Passing",
    "Example: ./update-requirement.js spechub 1.23 --status Deprecated --replacement 1.31",
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 2);
  if (flags.description !== undefined) {
    cli.validateRequirementFormulation(flags.description, flags.formulation);
  } else if (flags.formulation !== undefined) {
    cli.abort("--formulation requires --description");
  }
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
    "test-coverage": "automatedTestCoverageType", // REQ 10.8
  });

  if (Object.keys(body).length === 0 && flags.replacement === undefined)
    cli.abort("provide at least one field to update");
  if (flags.replacement === true)
    cli.abort("--replacement needs a requirement ref or UUID, or none");

  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const requirement = await cli.resolveRequirement(
    client,
    project.id,
    refOrId,
    {
      detail: true,
    },
  );

  // "none" removes the replacement; a ref or UUID sets it. REQ 10.9
  if (flags.replacement === "none") {
    body.replacementRequirementId = null;
  } else if (flags.replacement !== undefined) {
    const replacement = await cli.resolveRequirement(
      client,
      project.id,
      flags.replacement,
    );
    body.replacementRequirementId = replacement.id;
  }

  // Status, test coverage, and replacement changes never alter the content.
  // REQ 10.7
  const inPlaceKeys = [
    "status",
    "automatedTestCoverageType",
    "replacementRequirementId",
  ];
  if (Object.keys(body).some((key) => !inPlaceKeys.includes(key))) {
    await cli.abortIfShipped(
      client,
      requirement,
      "create a replacement requirement in the intended release, then deprecate this one.",
    );
  }

  // Handle description length limit (300 chars) if description is being updated
  if (body.description) {
    // Get existing notes from the requirement or from the update body
    const existingNotes = body.notes || requirement.notes || "";
    const { description: truncatedDesc, notes: combinedNotes } =
      cli.splitDescription(body.description, existingNotes);
    body.description = truncatedDesc;
    body.notes = combinedNotes;
  }

  const res = await client.patch(`/api/v1/requirement/${requirement.id}`, body);
  const req = res.data.data;

  console.log(`\nRequirement updated successfully!\n`);
  console.log(`  Ref:    ${req.fullyQualifiedRef}`);
  console.log(`  Status: ${req.status}`);
  console.log(`  Test coverage: ${req.automatedTestCoverageType}`);
  console.log(`  Description: ${req.description}`);
  if (req.replacement)
    console.log(
      `  Replaced by: ${req.replacement.name} (${req.replacement.url})`,
    );
  if (req.notes)
    console.log(
      `  Notes: ${req.notes.slice(0, 100)}${req.notes.length > 100 ? "..." : ""}`,
    );
  console.log(`  ID:     ${req.id}`);
  cli.printWebUrl(req);
});

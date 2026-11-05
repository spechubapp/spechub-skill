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
 *   --acceptance-criteria <markdown>
 *   --business-critical true|false
 *   --test-coverage "No automated test"|"Has automated test"|"Needs automated test"
 *   --replacement <ref-or-uuid>|none   (requirement replacing this Deprecated one)
 *   --comment <markdown> | --comment-file <file.md>
 *       After the update succeeds, add this comment as a reply to the journal
 *       entry recording it, e.g. the evidence for a status change. Skipped
 *       when the update records no entry. REQ 19.5, REQ 19.6
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [projectSlug, refOrId] = cli.positionals(args);

if (!projectSlug || !refOrId) {
  cli.usage(
    "Usage: ./update-requirement.js <project-slug> <requirement-ref-or-uuid> [options]",
    "Options: --description, --formulation <type>, --type, --status, --feature <uuid>, --release <uuid>,",
    "         --secondary-feature <uuid>, --source, --notes, --acceptance-criteria, --business-critical true|false,",
    "         --test-coverage <type>, --replacement <ref-or-uuid>|none, --comment <markdown> | --comment-file <file.md>",
    "Example: ./update-requirement.js spechub 1.23 --status Passing",
    'Example: ./update-requirement.js spechub 1.23 --status Passing --comment "Tests in `auth.test.js` pass."',
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
  if (flags.comment !== undefined && flags["comment-file"] !== undefined)
    cli.abort("give --comment or --comment-file, not both");
  if (flags.comment === true || flags["comment-file"] === true)
    cli.abort("--comment needs text and --comment-file needs a path");
  // Read the comment before the update, so a bad file fails without a write.
  const commentBody =
    flags.comment !== undefined || flags["comment-file"] !== undefined
      ? cli.readCommentBody(flags.comment, flags["comment-file"])
      : null;
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

  // Status, test coverage, replacement, and acceptance criteria changes do
  // not alter the requirement itself. REQ 10.10
  const inPlaceKeys = [
    "status",
    "automatedTestCoverageType",
    "replacementRequirementId",
    "acceptanceCriteria",
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
  const { journalEntryId } = res.data;

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
  // REQ 19.4
  if (journalEntryId) console.log(`  Journal entry: ${journalEntryId}`);
  cli.printWebUrl(req);

  if (commentBody === null) return;
  // SpecHub records no entry when nothing changed or only the replacement
  // did, and a reply needs one. REQ 19.6
  if (!journalEntryId) {
    console.log(
      "\nComment skipped: the update recorded no journal entry to reply to.",
    );
    return;
  }
  // REQ 19.5
  try {
    const comment = await cli.addComment(
      client,
      req.id,
      commentBody,
      journalEntryId,
    );
    console.log(
      `\nComment added as a reply to journal entry ${journalEntryId}\n`,
    );
    cli.printComment(comment);
  } catch (err) {
    cli.abort(
      `the requirement was updated, but the comment failed: ${err.response?.data?.detail || err.message}. ` +
        `Retry with ./create-comment.js <project> ${req.fullyQualifiedRef} <body> --journal-entry ${journalEntryId}`,
    );
  }
});

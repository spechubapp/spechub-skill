#!/usr/bin/env node
/**
 * Get details of a requirement by ref (e.g. "1.23") or UUID.
 * Usage: ./get-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]
 *
 * Examples:
 *   ./get-requirement.js spechub 133.8
 *   ./get-requirement.js spechub 1.23 --instance staging
 *   ./get-requirement.js spechub 550e8400-e29b-41d4-a716-446655440000
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [projectSlug, refOrId] = cli.positionals(args);

if (!projectSlug || !refOrId) {
  cli.usage(
    "Usage: ./get-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]",
    "",
    "Examples:",
    "  ./get-requirement.js spechub 133.8",
    "  ./get-requirement.js spechub 1.23 --instance staging",
  );
}

cli.run(async () => {
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

  console.log(`\n=== Requirement ${requirement.fullyQualifiedRef} ===\n`);
  console.log(`ID:          ${requirement.id}`);
  console.log(`Description: ${requirement.description}`);
  console.log(`Type:        ${requirement.requirementType}`);
  console.log(`Status:      ${requirement.status}`);
  console.log(`Feature:     ${requirement.featureId}`);

  if (requirement.releaseId) {
    console.log(`Release:     ${requirement.releaseId}`);
  }

  if (requirement.secondaryFeatureId) {
    console.log(`Secondary Feature: ${requirement.secondaryFeatureId}`);
  }

  if (requirement.source) {
    console.log(`Source:      ${requirement.source}`);
  }

  if (requirement.notes) {
    console.log(`\nNotes:\n${requirement.notes}`);
  }

  if (
    requirement.acceptanceCriteria &&
    requirement.acceptanceCriteria.length > 0
  ) {
    console.log(`\nAcceptance Criteria:`);
    requirement.acceptanceCriteria.forEach((criterion, idx) => {
      console.log(`  ${idx + 1}. ${criterion}`);
    });
  }

  console.log(`\nBusiness Critical: ${requirement.businessCritical}`);
  console.log(`Test Coverage:     ${requirement.automatedTestCoverageType}`);
  console.log(`Created:           ${requirement.created}`);
  console.log(`Updated:           ${requirement.updated}`);
  cli.printWebUrl(requirement, "");
  console.log();
});

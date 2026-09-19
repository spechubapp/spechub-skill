#!/usr/bin/env node
/**
 * Get details of an entity by ref (e.g. "1.1") or UUID.
 * Usage: ./get-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]
 *
 * Examples:
 *   ./get-entity.js spechub 1.1
 *   ./get-entity.js spechub 2.5 --instance staging
 *   ./get-entity.js spechub 550e8400-e29b-41d4-a716-446655440000
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [projectSlug, refOrId] = cli.positionals(args);

if (!projectSlug || !refOrId) {
  cli.usage(
    "Usage: ./get-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]",
    "",
    "Examples:",
    "  ./get-entity.js spechub 1.1",
    "  ./get-entity.js spechub 2.5 --instance staging",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const { resolveEntity } = require("../lib/api-client");

  // Resolve ref to the entity's UUID. The list endpoint used by resolveEntity
  // omits fields and notes, so re-fetch the entity by ID for the full record.
  const listed = await resolveEntity(client, project.id, refOrId);
  const res = await client.get(`/api/v1/entity/${listed.id}`);
  const entity = { ...listed, ...res.data.data };

  console.log(`\n=== Entity ${entity.fullyQualifiedRef} ===\n`);
  console.log(`ID:          ${entity.id}`);
  console.log(`Name:        ${entity.entityName}`);
  console.log(`Status:      ${entity.status}`);
  console.log(`Feature:     ${entity.featureId}`);

  if (entity.releaseId) {
    console.log(`Release:     ${entity.releaseId}`);
  }

  if (entity.secondaryFeatureId) {
    console.log(`Secondary Feature: ${entity.secondaryFeatureId}`);
  }

  if (entity.source) {
    console.log(`Source:      ${entity.source}`);
  }

  if (entity.notes) {
    console.log(`\nNotes:\n${entity.notes}`);
  }

  if (entity.acceptanceCriteria && entity.acceptanceCriteria.length > 0) {
    console.log(`\nAcceptance Criteria:`);
    entity.acceptanceCriteria.forEach((criterion, idx) => {
      console.log(`  ${idx + 1}. ${criterion}`);
    });
  }

  if (entity.fields && entity.fields.length > 0) {
    console.log(`\nFields (${entity.fields.length}):`);
    entity.fields.forEach((field) => {
      const required = field.required ? " [required]" : "";
      console.log(`  • ${field.name}: ${field.type}${required}`);
      if (field.sampleValue) {
        console.log(`    Sample: ${field.sampleValue}`);
      }
      if (field.notes) {
        console.log(`    Notes: ${field.notes}`);
      }
    });
  }

  console.log(`\nBusiness Critical: ${entity.businessCritical}`);
  console.log(`Test Coverage:     ${entity.automatedTestCoverageType}`);
  console.log(`Created:           ${entity.created}`);
  console.log(`Updated:           ${entity.updated}`);
  console.log(`Web URL:           ${entity.webUrl}`);
  console.log();
});

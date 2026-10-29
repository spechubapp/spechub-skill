#!/usr/bin/env node
/**
 * Get details of an entity by ref (e.g. "1.1") or UUID, including each
 * field's UUID, options, default, and validations. REQ 11.8
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
  const entity = await cli.resolveEntity(client, project.id, refOrId, {
    detail: true,
  });

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

  if (entity.acceptanceCriteria) {
    console.log(`\nAcceptance Criteria:\n${entity.acceptanceCriteria}`);
  }

  if (entity.fields && entity.fields.length > 0) {
    // Name referenced entities; keep the UUID, which field updates resend.
    const referenced = {};
    if (entity.fields.some((f) => f.referencedEntityId)) {
      const all = await cli.fetchAll(client, "/api/v1/entity", {
        projectId: project.id,
        includeDeprecated: true,
      });
      for (const e of all)
        referenced[e.id] = `${e.entityName} (${e.fullyQualifiedRef}, ${e.id})`;
    }

    console.log(`\nFields (${entity.fields.length}):`);
    // Unset detail values are empty strings or arrays; print only set ones.
    const details = [
      ["references", "referencedEntityId"],
      ["options", "options"],
      ["default", "defaultValue"],
      ["validations", "validations"],
      ["group", "uiFieldGrouping"],
      ["help", "helpText"],
      ["sample", "sampleValue"],
      ["notes", "notes"],
    ];
    entity.fields.forEach((field) => {
      const required = field.required ? " [required]" : "";
      console.log(`  • ${field.name}: ${field.type}${required}`);
      console.log(`      id: ${field.id}`);
      for (const [label, key] of details) {
        const value =
          key === "referencedEntityId"
            ? field[key] && (referenced[field[key]] ?? field[key])
            : field[key];
        if (Array.isArray(value) ? value.length : value)
          console.log(
            `      ${label}: ${Array.isArray(value) ? value.join(", ") : value}`,
          );
      }
    });
  }

  console.log();
  // Detail responses may omit businessCritical and, for entities, created.
  if (entity.businessCritical !== undefined) {
    console.log(`Business Critical: ${entity.businessCritical}`);
  }
  console.log(`Test Coverage:     ${entity.automatedTestCoverageType}`);
  if (entity.created) console.log(`Created:           ${entity.created}`);
  console.log(`Updated:           ${entity.updated}`);
  cli.printWebUrl(entity, "");
  console.log();
});

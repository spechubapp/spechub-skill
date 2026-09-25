#!/usr/bin/env node
/**
 * Delete a requirement by ref or UUID.
 * Usage: ./delete-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]
 *
 * ⚠️  WARNING: This permanently deletes the requirement.
 */
const cli = require("../lib/cli");
const { resolveRequirement } = require("../lib/api-client");

const [projectSlug, refOrId] = cli.positionals(process.argv.slice(2));

if (!projectSlug || !refOrId) {
  cli.usage(
    "Usage: ./delete-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]",
    "Example: ./delete-requirement.js spechub 1.23",
    "Example: ./delete-requirement.js spechub 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: This permanently deletes the requirement.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const resolved = await resolveRequirement(client, project.id, refOrId);
  const requirement = (await client.get(`/api/v1/requirement/${resolved.id}`)).data.data;
  if (requirement.releaseId) {
    const release = (await client.get(`/api/v1/release/${requirement.releaseId}`)).data.data;
    if (release.shipped) {
      cli.abort(`requirement ${requirement.fullyQualifiedRef} belongs to a shipped release; mark it Deprecated instead of deleting it.`);
    }
  }

  await client.delete(`/api/v1/requirement/${requirement.id}`);
  console.log(
    `\nRequirement ${requirement.fullyQualifiedRef} deleted successfully.`,
  );
  console.log(`  Description: ${requirement.description}`);
});

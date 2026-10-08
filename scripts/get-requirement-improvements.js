#!/usr/bin/env node
/**
 * Show stored and AI-suggested requirement descriptions side by side.
 * Usage: ./get-requirement-improvements.js <project-slug> <requirement-ref-or-uuid> [<requirement-ref-or-uuid> ...] --release-number <name-or-slug>
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const releaseIndex = args.indexOf("--release-number");
if (
  releaseIndex === -1 ||
  !args[releaseIndex + 1] ||
  args[releaseIndex + 1].startsWith("--")
) {
  cli.usage(
    "Ask the user for a release number, then pass --release-number <name-or-slug> (or none if explicitly unassigned).",
  );
}
const releaseNumber = args[releaseIndex + 1];
args.splice(releaseIndex, 2);
const [slug, ...requirementRefs] = args;
if (!slug || requirementRefs.length === 0) {
  cli.usage(
    "Usage: ./get-requirement-improvements.js <project-slug> <requirement-ref-or-uuid> [<requirement-ref-or-uuid> ...] --release-number <name-or-slug>",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const releases = await cli.fetchAll(client, "/api/v1/release", {
    projectId: project.id,
  });
  const release = releases.find(
    (r) => r.name === releaseNumber || r.slug === releaseNumber,
  );
  if (!release && releaseNumber.toLowerCase() !== "none") {
    cli.abort(
      `release number "${releaseNumber}" not found. Available: ${releases.map((r) => r.name).join(", ") || "none"}`,
    );
  }

  // Refs and UUIDs both resolve to requirement detail. REQ 8.5
  const stored = await Promise.all(
    requirementRefs.map((refOrId) =>
      cli.resolveRequirement(client, project.id, refOrId, { detail: true }),
    ),
  );
  const res = await client.get("/api/v1/requirement/improve", {
    params: {
      projectId: project.id,
      requirementIds: stored.map((r) => r.id).join(","),
    },
  });
  const improvements = res.data.requirementImprovements || {};

  console.log(
    `\n=== Requirement Improvements — release ${release?.name || "none"} ===\n`,
  );
  for (const requirement of stored) {
    console.log(
      `Requirement ${requirement.fullyQualifiedRef || requirement.id}`,
    );
    cli.printWebUrl(requirement, "");
    cli.printComparison(
      "Current",
      requirement.description,
      "Suggested",
      improvements[requirement.id] || "(no suggestion returned)",
    );
    console.log();
  }
});

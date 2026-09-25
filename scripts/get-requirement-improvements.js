#!/usr/bin/env node
/**
 * Show stored and AI-suggested requirement descriptions side by side.
 * Usage: ./get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...] --release-number <name-or-slug>
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
const [slug, ...requirementIds] = args;
if (
  !slug ||
  requirementIds.length === 0 ||
  requirementIds.some((id) => !cli.isUuid(id))
) {
  cli.usage(
    "Usage: ./get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...] --release-number <name-or-slug>",
  );
}

function wrap(value, width = 58) {
  const lines = [];
  for (const paragraph of String(value || "").split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/)) {
      if (line && line.length + word.length + 1 > width) {
        lines.push(line);
        line = "";
      }
      line += (line ? " " : "") + word;
    }
    lines.push(line);
  }
  return lines;
}

function printComparison(current, suggested) {
  const left = wrap(current);
  const right = wrap(suggested || "(no suggestion returned)");
  console.log(`${"Current".padEnd(60)} | Suggested`);
  console.log(`${"-".repeat(60)}-+-${"-".repeat(60)}`);
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    console.log(`${(left[i] || "").padEnd(60)} | ${right[i] || ""}`);
  }
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

  const [res, stored] = await Promise.all([
    client.get("/api/v1/requirement/improve", {
      params: {
        projectId: project.id,
        requirementIds: requirementIds.join(","),
      },
    }),
    Promise.all(
      requirementIds.map((id) =>
        client
          .get(`/api/v1/requirement/${id}`)
          .then((response) => response.data.data),
      ),
    ),
  ]);
  const improvements = res.data.requirementImprovements || {};

  console.log(
    `\n=== Requirement Improvements — release ${release?.name || "none"} ===\n`,
  );
  for (const requirement of stored) {
    console.log(
      `Requirement ${requirement.fullyQualifiedRef || requirement.id}`,
    );
    cli.printWebUrl(requirement, "");
    printComparison(requirement.description, improvements[requirement.id]);
    console.log();
  }
});

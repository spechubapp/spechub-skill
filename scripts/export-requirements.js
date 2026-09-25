#!/usr/bin/env node
/**
 * Export complete requirement detail as a Markdown checklist grouped by
 * feature, for reconciling requirements against an implementation. REQ 8.8
 * Usage: ./export-requirements.js <project-slug> [filters] [--output <file.md>] [--instance <name>]
 *
 * Filters (as list-requirements.js):
 *   --feature <uuid>            Filter by feature
 *   --epic <uuid>               Filter by epic
 *   --release <uuid>            Filter by release
 *   --secondary-feature <uuid>  Filter by secondary feature
 *   --refs <1.2,3.4>            Filter by fully qualified refs (integers only)
 *   --include-deprecated        Include deprecated requirements
 */
const fs = require("fs");
const cli = require("../lib/cli");

const DETAIL_CONCURRENCY = 8;

const args = process.argv.slice(2);
const [slug] = cli.positionals(args);

if (!slug) {
  cli.usage(
    "Usage: ./export-requirements.js <project-slug> [--feature <uuid>] [--epic <uuid>] [--release <uuid>] [--refs <1.2,3.4>] [--include-deprecated] [--output <file.md>]",
  );
}

/** Map items through an async function with at most `limit` in flight. */
async function mapLimit(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: limit }, worker));
  return results;
}

/** Numeric sort key for a "feature.requirement" ref. */
function refKey(ref) {
  return String(ref || "")
    .split(".")
    .map(Number);
}

function compareRefs(a, b) {
  const [a1, a2] = refKey(a.fullyQualifiedRef);
  const [b1, b2] = refKey(b.fullyQualifiedRef);
  return a1 - b1 || a2 - b2;
}

function link(text, url) {
  return url ? `[${text}](${url})` : text;
}

function renderRequirement(r, releases) {
  const release = releases.get(r.releaseId);
  const meta = [
    r.requirementType,
    `status ${r.status}`,
    release
      ? `release ${release.name}${release.shipped ? " (shipped)" : ""}`
      : "no release",
    `tests: ${r.automatedTestCoverageType || "unknown"}`,
  ];
  if (r.businessCritical) meta.push("business critical");

  const lines = [
    `### ${link(`REQ ${r.fullyQualifiedRef}`, r.webUrl)}`,
    "",
    `_${meta.join(" · ")}_`,
    "",
    r.description,
  ];
  if (r.notes) lines.push("", "Notes:", "", r.notes);
  if (r.acceptanceCriteria?.length) {
    lines.push("", "Acceptance criteria:", "");
    r.acceptanceCriteria.forEach((c, i) => lines.push(`${i + 1}. ${c}`));
  }
  if (r.source) lines.push("", `Source: ${r.source}`);
  return lines.join("\n");
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);

  const params = cli.buildBody(flags, {
    feature: "featureId",
    epic: "epicId",
    release: "releaseId",
    "secondary-feature": "secondaryFeatureId",
    refs: "refs",
    "include-deprecated": { key: "includeDeprecated", transform: cli.bool },
  });
  params.projectId = project.id;

  const [items, features, releaseList] = await Promise.all([
    cli.fetchAll(client, "/api/v1/requirement", params),
    cli.fetchAll(client, "/api/v1/feature", { projectId: project.id }),
    cli.fetchAll(client, "/api/v1/release", { projectId: project.id }),
  ]);
  if (items.length === 0) return console.log("No requirements found.");

  // List items omit notes and acceptance criteria, so read each detail.
  const requirements = await mapLimit(items, DETAIL_CONCURRENCY, (r) =>
    client.get(`/api/v1/requirement/${r.id}`).then((res) => res.data.data),
  );
  requirements.sort(compareRefs);

  const releases = new Map(releaseList.map((r) => [r.id, r]));
  const featuresById = new Map(features.map((f) => [f.id, f]));
  const byFeature = new Map();
  for (const r of requirements) {
    if (!byFeature.has(r.featureId)) byFeature.set(r.featureId, []);
    byFeature.get(r.featureId).push(r);
  }

  const sections = [
    `# Requirements: ${project.name}`,
    "",
    `${requirements.length} requirement(s) in ${byFeature.size} feature(s).`,
  ];
  for (const [featureId, group] of byFeature) {
    const f = featuresById.get(featureId);
    const title = f ? `${f.ref}. ${f.name}` : `Feature ${featureId}`;
    sections.push("", `## ${link(title, f?.webUrl)}`);
    if (f?.description) sections.push("", f.description);
    for (const r of group) sections.push("", renderRequirement(r, releases));
  }
  const markdown = `${sections.join("\n")}\n`;

  if (flags.output && flags.output !== true) {
    fs.writeFileSync(flags.output, markdown);
    console.log(
      `✓ Saved ${requirements.length} requirement(s) to ${flags.output}`,
    );
  } else {
    console.log(markdown);
  }
});

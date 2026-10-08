#!/usr/bin/env node
/**
 * Search a project's epics, features, requirements (including entities),
 * releases, and requirement discussions by keyword. REQ 8.14
 * Usage: ./search-project.js <project-slug> <keywords...> [--type <type>] [--sort relevance|last_updated] [--limit <20-500>] [--all] [--instance <name>]
 *
 * Examples:
 *   ./search-project.js spechub permissions
 *   ./search-project.js spechub guest checkout --type requirement --sort last_updated
 */
const cli = require("../lib/cli");

const TYPES = [
  "all",
  "epic",
  "feature",
  "requirement",
  "release",
  "discussion",
];
const SORTS = ["relevance", "last_updated"];

const args = process.argv.slice(2);
const flags = cli.parseFlags(args);
// Flag values are not positionals; drop them before reading the keywords.
const valueFlags = ["--type", "--sort", "--limit"];
const words = args.filter(
  (a, i) => !a.startsWith("--") && !valueFlags.includes(args[i - 1]),
);
const [slug, ...keywords] = words;

if (!slug || keywords.length === 0) {
  cli.usage(
    "Usage: ./search-project.js <project-slug> <keywords...> [--type <type>] [--sort relevance|last_updated] [--limit <20-500>] [--all]",
    `  --type: ${TYPES.join(" | ")} (default all)`,
    "",
    "Examples:",
    "  ./search-project.js spechub permissions",
    "  ./search-project.js spechub guest checkout --type requirement",
  );
}
if (flags.type && !TYPES.includes(flags.type)) {
  cli.abort(`--type must be one of: ${TYPES.join(", ")}`);
}
if (flags.sort && !SORTS.includes(flags.sort)) {
  cli.abort(`--sort must be one of: ${SORTS.join(", ")}`);
}

const ENTITIES = {
  "&#34;": '"',
  "&#39;": "'",
  "&quot;": '"',
  "&lt;": "<",
  "&gt;": ">",
  "&amp;": "&",
};

/** Plain text of a snippet, with matched keywords in **bold**. */
function plainSnippet(snippet) {
  return snippet
    .replace(/<\/?mark>/g, "**")
    .replace(/&(?:#34|#39|quot|lt|gt|amp);/g, (e) => ENTITIES[e]);
}

function label(result) {
  switch (result.type) {
    case "requirement":
      return `REQ ${result.fullyQualifiedRef}`;
    case "feature":
      return `Feature ${result.ref}`;
    case "discussion":
      return "Discussion";
    default:
      return `${result.type[0].toUpperCase()}${result.type.slice(1)} ${result.slug}`;
  }
}

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const searchTerm = keywords.join(" ");
  const params = {
    searchTerm,
    typeFilter: flags.type || "all",
    sortBy: flags.sort || "relevance",
    limit: flags.limit || 20,
  };

  const results = [];
  let page;
  do {
    const res = await client.get(`/api/v1/project/${project.id}/search`, {
      params,
    });
    page = res.data;
    results.push(...page.data);
    params.cursor = page.pagination.nextCursor;
  } while (flags.all && page.pagination.hasNext);

  const counts = Object.entries(page.meta.typeCounts)
    .map(([type, count]) => `${type} ${count}`)
    .join(", ");
  console.log(`\n=== Search "${searchTerm}" in ${project.name} ===`);
  console.log(`Matches by type: ${counts}\n`);

  // REQ 8.16
  for (const result of results) {
    console.log(`${label(result)}: ${result.title}`);
    const snippet = result.snippet && plainSnippet(result.snippet);
    if (snippet && snippet.replace(/\*\*/g, "") !== result.title) {
      console.log(`  Match: ${snippet}`);
    }
    if (result.requirementId) {
      console.log(`  Requirement ID: ${result.requirementId}`);
    }
    console.log(`  URL: ${result.webUrl}`);
    console.log(`  ID:  ${result.id}\n`);
  }

  const order =
    params.sortBy === "relevance" ? "most relevant" : "most recently updated";
  console.log(`Showing ${results.length} result(s), ${order} first.`);
  if (page.pagination.hasNext) {
    console.log("More results: pass --all or a larger --limit.");
  }
});

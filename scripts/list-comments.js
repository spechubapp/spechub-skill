#!/usr/bin/env node
/**
 * List the comments on a project's requirements, oldest first, with each
 * comment's requirement ref and body. Deleted comments are not listed.
 * REQ 19.7
 * Usage: ./list-comments.js <project-slug> [--since <time>] [--instance <name>]
 *
 * --since lists only comments created at or after a time: an RFC 3339 time
 * such as 2026-11-04T09:00:00-08:00, or a YYYY-MM-DD date (midnight UTC).
 * REQ 19.8
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [projectSlug] = cli.positionals(args);
const flags = cli.parseFlags(args);

if (!projectSlug) {
  cli.usage(
    "Usage: ./list-comments.js <project-slug> [--since <time>]",
    "Example: ./list-comments.js spechub --since 2026-11-04T09:00:00-08:00",
  );
}

/** Normalize a --since value to an RFC 3339 UTC time, or abort. */
function sinceTime(value) {
  if (value === true) cli.abort("--since needs a time or date");
  const time = new Date(
    /^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00Z` : value,
  );
  if (Number.isNaN(time.getTime()))
    cli.abort("--since must be an RFC 3339 time or a YYYY-MM-DD date");
  return time.toISOString();
}

cli.run(async () => {
  const since = flags.since !== undefined ? sinceTime(flags.since) : undefined;

  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const params = { projectId: project.id };
  if (since) params.since = since;

  const comments = await cli.fetchAll(client, "/api/v1/comment", params);
  const scope = since ? ` since ${since}` : "";
  if (comments.length === 0)
    return console.log(`No comments in ${project.name}${scope}.`);

  // Comments carry only the requirement's UUID; show its ref instead.
  const requirements = await cli.fetchAll(client, "/api/v1/requirement", {
    projectId: project.id,
    includeDeprecated: true,
  });
  const refs = new Map(requirements.map((r) => [r.id, r.fullyQualifiedRef]));

  console.log(`\n=== Comments in ${project.name}${scope}, oldest first ===\n`);
  for (const comment of comments) {
    const ref = refs.get(comment.requirementId);
    console.log(ref ? `REQ ${ref}` : `Requirement ${comment.requirementId}`);
    cli.printComment(comment, { body: true });
    console.log("");
  }
  console.log(`Total: ${comments.length} comment(s)`);
});

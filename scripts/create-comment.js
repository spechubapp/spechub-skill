#!/usr/bin/env node
/**
 * Add a Markdown comment to a requirement's conversation, attributed to the
 * PAT's owner. SpecHub does not yet send notifications for API comments.
 * REQ 19.1
 * Usage: ./create-comment.js <project-slug> <ref-or-uuid> <body> [--instance <name>]
 *        ./create-comment.js <project-slug> <ref-or-uuid> --body-file <file.md> [--instance <name>]
 */
const fs = require("fs");
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const firstFlag = args.findIndex((a) => a.startsWith("--"));
const [projectSlug, refOrId, text] = cli.positionals(
  firstFlag < 0 ? args : args.slice(0, firstFlag),
);
const bodyFile = cli.parseFlags(args)["body-file"];
const hasText = text !== undefined;
const hasFile = bodyFile !== undefined;

// REQ 19.2: exactly one body source, and --body-file needs a path.
if (!projectSlug || !refOrId || hasText === hasFile || bodyFile === true) {
  cli.usage(
    "Usage: ./create-comment.js <project-slug> <ref-or-uuid> <body>",
    "       ./create-comment.js <project-slug> <ref-or-uuid> --body-file <file.md>",
    "Give the body as an argument or a file path, not both.",
    'Example: ./create-comment.js spechub 1.23 "Implemented in `auth/login.ts`."',
  );
}

cli.run(async () => {
  const body = hasFile
    ? fs.readFileSync(bodyFile, "utf8").replace(/\s+$/, "")
    : text;
  if (!body) cli.abort("the comment body is empty");

  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const requirement = await cli.resolveRequirement(client, project.id, refOrId);

  const res = await client.post("/api/v1/comment", {
    requirementId: requirement.id,
    body,
  });
  const comment = res.data.data;

  console.log(
    `\nComment added to ${requirement.fullyQualifiedRef ?? requirement.id}\n`,
  );
  console.log(`  ID:      ${comment.id}`);
  console.log(`  Created: ${comment.created}`);
  cli.printWebUrl(comment);
});

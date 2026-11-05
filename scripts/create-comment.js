#!/usr/bin/env node
/**
 * Add a Markdown comment to a requirement's conversation, attributed to the
 * PAT's owner. SpecHub does not yet send notifications for API comments.
 * REQ 19.1
 * Usage: ./create-comment.js <project-slug> <ref-or-uuid> <body> [--journal-entry <uuid>] [--instance <name>]
 *        ./create-comment.js <project-slug> <ref-or-uuid> --body-file <file.md> [--journal-entry <uuid>] [--instance <name>]
 *
 * --journal-entry replies to an entry in the requirement's change history,
 * such as the one update-requirement.js prints; SpecHub quotes the entry at
 * the start of the comment. REQ 19.3
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const firstFlag = args.findIndex((a) => a.startsWith("--"));
const [projectSlug, refOrId, text] = cli.positionals(
  firstFlag < 0 ? args : args.slice(0, firstFlag),
);
const flags = cli.parseFlags(args);
const bodyFile = flags["body-file"];
const journalEntry = flags["journal-entry"];
const hasText = text !== undefined;
const hasFile = bodyFile !== undefined;

// REQ 19.2: exactly one body source, and --body-file needs a path.
if (!projectSlug || !refOrId || hasText === hasFile || bodyFile === true) {
  cli.usage(
    "Usage: ./create-comment.js <project-slug> <ref-or-uuid> <body> [--journal-entry <uuid>]",
    "       ./create-comment.js <project-slug> <ref-or-uuid> --body-file <file.md> [--journal-entry <uuid>]",
    "Give the body as an argument or a file path, not both.",
    'Example: ./create-comment.js spechub 1.23 "Implemented in `auth/login.ts`."',
  );
}
if (journalEntry !== undefined && !cli.isUuid(journalEntry)) {
  cli.abort("--journal-entry needs the UUID of a journal entry");
}

cli.run(async () => {
  const body = cli.readCommentBody(text, bodyFile);

  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, projectSlug);
  const requirement = await cli.resolveRequirement(client, project.id, refOrId);

  const comment = await cli.addComment(
    client,
    requirement.id,
    body,
    journalEntry,
  );

  const reply = journalEntry
    ? ` as a reply to journal entry ${journalEntry}`
    : "";
  console.log(
    `\nComment added to ${requirement.fullyQualifiedRef ?? requirement.id}${reply}\n`,
  );
  cli.printComment(comment);
});

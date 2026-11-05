#!/usr/bin/env node
/**
 * Delete a requirement comment by its UUID. Only the comment's author may
 * delete it. SpecHub replaces the body with "*This comment has been deleted*",
 * which stays in the requirement's conversation in the web app; the API no
 * longer lists or returns the comment. REQ 19.10
 * Usage: ./delete-comment.js <comment-uuid> [--instance <name>]
 *
 * ⚠️  WARNING: The comment's text cannot be recovered.
 */
const cli = require("../lib/cli");

const [id] = cli.positionals(process.argv.slice(2));

if (!id || !cli.isUuid(id)) {
  cli.usage(
    "Usage: ./delete-comment.js <comment-uuid>",
    "Example: ./delete-comment.js 123e4567-e89b-12d3-a456-426614174000",
    "",
    "⚠️  WARNING: The comment's text cannot be recovered.",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  await client.delete(`/api/v1/comment/${id}`);
  console.log(`\nComment ${id} deleted.`);
  console.log(
    "  The web app keeps a placeholder in the requirement's conversation.",
  );
});

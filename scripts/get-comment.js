#!/usr/bin/env node
/**
 * Show one requirement comment by its UUID. A deleted comment is not found.
 * REQ 19.9
 * Usage: ./get-comment.js <comment-uuid> [--instance <name>]
 */
const cli = require("../lib/cli");

const [id] = cli.positionals(process.argv.slice(2));

if (!id || !cli.isUuid(id)) {
  cli.usage(
    "Usage: ./get-comment.js <comment-uuid>",
    "Example: ./get-comment.js 123e4567-e89b-12d3-a456-426614174000",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const res = await client.get(`/api/v1/comment/${id}`);
  const comment = res.data.data;

  console.log(`\n=== Comment ${comment.id} ===\n`);
  console.log(`  Requirement ID: ${comment.requirementId}`);
  cli.printComment(comment, { body: true });
});

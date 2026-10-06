#!/usr/bin/env node
/**
 * Add an external reference to an epic, feature, or requirement. A GitHub
 * issue or pull request URL in the project's connected repository is enriched
 * with its details. REQ 17.1
 * Usage: ./add-reference.js <epic|feature> <uuid> --name <text> --url <url> --type <type> [--notes <text>] [--instance <name>]
 *        ./add-reference.js requirement [<project-slug>] <ref-or-uuid> --name <text> --url <url> --type <type> [--notes <text>]
 *
 * --type: Documentation | Test | Implementation | Other
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const firstFlag = args.findIndex((a) => a.startsWith("--"));
const parentArgs = firstFlag === -1 ? args : args.slice(0, firstFlag);

if (parentArgs.length < 2) {
  cli.usage(
    "Usage: ./add-reference.js <epic|feature> <uuid> --name <text> --url <url> --type <type> [--notes <text>]",
    "       ./add-reference.js requirement [<project-slug>] <ref-or-uuid> --name <text> --url <url> --type <type> [--notes <text>]",
    "Types: Documentation, Test, Implementation, Other",
    'Example: ./add-reference.js requirement spechub 1.23 --name "Login test" --url https://github.com/org/repo/blob/main/login.test.js --type Test',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, parentArgs.length);
  const body = cli.buildBody(flags, {
    name: "name",
    url: "url",
    type: "type",
    notes: "notes",
  });
  // REQ 17.4
  for (const key of ["name", "url", "type"]) {
    if (typeof body[key] !== "string") cli.abort(`--${key} is required`);
  }

  const client = await cli.createClient();
  const parent = await cli.resolveReferenceParent(client, parentArgs);
  const res = await client.post(
    `/api/v1/${parent.kind}/${parent.id}/reference`,
    body,
  );

  console.log(`\nExternal reference added to ${parent.label}:\n`);
  cli.printReference(res.data.data);
});

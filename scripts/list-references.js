#!/usr/bin/env node
/**
 * List the external references of an epic, feature, or requirement, including
 * the Figma and Replacement references SpecHub manages. REQ 8.10
 * Usage: ./list-references.js <epic|feature> <uuid> [--instance <name>]
 *        ./list-references.js requirement [<project-slug>] <ref-or-uuid> [--instance <name>]
 */
const cli = require("../lib/cli");

const parentArgs = cli.positionals(process.argv.slice(2));

if (parentArgs.length < 2) {
  cli.usage(
    "Usage: ./list-references.js <epic|feature> <uuid>",
    "       ./list-references.js requirement [<project-slug>] <ref-or-uuid>",
    "Example: ./list-references.js requirement spechub 1.23",
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  const parent = await cli.resolveReferenceParent(client, parentArgs);
  const res = await client.get(`/api/v1/${parent.kind}/${parent.id}/reference`);
  const refs = res.data.data;

  if (refs.length === 0)
    return console.log(`No external references on ${parent.label}.`);

  console.log(`\n${refs.length} external reference(s) on ${parent.label}:\n`);
  refs.forEach((ref) => {
    cli.printReference(ref);
    console.log("");
  });
});

#!/usr/bin/env node
/**
 * Update an existing user role (PATCH — only provided fields are changed).
 * Usage: ./update-userrole.js <userrole-uuid> [--name "..."] [--description "..."] [--instance <name>]
 */
const cli = require("../lib/cli");

const args = process.argv.slice(2);
const [userRoleID] = cli.positionals(args);

if (!userRoleID) {
  cli.usage(
    'Usage: ./update-userrole.js <userrole-uuid> [--name "..."] [--description "..."]',
    'Example: ./update-userrole.js 123e4567-e89b-12d3-a456-426614174000 --name "Power User"',
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const body = cli.buildBody(flags, {
    name: "name",
    description: "description",
  });

  if (Object.keys(body).length === 0)
    cli.abort("provide at least one field to update (--name, --description)");

  const client = await cli.createClient();
  const res = await client.patch(`/api/v1/userrole/${userRoleID}`, body);
  const role = res.data.data;

  console.log(`\nUser role updated successfully!\n`);
  console.log(`  Name: ${role.name}`);
  console.log(`  ID:   ${role.id}`);
  if (role.description) console.log(`  Description: ${role.description}`);
});

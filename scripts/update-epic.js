#!/usr/bin/env node
/**
 * Update an existing epic (PATCH — only provided fields are changed).
 * Usage: ./update-epic.js <epic-uuid> [--name "..."] [--description "..."] [--notes "..."] [--slug "..."] [--instance <name>]
 */
const cli = require('../lib/cli');

const args = process.argv.slice(2);
const [epicId] = cli.positionals(args);

if (!epicId) {
  cli.usage(
    'Usage: ./update-epic.js <epic-uuid> [--name "..."] [--description "..."] [--notes "..."] [--slug "..."]',
    'Example: ./update-epic.js 123e4567-e89b-12d3-a456-426614174000 --name "New name"'
  );
}

cli.run(async () => {
  const flags = cli.parseFlags(args, 1);
  const body = cli.buildBody(flags, {
    name: 'name',
    description: 'description',
    notes: 'notes',
    slug: 'slug',
  });

  if (Object.keys(body).length === 0) cli.abort('provide at least one field to update (--name, --description, --notes, --slug)');

  const client = await cli.createClient();
  const res = await client.patch(`/api/v1/epic/${epicId}`, body);
  const epic = res.data.data;

  console.log(`\nEpic updated successfully!\n`);
  console.log(`  Name: ${epic.name}`);
  console.log(`  ID:   ${epic.id}`);
  if (epic.description) console.log(`  Description: ${epic.description}`);
});

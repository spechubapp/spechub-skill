#!/usr/bin/env node
/**
 * List all epics for a project.
 * Usage: ./list-epics.js <project-slug> [--instance <name>]
 */
const cli = require('../lib/cli');

const [slug] = cli.positionals(process.argv.slice(2));

if (!slug) cli.usage('Usage: ./list-epics.js <project-slug> [--instance <name>]', 'Example: ./list-epics.js my-project');

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const epics = await cli.fetchAll(client, '/api/v1/epic', { projectId: project.id });

  console.log(`\nEpics for: ${project.name}\n`);
  if (epics.length === 0) return console.log('No epics found.');

  epics.forEach((e, i) => {
    console.log(`${i + 1}. ${e.name}`);
    console.log(`   ID: ${e.id}`);
    if (e.description) {
      const desc = e.description.substring(0, 100);
      console.log(`   ${desc}${e.description.length > 100 ? '...' : ''}`);
    }
    console.log('');
  });

  console.log(`Total: ${epics.length} epic(s)\n`);
  console.log('Use ./scripts/get-epic-context.js <epic-id> to view full context\n');
});

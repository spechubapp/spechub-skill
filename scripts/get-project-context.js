#!/usr/bin/env node
/**
 * Get the context (markdown) for a project, identified by slug.
 * Usage: ./get-project-context.js <project-slug> [output-file] [--instance <name>]
 */
const cli = require('../lib/cli');

const [slug, outputFile] = cli.positionals(process.argv.slice(2));

if (!slug) cli.usage('Usage: ./get-project-context.js <project-slug> [output-file]', 'Example: ./get-project-context.js my-project');

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  console.log(`\nFetching context for: ${project.name} (${project.id})\n`);
  await cli.printContext(client, '/api/v1/project/context', { projectId: project.id }, {
    title: 'Project Context',
    outputFile,
  });
});

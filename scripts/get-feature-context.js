#!/usr/bin/env node
/**
 * Get the context (markdown) for a feature, identified by UUID.
 * Usage: ./get-feature-context.js <feature-uuid> [output-file] [--instance <name>]
 *
 * To find the feature UUID, run: ./scripts/list-features.js <project-slug>
 */
const cli = require('../lib/cli');

const [featureId, outputFile] = cli.positionals(process.argv.slice(2));

if (!featureId) {
  cli.usage(
    'Usage: ./get-feature-context.js <feature-uuid> [output-file]',
    'Example: ./get-feature-context.js 123e4567-e89b-12d3-a456-426614174000',
    '',
    'To find feature UUIDs: ./scripts/list-features.js <project-slug>'
  );
}

cli.run(async () => {
  const client = await cli.createClient();
  console.log(`\nFetching context for feature: ${featureId}\n`);
  await cli.printContext(client, '/api/v1/feature/context', { featureId }, {
    title: 'Feature Context',
    outputFile,
  });
});

#!/usr/bin/env node
/**
 * List all organizations the caller belongs to.
 * Usage: ./list-organizations.js [--instance <name>]
 */
const cli = require('../lib/cli');

cli.run(async () => {
  const client = await cli.createClient();
  const orgs = await cli.fetchAll(client, '/api/v1/organization');

  if (orgs.length === 0) return console.log('No organizations found.');

  console.log(`\n=== Organizations ===\n`);
  orgs.forEach((org, i) => {
    console.log(`${i + 1}. ${org.name}`);
    console.log(`   ID:          ${org.id}`);
    console.log(`   Slug:        ${org.slug}`);
    if (org.description) console.log(`   Description: ${org.description}`);
    console.log();
  });

  console.log(`Total: ${orgs.length} organization(s)`);
});

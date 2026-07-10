#!/usr/bin/env node
/**
 * Interactive setup: add a SpecHub instance to instances.json.
 * This replaces the old .env-based setup.
 */
const path = require('path');
const readline = require('readline');
const instances = require('../lib/instances');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(question) {
  return new Promise(resolve => rl.question(question, answer => resolve(answer.trim())));
}

async function main() {
  console.log('=== SpecHub Skill Setup ===\n');
  console.log('You need a personal access token from your SpecHub account settings.\n');

  const existingData = instances.load();
  const hasExisting = Object.keys(existingData.instances).length > 0;
  if (hasExisting) {
    console.log('Existing instances:');
    for (const [name, inst] of Object.entries(existingData.instances)) {
      const marker = name === existingData.default ? ' (default)' : '';
      console.log(`  ${name}${marker} — ${inst.url}`);
    }
    console.log('');
  }

  const instanceName = await ask('Instance name (e.g. production, staging) [production]: ');
  const resolvedName = instanceName || 'production';

  const urlInput = await ask('API URL [https://api.spechub.app]: ');
  const url = urlInput || 'https://api.spechub.app';

  const pat = await ask('Personal access token: ');
  if (!pat) {
    console.error('\nNo token provided. Aborting.');
    rl.close();
    process.exit(1);
  }

  let makeDefault = true;
  if (hasExisting && resolvedName !== existingData.default) {
    const answer = await ask(`Set "${resolvedName}" as default? [y/N]: `);
    makeDefault = answer.toLowerCase() === 'y';
  }

  rl.close();

  instances.addOrUpdate(resolvedName, url, pat, makeDefault);

  console.log(`\n✓ Instance "${resolvedName}" saved.`);
  if (makeDefault) console.log('✓ Set as default.');
  console.log('\nRun ./scripts/check-auth.js to verify the token works.\n');
}

main().catch(err => {
  console.error(err.message);
  process.exit(1);
});

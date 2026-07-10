#!/usr/bin/env node
/**
 * List all configured SpecHub instances.
 * Usage: ./list-instances.js
 */
const instances = require('../lib/instances');

const { default: defaultName, instances: all } = instances.list();
const names = Object.keys(all);

if (names.length === 0) {
  console.log('No instances configured.');
  console.log('Run ./scripts/add-instance.js to add one.\n');
  process.exit(0);
}

console.log('\nConfigured SpecHub instances:\n');
for (const name of names) {
  const inst = all[name];
  const marker = name === defaultName ? ' (default)' : '';
  const patHint = inst.pat ? inst.pat.substring(0, 8) + '...' : '(not set)';
  console.log(`  ${name}${marker}`);
  console.log(`    URL: ${inst.url}`);
  console.log(`    PAT: ${patHint}`);
  console.log('');
}

console.log(`Use --instance <name> with any script to target a specific instance.`);
console.log(`Use ./scripts/use-instance.js <name> to change the default.\n`);

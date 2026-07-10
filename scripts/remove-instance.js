#!/usr/bin/env node
/**
 * Remove a named SpecHub instance.
 * Usage: ./remove-instance.js <name>
 */
const instances = require('../lib/instances');

const name = process.argv[2];

if (!name) {
  console.error('Usage: ./remove-instance.js <name>');
  process.exit(1);
}

const ok = instances.remove(name);
if (!ok) {
  console.error(`Instance "${name}" not found.`);
  const { instances: all } = instances.list();
  const names = Object.keys(all);
  if (names.length > 0) {
    console.error(`Available instances: ${names.join(', ')}`);
  }
  process.exit(1);
}

const { default: newDefault } = instances.list();
console.log(`\n✓ Instance "${name}" removed.`);
if (newDefault) {
  console.log(`  New default: "${newDefault}"`);
} else {
  console.log('  No instances remaining. Run ./scripts/add-instance.js to add one.');
}
console.log('');

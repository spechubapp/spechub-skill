#!/usr/bin/env node
/**
 * Set the default SpecHub instance.
 * Usage: ./use-instance.js <name>
 */
const instances = require("../lib/instances");

const name = process.argv[2];

if (!name) {
  console.error("Usage: ./use-instance.js <name>");
  console.error("Example: ./use-instance.js staging");
  const { instances: all } = instances.list();
  const names = Object.keys(all);
  if (names.length > 0) {
    console.error(`\nAvailable instances: ${names.join(", ")}`);
  }
  process.exit(1);
}

const ok = instances.setDefault(name);
if (!ok) {
  console.error(`Instance "${name}" not found.`);
  const { instances: all } = instances.list();
  const names = Object.keys(all);
  if (names.length > 0) {
    console.error(`Available instances: ${names.join(", ")}`);
  }
  process.exit(1);
}

console.log(`\n✓ Default instance set to "${name}".\n`);

#!/usr/bin/env node
/**
 * Diagnose the SpecHub skill configuration.
 * Usage: ./diagnose.js [--instance <name>]
 */
const cli = require("../lib/cli");
const path = require("path");
const fs = require("fs");
const instances = require("../lib/instances");

const INSTANCES_PATH = path.join(__dirname, "..", "instances.json");

async function main() {
  console.log("=== SpecHub Skill Diagnostics ===\n");

  // Show all configured instances
  const { default: defaultName, instances: all } = instances.list();
  const names = Object.keys(all);

  if (names.length > 0) {
    console.log("Configured instances:");
    for (const name of names) {
      const inst = all[name];
      const marker = name === defaultName ? " (default)" : "";
      console.log(`  ✓ ${name}${marker} — ${inst.url}`);
    }
  } else if (fs.existsSync(path.join(__dirname, "..", ".env"))) {
    console.log("✓ No instances.json — falling back to .env");
    const pat = process.env.SPECHUB_PAT;
    const url = process.env.SPECHUB_API_URL || "https://api.spechub.app";
    if (pat) {
      console.log(`  URL: ${url}`);
      console.log(`  PAT: ${pat.substring(0, 8)}...`);
    } else {
      console.log("  ✗ SPECHUB_PAT not set in .env");
      process.exit(1);
    }
  } else {
    console.log("✗ No instances configured and no .env found.");
    console.log("  Run ./scripts/add-instance.js to set up an instance.");
    process.exit(1);
  }

  // Check active instance
  const cfg = instances.getConfig();
  console.log(`\nActive instance: "${cfg.name}" (${cfg.url})`);

  // Check API connectivity
  try {
    const client = await cli.createClient(cfg);
    console.log("✓ Bearer token obtained");

    const projects = await cli.fetchAll(client, "/api/v1/project");
    console.log(`✓ API reachable — ${projects.length} project(s) accessible`);

    if (projects.length > 0) {
      console.log("\nProjects:");
      projects.forEach((p) => console.log(`  - ${p.name} (${p.slug})`));
    }
  } catch (err) {
    console.error("✗ API error:", err.response?.data?.detail || err.message);
    process.exit(1);
  }

  console.log("\n✓ All checks passed\n");
}

main().catch((err) => {
  console.error("Unexpected error:", err.message);
  process.exit(1);
});

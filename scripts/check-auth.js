#!/usr/bin/env node
/**
 * Verify that the configured PAT can obtain a bearer token from the API.
 * Usage: ./check-auth.js [--instance <name>]
 */
const cli = require("../lib/cli");
const instances = require("../lib/instances");

async function main() {
  const cfg = instances.getConfig();
  console.log(`\nChecking auth for instance "${cfg.name}" (${cfg.url})...\n`);

  const token = await cli.getAccessToken(cfg);
  console.log("✓ Successfully obtained bearer token.");
  console.log(`  Token prefix: ${token.substring(0, 20)}...`);
  console.log("");
}

main().catch((err) => {
  console.error(
    "✗ Authentication failed:",
    err.response?.data?.detail || err.message,
  );
  console.error("\nEnsure the PAT for this instance is correct.");
  console.error("Run ./scripts/list-instances.js to inspect configuration.");
  process.exit(1);
});

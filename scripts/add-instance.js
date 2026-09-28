#!/usr/bin/env node
/**
 * Add or update a named SpecHub instance.
 *
 * Usage:
 *   ./add-instance.js                              # interactive; the PAT is not echoed
 *   ./add-instance.js <name> --url <url> --pat-stdin [--default] < token-file
 *
 * --pat <token> is still accepted but exposes the token in shell history and
 * the process list.
 */
const readline = require("readline");
const instances = require("../lib/instances");

const args = process.argv.slice(2);
const name = args[0] && !args[0].startsWith("--") ? args[0] : null;

function parseFlags(argv) {
  const result = {};
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--default" || argv[i] === "--pat-stdin") {
      result[argv[i].slice(2)] = true;
      continue;
    }
    if (argv[i].startsWith("--") && argv[i + 1]) {
      result[argv[i].slice(2)] = argv[++i];
    }
  }
  return result;
}

function ask(rl, question) {
  return new Promise((resolve) =>
    rl.question(question, (answer) => resolve(answer.trim())),
  );
}

// Like ask(), but does not echo what is typed.
function askHidden(rl, question) {
  return new Promise((resolve) => {
    const write = rl._writeToOutput;
    rl.question(question, (answer) => {
      rl._writeToOutput = write;
      rl.output.write("\n");
      resolve(answer.trim());
    });
    rl._writeToOutput = () => {};
  });
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8").trim();
}

async function interactive() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("=== Add SpecHub Instance ===\n");

  const instanceName = await ask(
    rl,
    "Instance name (e.g. production, staging): ",
  );
  if (!instanceName) {
    console.error("Name is required.");
    process.exit(1);
  }

  const url = await ask(rl, `API URL [https://api.spechub.app]: `);
  const resolvedUrl = url || "https://api.spechub.app";

  const pat = await askHidden(rl, "Personal access token (hidden): ");
  if (!pat) {
    console.error("PAT is required.");
    process.exit(1);
  }

  const existingData = instances.load();
  const makeDefault =
    Object.keys(existingData.instances).length === 0
      ? true
      : (await ask(rl, `Set as default? [y/N]: `)).toLowerCase() === "y";

  rl.close();

  instances.addOrUpdate(instanceName, resolvedUrl, pat, makeDefault);

  console.log(`\n✓ Instance "${instanceName}" saved.`);
  if (makeDefault) console.log(`✓ Set as default.`);
  console.log("\nRun ./scripts/check-auth.js to verify it works.\n");
}

async function nonInteractive(instanceName, flags) {
  const url = flags.url || "https://api.spechub.app";
  if (typeof flags.pat === "string") {
    console.error(
      "Warning: --pat exposes the token in shell history and the process list; prefer --pat-stdin or the interactive prompt.",
    );
  }
  const pat = flags["pat-stdin"] ? await readStdin() : flags.pat;

  if (!pat) {
    console.error("Error: no PAT provided.");
    console.error(
      "Usage: ./add-instance.js <name> --url <url> --pat-stdin [--default] < token-file",
    );
    process.exit(1);
  }

  instances.addOrUpdate(instanceName, url, pat, !!flags.default);

  console.log(`\n✓ Instance "${instanceName}" saved (${url}).`);
  if (flags.default) console.log("✓ Set as default.");
}

async function main() {
  const flags = parseFlags(args.slice(name ? 1 : 0));

  if (name && (flags.pat || flags["pat-stdin"])) {
    await nonInteractive(name, flags);
  } else {
    await interactive();
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});

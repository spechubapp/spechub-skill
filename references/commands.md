# Commands and helpers

Run from the skill directory. Positional arguments come first; `--instance
<name>` may appear anywhere. `<project>` is a slug or UUID; `<ref-or-uuid>` is a
`fullyQualifiedRef` such as `1.23` or a UUID.

## Setup and instances

```bash
./scripts/add-instance.js [name] [--url <url>] [--pat <token>] [--default]  # interactive without args
./scripts/list-instances.js
./scripts/use-instance.js <name>
./scripts/remove-instance.js <name>
./scripts/check-auth.js       # verify the PAT
./scripts/diagnose.js         # connection + auth diagnostics
```

## Repository links

```bash
./scripts/show-link.js <repo-path>        # nearest .spechub.json, matching instance, verified project
./scripts/link-project.js <repo-path> <project> [--force]
```

`link-project.js` records the resolved instance's URL, so pass `--instance` to
link against a non-default instance. `lib/project-link.js` exports `find`,
`load`, `read`, `validate`, and `write`; `instances.getConfigForUrl(url)`
selects the instance for a link's `apiUrl` (`--instance` or `SPECHUB_INSTANCE`
wins, with `urlMismatch: true` when the URLs differ).

## Projects, epics, features, releases, user roles

```bash
./scripts/list-organizations.js
./scripts/list-projects.js
./scripts/analyze-project.js <project>          # counts + project context
./scripts/get-project-context.js <project> [output.md]
./scripts/delete-project.js <project>

./scripts/list-{epics,features,releases,userroles}.js <project>
./scripts/create-{epic,feature,release,userrole}.js <project> <name> [description]
./scripts/delete-{epic,feature,release,userrole}.js <uuid>
./scripts/get-{epic,feature,release}-context.js <uuid> [output.md]

./scripts/update-epic.js <uuid> [--name] [--description] [--notes] [--slug]
./scripts/update-feature.js <uuid> [--name] [--description] [--notes] [--source]
./scripts/update-release.js <uuid> [--name] [--description] [--slug] [--shipped true|false]
./scripts/update-userrole.js <uuid> [--name] [--description]

./scripts/get-epic-features.js <epic-uuid>
./scripts/set-epic-features.js <epic-uuid> <feature-uuid>...   # replaces the full set
```

## Requirements and entities

```bash
./scripts/list-requirements.js <project> [filters]
./scripts/get-entities.js <project> [filters]
  # filters: --feature, --epic, --release, --secondary-feature <uuid>,
  #          --refs 1.2,3.4, --include-deprecated

./scripts/get-requirement.js <project> <ref-or-uuid>
./scripts/get-entity.js <project> <ref-or-uuid>

./scripts/create-requirement.js <project> <feature-uuid> <description> --formulation <type> [--type] [item flags]
./scripts/update-requirement.js <project> <ref-or-uuid> [--description <text> --formulation <type>] [--type] [--feature <uuid>] [item flags]
./scripts/create-entity.js <project> <feature-uuid> <entity-name> [item flags]
./scripts/update-entity.js <project> <ref-or-uuid> [--entity-name] [--feature <uuid>] [item flags]
  # --formulation: simple | user-role-capability | event-triggered | constraint | state-based
  # --type: Functional | Design | Performance
  # item flags: --status Untested|Passing|Failing|Deprecated, --release <uuid>,
  #   --secondary-feature <uuid>, --source, --notes, --business-critical true|false,
  #   --acceptance-criteria (update only)

./scripts/get-requirement-improvements.js <project> <ref-or-uuid>... --release-number <name|none>
./scripts/set-entity-fields.js <project> <ref-or-uuid> --fields <file.json>       # body: api.md
./scripts/set-entity-fields.js <project> <ref-or-uuid> --delete <field-uuid>[,...]
./scripts/delete-requirement.js <project> <ref-or-uuid>   # refuses shipped releases
./scripts/delete-entity.js <project> <ref-or-uuid>
```

`update-requirement.js` refuses content changes to requirements in shipped
releases.

## Direct API usage

Write a script for what the scripts cannot express, such as project creation,
acceptance-criteria arrays, or clearing a relationship with `null` (scripts
send flag values as strings).

```javascript
const cli = require("../lib/cli"); // from a file in scripts/
cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, "spechub");
  console.log(
    await cli.getContext(client, "/api/v1/project/context", {
      projectId: project.id,
    }),
  );
});
```

For another instance, pass `require("../lib/instances").getConfig("staging")`
to `createClient()`; resolve each instance's identifiers with its own client.

## Helpers

`lib/cli.js` loads `.env` and re-exports `lib/api-client.js`.

| Helper                                                                         | Behavior                                                        |
| ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `createClient(config?)` / `getAccessToken(config?)`                            | Authenticate with optional `{ url, pat }`; tokens auto-refresh  |
| `fetchAll(client, path, params)`                                               | All pages of a list                                             |
| `getContext(client, path, params)`                                             | Markdown context                                                |
| `printContext(client, path, params, { title, outputFile })`                    | Print and optionally save context                               |
| `resolveProjectSlug(client, slugOrId)`                                         | Project from a per-process cached list                          |
| `resolveRequirement` / `resolveEntity(client, projectId, refOrId, { detail })` | UUID → detail; ref → list item, or detail with `detail: true`   |
| `abortIfShipped(client, requirement, advice)`                                  | Exit if the requirement's release is shipped                    |
| `splitDescription(description, existingNotes)`                                 | `{ description, notes }` within the 300-character limit         |
| `validateRequirementFormulation(description, formulation)`                     | Exit unless the description matches the formulation's structure |
| `parseFlags(args, start)` / `positionals(args)` / `bool(value)`                | Argument parsing                                                |
| `buildBody(flags, spec)`                                                       | Map supplied flags to body keys, with optional transforms       |
| `run(main)` / `abort(message)` / `usage(...lines)`                             | Error handling and exits                                        |

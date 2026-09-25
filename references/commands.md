# Commands and helpers

Run from the skill directory; every script accepts `--instance <name>` anywhere
in its arguments. Positional arguments below precede other flags.
Follow [write confirmation](../SKILL.md#write-confirmation) before running
commands that change SpecHub data.

## Setup

Run `npm install` if dependencies are missing. Add an instance interactively
with `./scripts/add-instance.js`, or use its flags below. Check credentials
with `check-auth.js`; use `diagnose.js` for connection problems.

## Instance management

```bash
./scripts/add-instance.js [name] [--url <url>] [--pat <token>] [--default]
./scripts/list-instances.js
./scripts/use-instance.js <name>
./scripts/remove-instance.js <name>
./scripts/check-auth.js
./scripts/diagnose.js             # connection + auth diagnostics
```

## Organizations

```bash
./scripts/list-organizations.js
```

## Projects

```bash
./scripts/list-projects.js
./scripts/get-project-context.js <slug> [output.md]
./scripts/analyze-project.js <slug>
./scripts/delete-project.js <project-uuid>
```

## Epics

```bash
./scripts/list-epics.js <project-slug>
./scripts/get-epic-context.js <epic-uuid> [output.md]
./scripts/get-epic-features.js <epic-uuid>
./scripts/set-epic-features.js <epic-uuid> <feature-uuid> [<feature-uuid> ...]
./scripts/create-epic.js <project-slug> <name> [description]
./scripts/update-epic.js <epic-uuid> [--name "..."] [--description "..."] [--notes "..."] [--slug "..."]
./scripts/delete-epic.js <epic-uuid>
```

## Features

```bash
./scripts/list-features.js <project-slug>
./scripts/get-feature-context.js <feature-uuid> [output.md]
./scripts/create-feature.js <project-slug> <name> [description]
./scripts/update-feature.js <feature-uuid> [--name "..."] [--description "..."] [--notes "..."] [--source "..."]
./scripts/delete-feature.js <feature-uuid>
```

## Requirements

```bash
./scripts/list-requirements.js <project-slug> [options]
  Options: --feature <uuid>, --epic <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --refs <1.2,3.4>,
           --include-deprecated

./scripts/get-requirement.js <project-slug> <requirement-ref-or-uuid>
  # Get full details of a requirement by ref (e.g. "133.8") or UUID

./scripts/create-requirement.js <project-slug> <feature-uuid> <description> [options]
  Options: --formulation simple|user-role-capability|event-triggered|constraint|state-based
           --type Functional|Design|Performance
           --status Untested|Passing|Failing|Deprecated
           --release <uuid>, --secondary-feature <uuid>
           --source, --notes, --business-critical true|false

./scripts/update-requirement.js <project-slug> <requirement-ref-or-uuid> [options]
  Options: --description (requires --formulation), --type, --status, --feature <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --source, --notes,
           --acceptance-criteria, --business-critical true|false

./scripts/get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...] --release-number <name-or-slug>

./scripts/delete-requirement.js <project-slug> <requirement-ref-or-uuid>
```

## Entities

```bash
./scripts/get-entities.js <project-slug> [options]
  Options: --feature <uuid>, --epic <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --refs <1.2,3.4>,
           --include-deprecated

./scripts/get-entity.js <project-slug> <entity-ref-or-uuid>
  # Get full details of an entity by ref (e.g. "1.1") or UUID

./scripts/create-entity.js <project-slug> <feature-uuid> <entity-name> [options]
  Options: --release <uuid>, --secondary-feature <uuid>, --status Untested|Passing|Failing|Deprecated,
           --source, --notes, --business-critical true|false

./scripts/update-entity.js <project-slug> <entity-ref-or-uuid> [options]
  Options: --entity-name, --feature <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --status Untested|Passing|Failing|Deprecated, --source, --notes,
           --acceptance-criteria, --business-critical true|false

./scripts/set-entity-fields.js <project-slug> <entity-ref-or-uuid> --fields <file.json>
  # JSON body and field types: see api.md, Entity fields.
./scripts/set-entity-fields.js <project-slug> <entity-ref-or-uuid> --delete <field-uuid>[,<field-uuid>...]

./scripts/delete-entity.js <project-slug> <entity-ref-or-uuid>
```

## Releases

```bash
./scripts/list-releases.js <project-slug>
./scripts/get-release-context.js <release-uuid> [output.md]
./scripts/create-release.js <project-slug> <name> [description]
./scripts/update-release.js <release-uuid> [--name "..."] [--description "..."] [--slug "..."] [--shipped true|false]
./scripts/delete-release.js <release-uuid>
```

## User Roles

```bash
./scripts/list-userroles.js <project-slug>
./scripts/create-userrole.js <project-slug> <name> [description]
./scripts/update-userrole.js <userrole-uuid> [--name "..."] [--description "..."]
./scripts/delete-userrole.js <userrole-uuid>
```

## Direct API usage

Use direct requests for operations or values a script cannot express, such as
project creation, JSON arrays, or null relationship IDs. The scripts do not
convert `--release null` to JSON null or `--acceptance-criteria` to an array.

Example from a script in `scripts/`:

```javascript
const cli = require("../lib/cli");
cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, "spechub");
  const context = await cli.getContext(client, "/api/v1/project/context", {
    projectId: project.id,
  });
  console.log(context);
});
```

For an explicit instance, pass
`require("../lib/instances").getConfig("staging")` to `createClient()`.
Resolve each instance's identifiers with its own client.

## Helpers

`lib/cli.js` re-exports the API helpers; use `lib/api-client.js` directly for
library-only usage without automatic `.env` loading.

| Helper                                                                  | Behavior                                                                              |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `createClient(config?)` / `getAccessToken(config?)`                     | Authenticate with optional `{ url, pat }`; tokens refresh within 60 seconds of expiry |
| `fetchAll(client, path, params)`                                        | Return all list pages                                                                 |
| `getContext(client, path, params)`                                      | Return Markdown                                                                       |
| `printContext(client, path, params, { title, outputFile })`             | Print Markdown and optionally save it                                                 |
| `listProjects(client)`                                                  | Project list cached per process                                                       |
| `resolveProjectSlug(client, slugOrId)`                                  | Resolve a project from the cached list                                                |
| `resolveRequirement(client, projectId, refOrId)` / `resolveEntity(...)` | UUID: detail response; ref: filtered list item                                        |
| `isUuid(value)`                                                         | Distinguish UUID from slug/ref                                                        |
| `parseFlags(args, start=0)`                                             | Parse flags and bare booleans                                                         |
| `buildBody(flags, spec)`                                                | Map supplied flags to body keys, optionally transforming values                       |
| `bool(value)`                                                           | True for bare flag or string `true`                                                   |
| `splitDescription(description, existingNotes)`                          | Return `{ description, notes }` respecting the requirement length limit               |
| `run(main)` / `abort(message)` / `usage(...lines)`                      | Error handling and CLI exits                                                          |

Inspect [lib/cli.js](../lib/cli.js) or [lib/instances.js](../lib/instances.js)
when extending scripts. Ref resolution returns a lighter list item; fetch
detail before relying on existing notes or other omitted fields.

---
name: spechub
description: >
  Browse, analyze, and manage SpecHub projects, epics, features, requirements,
  entities, releases, and user roles across named instances. Use for tasks
  involving SpecHub (go.spechub.app) data.
license: MIT
---

# SpecHub

## Write confirmation

Before each data write (POST, PATCH, PUT, or DELETE), present the following and
wait for explicit user confirmation:

- HTTP method, full endpoint path, and instance name and URL.
- Complete request body as formatted JSON; for PATCH, identify changed fields.
- For DELETE, identify the resource and state that deletion is permanent.
- Exact command when using a script.

Approval covers only the operations shown. Multiple operations may share one
confirmation if each is fully specified; it never covers later operations.
Scripts execute writes directly, so obtain confirmation **before running them**.
Automatic token exchange is authentication, not a data write.

If a write occurs without confirmation, acknowledge it, explain what should
have happened, and ask whether the user wants a reversal where possible.

## Project context and analysis

Before any project-scoped suggestion or analysis, resolve the project and load
`GET /api/v1/project/context?projectId=<uuid>`. Reuse context already fetched
for the same project and instance during the current task if still current.
This applies even when the request concerns a single requirement, feature,
epic, or release.

Account for the full context: project description, user roles, entities and
fields, features, and releases. Explain material influences on the result,
such as existing capabilities, data-model constraints, and release scope.
Supplement it with focused reads when the task needs information it lacks.

All context endpoints use `GET /api/v1/<resource>/context` and return Markdown:

| Resource | Query parameter | Contents                                                                           |
| -------- | --------------- | ---------------------------------------------------------------------------------- |
| Project  | `projectId`     | Name/description, roles, entities with fields/types, features, releases with UUIDs |
| Epic     | `epicId`        | Epic, its features, and their requirements                                         |
| Feature  | `featureId`     | Feature and its requirement descriptions                                           |
| Release  | `releaseId`     | Release name/description, features, and their requirements                         |

Use `cli.getContext()` or `cli.printContext()`; raw requests need
`Accept: text/markdown` and `responseType: 'text'`. Except for project-context
release UUIDs, context contains prose rather than structured identifiers,
statuses, refs, or timestamps.

## Requirement creation

Use the project's context to check releases before preparing a create request,
even if the user did not mention a release. Do not issue a separate release-list
request for this check.

- No releases: `releaseId` may be omitted.
- One or more releases: expect an assignment. Resolve the user's selected
  release from context and include its UUID. If no release was selected,
  show available releases and explicitly ask whether the user intends to
  create the requirement with **no release assigned**.
- After explicit confirmation of no-release intent, omit `releaseId` and
  obtain the separate write confirmation above. Neither confirmation
  substitutes for the other.

For requirement creates and updates, `description` is limited to 300
characters. Use `cli.splitDescription()` to split at a sentence/word boundary
and prepend overflow to notes, preserving existing notes. Show the resulting
body in the write confirmation. The requirement scripts perform this split;
direct API callers must handle it themselves.

## Reads and identifiers

- Use UUIDs for API operations. Resolve project slugs with
  `resolveProjectSlug()`; requirements/entities accept UUIDs or
  `fullyQualifiedRef` through `resolveRequirement()` / `resolveEntity()`.
- In user-facing output, lead with requirement/entity refs (e.g. `1.23`) and
  feature integer refs. Include UUIDs only when needed.
- Prefer context for overviews and server-side filters for structured reads.
  Ref resolvers use `?refs=1.23,2.45`; avoid fetching whole projects or looping
  detail calls when context or a filtered list suffices.
- Use `fetchAll()` for complete lists; it follows opaque pagination cursors at
  `limit=500`. Run independent reads concurrently.
- List items omit details such as notes, source, acceptance criteria, and
  entity fields. Fetch detail only when needed. Requirements/entities exclude
  deprecated items by default; use `includeDeprecated=true` when relevant.

## Instance and execution

Requires Node.js 18+, axios, dotenv, and a SpecHub personal access token.
Run commands from this skill's directory. Install dependencies with
`npm install` if needed. All scripts accept `--instance <name>`; selection
order is that flag, `SPECHUB_INSTANCE`, the default in `instances.json`, then
legacy `SPECHUB_PAT` / `SPECHUB_API_URL` environment variables.

PATs are stored as plaintext in gitignored `instances.json`; do not expose or
commit them. `lib/cli.js` loads `.env` and provides the authenticated client,
resolvers, and request helpers. The client exchanges the PAT for a bearer
token and supplies the `spechub-skill (curl)` User-Agent.

## Task references

Read only the reference needed for the operation:

- [Commands](references/commands.md): setup, instance management, script
  arguments, and helper usage.
- [API](references/api.md): direct requests, request bodies, filters, entity
  fields, response shapes, and error handling.

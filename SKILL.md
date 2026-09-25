---
name: spechub
description: >
  Browse, analyze, and manage SpecHub projects, epics, features, requirements,
  entities, releases, and user roles across named instances. Use for tasks
  involving SpecHub (go.spechub.app) data, or code changes in a repository
  already linked to SpecHub requirements.
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

## Requirement authoring

Before drafting, suggesting, reviewing, or improving any requirement, read
[Requirement authoring](references/requirement-authoring.md). Apply its five
formulation types, canonical structures, quality rules, and preflight checklist.
Every proposed requirement must match exactly one type and be atomic,
objective, unambiguous, and verifiable. Label suggestions with their formulation
type, or explicitly classify every requirement before presenting the set.
These formulation types are distinct from the API's `requirementType` category.
The create and description-update scripts require `--formulation` and reject
descriptions that do not follow the selected type's canonical structure. Review
the meaning and testability yourself; a structural check cannot establish them.

## Requirement suggestions and changes

Before suggesting any new or revised requirement, always ask the user for a
release number. Show the project's available releases from project context and
resolve the answer to its release UUID. If there is no matching release, ask
whether to create that release or explicitly leave the requirement unassigned.
Do not present the suggestion until the user answers. Include the selected
release number with every suggestion. For an update, show the
stored description and the proposed description side by side, with its ref and
`webUrl` link. Do not apply a suggestion before the user accepts it.

Check the requirement's current release before changing its meaning, scope,
type, acceptance criteria, or feature assignment. If that release is shipped,
create a replacement requirement in an unshipped intended release, then mark
the old requirement `Deprecated`; do not rewrite the shipped requirement in
place. If the requirement does not belong to a shipped release, deletion may
be used instead of deprecation when the user wants to remove it. Status or test
result updates that do not change the requirement's meaning may update in place.

When working in a code repository already linked to SpecHub, inspect relevant
code changes and their nearby requirement references. At the end of a code
change, compare the changed behavior with the project's requirements and
proactively suggest any needed requirement additions or updates, following the
release and comparison rules above. Once the user accepts and the SpecHub
writes are complete, add the accepted requirement refs near the implementing
code using the repository's existing comment or metadata convention. Keep references short and useful; do
not add comments that merely restate the code. When making a commit, include
applicable requirement refs in its message when known (for example, `Refs:
1.23, 2.4`). Do not invent refs or block a commit when none applies.

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
- Link SpecHub objects in user-facing responses using their `webUrl` when
  present, with the human-readable ref or name as the link text. If a response
  lacks `webUrl`, fetch detail when practical; otherwise show the ref or name
  without inventing a URL.

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

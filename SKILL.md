---
name: spechub
description: >
  Browse, analyze, and manage SpecHub projects, epics, features, requirements,
  entities, releases, and user roles across named instances. Use for tasks
  involving SpecHub (go.spechub.app) data, checking a project's requirements
  for contradictions, code changes in a repository linked to a SpecHub project
  by a `.spechub.json` file, or reconciling such a repository's implementation
  against its requirements.
license: MIT
---

# SpecHub

## Write confirmation

Before each data write (POST, PATCH, PUT, DELETE), show the following and wait
for explicit approval:

- Method, endpoint path, and instance name and URL.
- Complete JSON body; for PATCH, the changed fields.
- For DELETE, the resource, and that deletion is permanent.
- The exact command, when using a script. Scripts write immediately, so
  confirm **before running them**.

Approval covers only the operations shown; several fully specified operations
may share one approval. Token exchange is not a data write. If a write happens
without approval, say so and offer a reversal where possible.

## Project context

Before any project-scoped suggestion or analysis, even about a single item,
load `GET /api/v1/project/context?projectId=<uuid>` (reuse it within the task
if still current). Account for its description, roles, entities and fields,
features, and releases, and explain material influences such as existing
capabilities, data-model constraints, and release scope. Add focused reads only
for what it lacks.

Context endpoints are `GET /api/v1/<resource>/context` and return Markdown:

| Resource | Parameter   | Contents                                                                  |
| -------- | ----------- | ------------------------------------------------------------------------- |
| Project  | `projectId` | Description, brief, roles, entities and fields, features, epics, releases |
| Epic     | `epicId`    | Epic, its features, and their requirements                                |
| Feature  | `featureId` | Feature and its requirement descriptions                                  |
| Release  | `releaseId` | Release, its features, and their requirements                             |

Use `cli.getContext()` / `cli.printContext()`. Context gives each listed item's
name and UUID (project, roles, entities, entity fields, epics, features,
releases, and requirements), usable directly in API calls. Project context
also gives feature refs and epic and release slugs; context has no requirement
refs, statuses, `webUrl`s, or timestamps. Project context omits deprecated
entities, epic and feature context omit deprecated requirements, and release
context includes them.

## Requirements

**Authoring.** Before drafting, reviewing, or improving any requirement, read
[requirement authoring](references/requirement-authoring.md) and label each
proposal with its formulation type and source. The create and
description-update scripts require `--formulation` and check only sentence
structure; judge meaning and testability yourself.

**Releases.** Before suggesting or creating a requirement, list the releases
from project context (no separate request) and ask which release number to use;
resolve it to its UUID. If none matches, ask whether to create that release or
leave the requirement unassigned. Omit `releaseId` only when the project has no
releases or the user explicitly confirms no release; that confirmation is
separate from write confirmation. Present suggestions only after the user
answers, and include the release number with each.

**Changes.** For an update, show the stored and proposed descriptions side by
side with the ref and `webUrl` link, and apply only after acceptance. Before
changing meaning, scope, type, acceptance criteria, or feature, check the
current release. If it is shipped, create a replacement in an unshipped release
and mark the old requirement `Deprecated` with the new one as its replacement
(`replacementRequirementId`)<!-- REQ 16.4 -->; otherwise edit in place, or delete if the user
wants it removed. Status, test coverage (`automatedTestCoverageType`), and
replacement updates may always be made in place.

**Length.** `description` is limited to 300 characters. The requirement scripts
move overflow to the start of `notes` via `cli.splitDescription()`; direct API
callers must do the same. Show the resulting body in the write confirmation.

**Consistency.** To check a project's requirements against each other and
against its roles, entities, and releases (contradictions, duplicates, or a
review of the spec as a whole), follow
[consistency](references/consistency.md).

## Linked repositories

A repository is linked when a committed `.spechub.json` exists at or above the
working directory; the nearest one wins, so monorepo packages can link
different projects. It holds `version`, `apiUrl`, and `projectId`, and never
credentials. At the start of work in a repository, run
`./scripts/show-link.js <repo-path>` to find and verify the link. It prints the
project's current name, slug, and UUID and the local instance whose URL matches
`apiUrl`. Use that project for all project-scoped work and pass `--instance` to
every script; ask before using another project. Report an unmatched instance or
a project the instance cannot see rather than guessing. Link a repository with
`./scripts/link-project.js` only when the user asks. Writing the file is a local
change, not a data write.

In a linked repository, inspect the changed code and nearby requirement
references. After a code change, compare the new behavior with the project's
requirements and proactively suggest additions or updates under the rules
above, including test coverage when tests for a requirement are added or
removed<!-- REQ 6.6 -->. After accepted writes, add the refs near the implementing code in a
comment, each prefixed with `REQ` (e.g. `// REQ 1.23, REQ 2.4`), without
restating the code. Include known refs in commit messages the same way (e.g.
`Refs: REQ 1.23, REQ 2.4`); never invent refs or block a commit when none
applies.

To compare a linked repository's implementation with its requirements (a
reconciliation, audit, or spec-versus-code review), follow
[reconciliation](references/reconciliation.md).

## Reads and identifiers

- API calls take UUIDs. Resolve project slugs with `resolveProjectSlug()` and
  requirement/entity refs with `resolveRequirement()` / `resolveEntity()`.
- In output, lead with refs (`1.23`, feature `4`) and link each object's
  `webUrl` with its ref or name as text. If `webUrl` is missing, fetch detail
  when practical; never invent URLs. Show UUIDs only when needed.
- Prefer context for overviews and server-side filters (e.g. `refs=1.23,2.45`)
  for structured reads; avoid whole-project fetches and per-item detail loops.
  Run independent reads concurrently; use `fetchAll()` for complete lists.
- List items omit notes, source, acceptance criteria, replacements, and entity
  fields; fetch detail when needed. Deprecated requirements/entities are
  excluded unless `includeDeprecated=true`.
- Epics, features, and requirements carry external references: documentation,
  test, implementation, and other links, plus SpecHub-managed Figma and
  replacement links. Read them only when a task needs them.

## Setup and execution

Requires Node.js 18+ and a SpecHub personal access token. Run scripts from this
directory (`npm install` first if needed). Every script accepts
`--instance <name>`; otherwise the instance comes from `SPECHUB_INSTANCE`, the
default in `instances.json`, then `SPECHUB_PAT` / `SPECHUB_API_URL`. PATs are
stored in plaintext in gitignored `instances.json`; never expose or commit them.
Never ask for a PAT in the conversation or pass one with `--pat`; ask the user
to run `./scripts/add-instance.js` in their own terminal.

Read only the reference the task needs:

- [Commands](references/commands.md): script arguments, direct API usage, and
  `lib/cli.js` helpers.
- [API](references/api.md): endpoints, bodies, filters, entity fields,
  responses, and errors.

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

## Agent guides

SpecHub serves the rules and procedures that every SpecHub agent follows, as
guides. At the start of a task, list them with `./scripts/get-guide.js`, then
read each guide whose description matches the task with
`./scripts/get-guide.js <name>` before acting<!-- REQ 18.3 -->. Read a guide once per task. In
particular, read `requirement-authoring` before drafting, reviewing, or
improving any requirement<!-- REQ 14.13 -->, and `requirement-changes` before proposing any
data write. If the instance does not serve guides, say so and follow only the
rules in this file<!-- REQ 18.4 -->.

Guides name capabilities, not scripts. In this skill:

| Guide term                        | In this skill                                                                                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| project context                   | `./scripts/get-project-context.js <project>` or `cli.getContext()` (see [Project context](#project-context))   |
| feature, epic, or release context | `./scripts/get-{feature,epic,release}-context.js <uuid>`                                                       |
| reading requirements in full      | `./scripts/export-requirements.js <project> [filters] --output <file>`, saved to a temporary directory         |
| requirement detail                | `./scripts/get-requirement.js <project> <ref-or-uuid>`                                                         |
| entity detail                     | `GET /api/v1/entity/{id}`; `./scripts/get-entity.js` omits field options, defaults, and validations            |
| project search                    | `./scripts/search-project.js <project> <keywords> [--type requirement]`                                        |
| standardization                   | `./scripts/standardize-requirements.js <project> <draft>...`, at most 20 per run<!-- REQ 14.8, REQ 14.9, REQ 14.10 --> |
| write confirmation                | [Write confirmation](#write-confirmation) below                                                                |
| the repository                    | The linked repository (see [Linked repositories](#linked-repositories))                                         |
| a link to an item                 | The item's `webUrl`                                                                                            |

## Write confirmation

Before each data write (POST, PATCH, PUT, DELETE), wait for explicit approval.
In addition to what the `requirement-changes` guide requires, show:

- Method, endpoint path, and instance name and URL.
- Complete JSON body; for PATCH, the changed fields.
- The exact command, when using a script. Scripts write immediately, so
  confirm **before running them**.

Token exchange and requirement standardization
(`POST .../requirements/standardize`) are not data writes<!-- REQ 12.8 -->.

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

The guides set the rules for drafting and changing requirements. In this
skill:

- The create and description-update scripts require `--formulation` and check
  only sentence structure; judge meaning and testability yourself.
- Ask for a release by its number and resolve it to its UUID from project
  context, with no separate request. Omit `releaseId` for no release.
- Replace a requirement in a shipped release with a new one, and set
  `replacementRequirementId` on the old one when marking it `Deprecated`<!-- REQ 16.4 -->.
- A requirement `description` holds at most 300 characters. The requirement
  scripts move overflow to the start of `notes` via `cli.splitDescription()`;
  direct API callers must do the same.

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
applies. Use the `feat` commit type only for work that adds a new feature to
the SpecHub project; use `change` for work that adds or updates requirements
in an existing feature<!-- REQ 6.7, REQ 6.8 -->.

## Audits

The `consistency` and `reconciliation` guides define these read-only audits<!-- REQ 6.5, REQ 12.7 -->.
In this skill:

- Identify the project and instance with `./scripts/show-link.js <repo-path>`;
  outside a linked repository, ask which project to check. Reconcile only a
  linked repository.
- For a consistency check, export the whole project without filters, since
  requirements in scope are compared with every active requirement. For a
  reconciliation, export the requirements in scope.
- Keep exports and working files in a temporary directory, not the
  repository.
- Lead the report with the project and instance; for a reconciliation, give
  the commit as `git rev-parse --short HEAD` and locations as
  repository-relative `path:line`.
- Report in the conversation; for a long report, offer to save it to a file.
- Code fixes follow the linked-repository rules above, including `REQ`
  comments.

## Reads and identifiers

- API calls take UUIDs. Resolve project slugs with `resolveProjectSlug()` and
  requirement/entity refs with `resolveRequirement()` / `resolveEntity()`.
- When a message gives a SpecHub web URL, or a ref whose UUID or type you
  need, get it with `./scripts/resolve.js <url>` or
  `resolve.js <project> <ref>`: one request, instead of parsing the URL or
  reading lists. It also prints the object's type (a ref may be a feature,
  requirement, or entity) and project. Scripts that take `<ref-or-uuid>`
  resolve refs themselves; pass refs to them directly<!-- REQ 8.11 -->.
- In output, lead with refs (`1.23`, feature `4`) and link each object's
  `webUrl` with its ref or name as text. If `webUrl` is missing, fetch detail
  when practical; never invent URLs. Show UUIDs only when needed.
- Prefer context for overviews and server-side filters (e.g. `refs=1.23,2.45`)
  for structured reads; avoid whole-project fetches and per-item detail loops.
  Run independent reads concurrently; use `fetchAll()` for complete lists.
- To explore a project, such as finding the items related to a task or a
  code change, search first with
  `./scripts/search-project.js <project> <keywords>`: one request across
  epics, features, requirements, releases, and discussions replaces paging
  lists and reading details. Results include deprecated requirements without
  marking them and report entities as requirements; search does not match
  refs, so resolve those instead<!-- REQ 8.15 -->.
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

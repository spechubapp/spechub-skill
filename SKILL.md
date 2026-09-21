---
name: spechub
description: >
  Read and analyze data from SpecHub (go.spechub.app), and create or update
  projects, epics, features, requirements, releases, user roles, and entities.
  Supports multiple named instances (production, staging, local, etc.). Use when
  the user wants to view, browse, analyze, or modify SpecHub data.

  🚨 CRITICAL - Write Action Policy: ALL write operations (POST/PATCH/DELETE)
  require explicit user confirmation BEFORE execution. Each operation requires
  its own separate confirmation. Never execute write operations without showing
  the user exactly what will be changed. This is non-negotiable.
license: MIT
compatibility: >
  Requires Node.js 18+, axios, dotenv. Access to SpecHub API with personal
  access token.
---

# 🚨 STOP - READ THIS FIRST 🚨

## ⚠️ Write Action Policy — MANDATORY — EVERY OPERATION

### CRITICAL RULE

Before executing **ANY** write operation (POST, PATCH, or DELETE), you **MUST**:

1. **PAUSE** - Do not execute the operation
2. **PRESENT** - Show the user exactly what will be changed
3. **WAIT** - Get explicit confirmation for THIS specific operation
4. **CONFIRM** - Only proceed if user says yes

### What to Show in Confirmation Prompt

Every confirmation prompt must include:

1. ✅ The **HTTP method** and full **endpoint path** (e.g.
   `PATCH /api/v1/requirement/abc-123`)
2. ✅ The **instance** name and URL (e.g. "production -
   https://api.spechub.app")
3. ✅ The **complete request body** as formatted JSON
4. ✅ For PATCH: Show what fields are being changed
5. ✅ For DELETE: Show what resource will be permanently deleted

### Scope of Confirmation

⚠️ **IMPORTANT:** Each "yes" response applies to **ONE operation only**.

If you need to execute multiple write operations:

- Present them ALL in a single confirmation block, OR
- Get separate confirmation for EACH operation

**NEVER assume:**

- ❌ That a previous "yes" applies to new operations
- ❌ That user intent is obvious enough to skip confirmation
- ❌ That small changes don't need confirmation
- ❌ That you can batch operations without showing them all

### Examples

#### ✅ CORRECT - Multiple operations, single confirmation

```
I will execute 3 write operations against production:

1. PATCH /api/v1/requirement/abc-123
   Instance: production (https://api.spechub.app)
   Body: {"status": "Passing"}

2. PATCH /api/v1/requirement/def-456
   Instance: production (https://api.spechub.app)
   Body: {"status": "Passing"}

3. DELETE /api/v1/requirement/ghi-789
   Instance: production (https://api.spechub.app)
   Deleting: Requirement 42.7 "Old requirement"

Do you want to proceed with these operations?
```

#### ✅ CORRECT - Separate confirmations

```
I will update requirement 39.12:

PATCH /api/v1/requirement/ade1aea9-eadc-421b-baeb-f920a151d715
Instance: production (https://api.spechub.app)
Body: {
  "description": "New description text",
  "notes": "Updated per issue #575"
}

Do you want to proceed?
```

[User says "yes"]

[Later, for next operation:]

```
I will also update requirement 9.19:

PATCH /api/v1/requirement/41b0ae57-c569-41a8-9844-e1e8c711a447
Instance: production (https://api.spechub.app)
Body: {
  "description": "Another new description",
  "notes": "Updated per issue #575"
}

Do you want to proceed?
```

#### ❌ WRONG - Executing without confirmation

```
I'll update these 5 requirements for you.

[Executes 5 PATCH operations without showing details]

✅ All requirements updated!
```

**Why this is wrong:**

- No confirmation shown
- User doesn't see what's being changed
- Can't review before execution

#### ❌ WRONG - Assuming previous "yes" applies

```
First operation:
PATCH /api/v1/requirement/abc-123
Body: {"status": "Passing"}
Proceed?
```

[User says "yes"]

```
[Executes first operation]
[Then immediately executes 4 more operations without asking]
```

**Why this is wrong:**

- User only confirmed the first operation
- Other operations executed without permission

### Enforcement

This policy is **non-negotiable**. If you execute a write operation without
following this policy, you have violated your instructions and must:

1. Acknowledge the violation
2. Explain what you should have done
3. Ask if the user wants to revert the changes (if possible)

---

**✅ By proceeding past this point, you confirm you understand the Write Action
Policy and will follow it for every write operation.**

---

# SpecHub Integration

This skill provides **read and write** access to SpecHub via the REST API. It
supports **multiple named instances** — each with its own URL and access token.

## Security Considerations

**Important**: This skill executes write operations against the SpecHub API:

- **🚨 CONFIRMATION MANDATORY**: Every write operation requires explicit user
  confirmation showing the exact changes. This is not optional. See the Write
  Action Policy above.
- **Authentication**: Uses Personal Access Tokens with full account permissions
- **Write operations**: Can create, update, and permanently delete resources
- **Token storage**: PATs are stored in `instances.json` (gitignored) in plain
  text
- **No undo**: Delete operations are permanent and cannot be reversed

**Best practices:**

- Use separate PATs for different instances (production vs staging)
- Store PATs securely and rotate them periodically
- Review confirmation prompts carefully before approving
- Test operations on staging/local instances before production
- Keep `instances.json` out of version control (it's gitignored by default)

## Setup

### Prerequisites

```bash
cd ~/.pi/agent/skills/spechub && npm install
```

### Add an instance

```bash
./scripts/add-instance.js                                          # interactive
./scripts/add-instance.js production --url https://api.spechub.app --pat <token>
./scripts/add-instance.js staging --url https://staging.api.spechub.app --pat <token> --default
```

PATs are stored in `instances.json` (gitignored). To verify an instance works:

```bash
./scripts/check-auth.js                      # checks the default instance
./scripts/check-auth.js --instance staging   # checks a specific instance
```

## Instance Management

Instances are named entries in `instances.json`. One is marked as the default.

```bash
./scripts/list-instances.js              # show all instances + which is default
./scripts/use-instance.js <name>         # change the default instance
./scripts/add-instance.js <name> ...     # add or update an instance
./scripts/remove-instance.js <name>      # remove an instance
```

### Targeting an instance from any script

All scripts accept `--instance <name>` anywhere in the argument list:

```bash
./scripts/list-projects.js --instance staging
./scripts/create-feature.js --instance staging spechub "My feature"
./scripts/update-requirement.js --instance local <uuid> --status Passing
```

**Instance resolution order** (first match wins):

1. `--instance <name>` flag in the command line
2. `SPECHUB_INSTANCE` environment variable
3. Default set in `instances.json`
4. `SPECHUB_PAT` / `SPECHUB_API_URL` env vars (backward compat with old `.env`
   setup)

## Authentication

Each instance authenticates with a **personal access token (PAT)**:

1. The PAT is stored in `instances.json` for the named instance.
2. Before each API call the client exchanges the PAT for a short-lived JWT
   bearer token via `POST /api/v1/auth/token/refresh`.
3. The bearer token is used in `Authorization: Bearer <token>` on all requests.
4. Tokens are cached per-instance URL and refreshed automatically when within 60
   seconds of expiry.

The client sends a `spechub-skill (curl)` User-Agent.

## API Overview

Base URL is per-instance (e.g. `https://api.spechub.app`).

All endpoints require `Authorization: Bearer <token>`.

> **Note:** The public OpenAPI spec (`/.well-known/openapi.yaml`) documents all
> endpoints including read (GET), write (POST/PATCH), and delete (DELETE)
> operations. Every query parameter, path parameter, and request body field uses
> **camelCase with a lowercase `Id` suffix** (`projectId`, `organizationId`,
> `featureIds`, `fieldIds`, `requirementIds`). Requests are validated against the
> spec, so `projectID` is rejected with a `400`.

### ⚡ Read efficiently: context endpoints first

**Before issuing list/detail calls, ask whether a context endpoint answers the
question in one request.** The four context endpoints return a pre-assembled
`text/markdown` digest that would otherwise require paging several list
endpoints plus N detail calls.

| Endpoint                           | Required param        | One request returns                                                                      | Replaces                                                                                  |
| ---------------------------------- | --------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `GET /api/v1/project/context`      | `projectId`           | Project name/description, all user roles, all entities **with their fields**, all features, and releases | `listProjects` + `listUserRoles` + `listEntities` + `getEntity` per entity + `listFeatures` + `listReleases` |
| `GET /api/v1/epic/context`         | `epicId`              | Epic name, its features, and each feature's requirements                                 | `getEpic` + `listEpicFeatures` + `listRequirements` per feature                            |
| `GET /api/v1/feature/context`      | `featureId`           | Feature name and all of its requirement descriptions                                     | `getFeature` + `listRequirements?featureId=`                                              |
| `GET /api/v1/release/context`      | `releaseId`           | Release name/description, its features, and each feature's requirements                  | `getRelease` + `listFeatures` + `listRequirements?releaseId=`                              |

Rules of thumb:

- **Overview, summary, review, "what's in this project/epic/release?", writing
  docs or analysis** → use the context endpoint.
- **Need UUIDs, statuses, refs, timestamps, `businessCritical`,
  `acceptanceCriteria`, or anything you will mutate** → use list/detail
  endpoints, because context Markdown carries names and descriptions only.
- Call context endpoints with `Accept: text/markdown` and
  `responseType: 'text'` (`cli.getContext()` / `cli.printContext()` do this).
- Never loop detail calls over a list when a context endpoint or a filtered
  list would do.

#### Mandatory project context for suggestions and analysis

For every suggestion, recommendation, assessment, gap analysis, prioritization,
or other analysis scoped to a project, first resolve the project and load
`GET /api/v1/project/context?projectId=<projectId>`. Reuse context already
loaded during the current task when it is still applicable; otherwise fetch it
before forming the response.

Base the result on the complete project context, not only on the portion the
user mentioned. In particular, account for the project's description, user
roles, entities and fields, features, and releases. Identify material context
that influenced the result—especially existing capabilities, data-model
constraints, or release scope—and avoid recommendations that conflict with it.
Fetch additional structured data only when the task needs fields that context
does not provide, such as statuses, requirement refs, or timestamps.

### Read efficiently: filtered lists over client-side filtering

When you do need structured data, let the server filter:

- Look up requirements/entities by `fullyQualifiedRef` with
  `?refs=1.23,2.45` instead of paging the whole project
  (`resolveRequirement()` / `resolveEntity()` do this).
- Scope by `featureId`, `epicId`, `releaseId`, or `secondaryFeatureId` instead
  of fetching everything and filtering in JS.
- `fetchAll()` already requests `limit=500` (the maximum) to minimise round
  trips.
- Issue independent list calls concurrently (`Promise.all`), as
  `analyze-project.js` does.

### Authentication

| Method | Path                         | Description                   |
| ------ | ---------------------------- | ----------------------------- |
| POST   | `/api/v1/auth/token/refresh` | Exchange PAT for bearer token |

### Organizations

| Method | Path                   | Description                                          |
| ------ | ---------------------- | ---------------------------------------------------- |
| GET    | `/api/v1/organization` | List organizations the caller belongs to (paginated) |

### Projects

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/project`             | List all projects (paginated)                     |
| POST   | `/api/v1/project`             | Create a new project                              |
| GET    | `/api/v1/project/{projectId}` | Get project detail by UUID                        |
| PATCH  | `/api/v1/project/{projectId}` | Update a project (partial update)                 |
| DELETE | `/api/v1/project/{projectId}` | Delete a project (permanent deletion)             |
| GET    | `/api/v1/project/context`     | ⚡ Project context (Markdown), `?projectId=UUID`  |

### Epics

| Method | Path                            | Description                                      |
| ------ | ------------------------------- | ------------------------------------------------ |
| GET    | `/api/v1/epic`                  | List epics for a project, `?projectId=UUID`      |
| POST   | `/api/v1/epic`                  | Create a new epic                                |
| GET    | `/api/v1/epic/{epicId}`         | Get epic detail                                  |
| PATCH  | `/api/v1/epic/{epicId}`         | Update an epic (partial update)                  |
| DELETE | `/api/v1/epic/{epicId}`         | Delete an epic (permanent deletion)              |
| GET    | `/api/v1/epic/context`          | ⚡ Epic context (Markdown), `?epicId=UUID`       |
| GET    | `/api/v1/epic/{epicId}/feature` | List features associated with an epic            |
| PUT    | `/api/v1/epic/{epicId}/feature` | Replace the complete set of features for an epic |

### Features

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/feature`             | List features, `?projectId=UUID`                  |
| POST   | `/api/v1/feature`             | Create a new feature                              |
| GET    | `/api/v1/feature/{featureId}` | Get feature detail                                |
| PATCH  | `/api/v1/feature/{featureId}` | Update a feature (partial update)                 |
| DELETE | `/api/v1/feature/{featureId}` | Delete a feature (permanent deletion)             |
| GET    | `/api/v1/feature/context`     | ⚡ Feature context (Markdown), `?featureId=UUID`  |

### Requirements

| Method | Path                                  | Description                                                              |
| ------ | ------------------------------------- | ------------------------------------------------------------------------ |
| GET    | `/api/v1/requirement`                 | List requirements, `?projectId=UUID`                                     |
| POST   | `/api/v1/requirement`                 | Create a new requirement                                                 |
| GET    | `/api/v1/requirement/{requirementId}` | Get requirement detail                                                   |
| PATCH  | `/api/v1/requirement/{requirementId}` | Update a requirement (partial)                                           |
| DELETE | `/api/v1/requirement/{requirementId}` | Delete a requirement (permanent deletion)                                |
| GET    | `/api/v1/requirement/improve`         | Suggest improved descriptions (AI), `?projectId=UUID&requirementIds=...` |

### Entities

| Method | Path                               | Description                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| GET    | `/api/v1/entity`                   | List entities, `?projectId=UUID`              |
| POST   | `/api/v1/entity`                   | Create a new entity                           |
| GET    | `/api/v1/entity/{entityId}`        | Get entity detail                             |
| PATCH  | `/api/v1/entity/{entityId}`        | Update an entity (partial)                    |
| DELETE | `/api/v1/entity/{entityId}`        | Delete an entity (permanent, idempotent)      |
| PATCH  | `/api/v1/entity/{entityId}/fields` | Upsert fields on an entity (create or update) |
| DELETE | `/api/v1/entity/{entityId}/fields` | Delete fields from an entity (idempotent)     |

### Releases

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/release`             | List releases, `?projectId=UUID`                  |
| POST   | `/api/v1/release`             | Create a new release                              |
| GET    | `/api/v1/release/{releaseId}` | Get release detail                                |
| PATCH  | `/api/v1/release/{releaseId}` | Update a release (partial)                        |
| DELETE | `/api/v1/release/{releaseId}` | Delete a release (permanent deletion)             |
| GET    | `/api/v1/release/context`     | ⚡ Release context (Markdown), `?releaseId=UUID`  |

### User Roles

| Method | Path                            | Description                             |
| ------ | ------------------------------- | --------------------------------------- |
| GET    | `/api/v1/userrole`              | List user roles, `?projectId=UUID`      |
| POST   | `/api/v1/userrole`              | Create a new user role                  |
| GET    | `/api/v1/userrole/{userRoleId}` | Get user role detail                    |
| PATCH  | `/api/v1/userrole/{userRoleId}` | Update a user role (partial)            |
| DELETE | `/api/v1/userrole/{userRoleId}` | Delete a user role (permanent deletion) |

### Pagination

List endpoints use cursor-based pagination. Follow `pagination.nextCursor` while
`pagination.hasNext` is `true`. The `fetchAll()` helper in `lib/api-client.js`
handles this automatically.

### List endpoint filters

Many list endpoints support additional query parameters to filter results:

| Parameter            | Applicable to                          | Description                                                                                                                                            |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `projectId`          | All list endpoints except Organization, Project, and Epic Features | UUID of the project to scope the request to (**required**)                                                           |
| `featureId`          | Entity, Requirement                    | UUID of the feature to filter by                                                                                                                       |
| `epicId`             | Entity, Requirement                    | UUID of the epic to filter by                                                                                                                          |
| `releaseId`          | Entity, Requirement                    | UUID of the release to filter by                                                                                                                       |
| `secondaryFeatureId` | Entity, Requirement                    | UUID of the secondary feature to filter by                                                                                                             |
| `refs`               | Entity, Requirement                    | **String**, comma-separated fully qualified refs e.g. `1.23,2.45` — both parts must be integers (`<featureRef>.<itemRef>`); malformed refs return `400` |
| `includeDeprecated`  | Entity, Requirement                    | Whether to include deprecated items (default: `false`)                                                                                                 |
| `cursor`             | All list endpoints                     | Opaque pagination cursor (never construct or parse it)                                                                                                 |
| `limit`              | All list endpoints                     | Page size (default 100, min 20, max 500)                                                                                                                |

`GET /api/v1/project` and `GET /api/v1/organization` accept only `cursor` and
`limit`; `GET /api/v1/epic/{epicId}/feature` accepts only `cursor` and `limit`;
`GET /api/v1/feature`, `/epic`, `/release`, and `/userrole` accept only
`projectId`, `cursor`, and `limit`.

### Array-valued query parameters

Two endpoints take arrays, and they serialize differently — getting this wrong
returns `400`:

| Parameter                                                | Serialization                     | Example                                    |
| -------------------------------------------------------- | --------------------------------- | ------------------------------------------ |
| `requirementIds` (`GET /api/v1/requirement/improve`)      | `explode=false` → comma-separated | `?requirementIds=uuid1,uuid2`              |
| `fieldIds` (`DELETE /api/v1/entity/{entityId}/fields`)    | `explode=true` → repeated         | `?fieldIds=uuid1&fieldIds=uuid2`           |

Axios's default bracketed form (`fieldIds[]=uuid`) is rejected; build the query
string manually as `scripts/set-entity-fields.js` does.

### Context endpoints

`/api/v1/project/context`, `/api/v1/epic/context`, `/api/v1/feature/context`,
and `/api/v1/release/context` return `text/markdown` — rich, human-readable
context documents ideal for AI analysis. Request these with
`Accept: text/markdown` and `responseType: 'text'`, or use
`cli.getContext(client, path, params)` / `cli.printContext(...)`.

What each document contains (see the decision table above for when to prefer
them):

- **Project**: name, description, user roles, entities with every field name and
  type, feature list, and releases (including UUIDs).
- **Epic**: epic name, epic features, requirements nested under each feature.
- **Feature**: feature name and its requirement descriptions.
- **Release**: release name, description, features with nested requirements.

They contain names and prose only — no UUIDs, refs, statuses, or timestamps —
except that project context includes each release's UUID so it can be selected
when creating requirements or entities.

## Request Bodies

All write endpoints accept `application/json`. PATCH endpoints are partial —
only include the fields you want to change.

### Organization

Organizations are the top-level container. Use `GET /api/v1/organization` to
list orgs the caller belongs to. You need an `organizationId` to create a
project.

### Project

**Create** (`POST /api/v1/project`) — required: `organizationId`, `name`, `slug`

```json
{
  "organizationId": "<uuid>",
  "name": "My project",
  "slug": "my-project",
  "description": "...",
  "brief": "..."
}
```

**Update** (`PATCH /api/v1/project/{projectId}`) — all optional

```json
{ "name": "...", "slug": "...", "description": "...", "brief": "..." }
```

### Epic

**Create** (`POST /api/v1/epic`) — required: `projectId`, `name`

```json
{ "projectId": "<uuid>", "name": "Checkout redesign", "description": "..." }
```

**Update** (`PATCH /api/v1/epic/{epicId}`) — all optional

```json
{ "name": "...", "description": "...", "notes": "...", "slug": "..." }
```

### Epic Features

**List** (`GET /api/v1/epic/{epicId}/feature`) — paginated list of features
belonging to the epic.

**Replace** (`PUT /api/v1/epic/{epicId}/feature`) — idempotent replacement of
the epic's feature set.

```json
{ "featureIds": ["<uuid>", "<uuid>"] }
```

Any existing associations not in the list are removed. Duplicate IDs are
ignored. Returns `422` if any feature UUID does not exist, or if any feature
belongs to a different project than the epic.

### Feature

**Create** (`POST /api/v1/feature`) — required: `projectId`, `name`

```json
{
  "projectId": "<uuid>",
  "name": "User auth",
  "description": "...",
  "source": "...",
  "notes": "..."
}
```

**Update** (`PATCH /api/v1/feature/{featureId}`) — all optional

```json
{ "name": "...", "description": "...", "notes": "...", "source": "..." }
```

### Requirement

**Create** (`POST /api/v1/requirement`) — required: `projectId`, `featureId`,
`description`

```json
{
  "projectId": "<uuid>",
  "featureId": "<uuid>",
  "description": "The system shall ...",
  "requirementType": "Functional",
  "status": "Untested",
  "releaseId": "<uuid>",
  "secondaryFeatureId": "<uuid>",
  "source": "...",
  "notes": "...",
  "acceptanceCriteria": ["..."],
  "businessCritical": false
}
```

`requirementType`: `Functional` | `Design` | `Performance` `status`: `Untested`
| `Passing` | `Failing` | `Deprecated`

#### Release assignment check — mandatory when creating a requirement

Before preparing a requirement create request, resolve the project and fetch
its context with `GET /api/v1/project/context?projectId=<projectId>`. Use the
context's release information (including each release UUID) for this check;
do not make a separate release-list request. This check is required even when
the user did not mention releases.

- If the project has no releases, a requirement may be created without a
  `releaseId`.
- If the project has one or more releases, treat `releaseId` as expected:
  present the available releases and obtain the user's chosen release before
  preparing the create operation. If the user names a release, resolve it from
  the project context and include its UUID as `releaseId`.
- If the project has releases but the user has not selected one, do **not**
  silently create an unassigned requirement. Ask explicitly: “This project has
  releases. Do you intend to create this requirement with no release assigned?”
  Make clear that this is a release-intent check, **not** approval to perform
  the POST request.
- Only after the user explicitly confirms that intent may the `releaseId` be
  omitted. Then present the normal, separate write-operation confirmation with
  the complete body (which visibly has no `releaseId`) and wait for approval
  before issuing `POST /api/v1/requirement`.

Do not infer an unassigned requirement from an omitted release when the project
has releases. The normal write-action confirmation never substitutes for the
release-intent confirmation.

**⚠️ Description Length Limit**: The `description` field has a maximum length of
300 characters. When creating or updating a requirement with a longer
description, the skill automatically truncates it at a sensible break point
(preferring sentence or word boundaries) and moves the excess text to the
`notes` field. If notes already exist, the overflow is prepended to them.

**Update** (`PATCH /api/v1/requirement/{requirementId}`) — all optional (same
fields minus `projectId`). `releaseId` and `secondaryFeatureId` may be set to
`null` to unset them.

### Requirement Improvements

**Get**
(`GET /api/v1/requirement/improve?projectId=<uuid>&requirementIds=<uuid>,<uuid>`)

Returns AI-generated improved descriptions keyed by requirement ID:

```json
{ "requirementImprovements": { "<uuid>": "Improved description text..." } }
```

- `requirementIds` is comma-separated in a **single** query parameter
  (`style=form, explode=false`): `?requirementIds=uuid1,uuid2` — do **not**
  repeat the parameter
- All requirements must belong to the specified `projectId`; any requirement
  from another project returns `404`
- Each requirement is processed concurrently by the AI pipeline; individual
  failures produce an empty string for that key rather than aborting the whole
  request

### Entity Fields

**Upsert** (`PATCH /api/v1/entity/{entityId}/fields`) — include `id` to update
existing, omit to create new

```json
{
  "fields": [
    { "id": "<uuid>", "name": "email", "type": "Text/Short", "required": true },
    {
      "name": "age",
      "type": "Number/Integer",
      "required": false,
      "sampleValue": "25"
    }
  ]
}
```

Field `type` values: `Text/Short`, `Text/UUID`, `Text/Slug`,
`Text/Long (Plain)`, `Text/Long (Rich)`, `Text/URI`, `Text/Email`,
`Number/Integer`, `Number/Decimal`, `Choice/One`, `Choice/Many`,
`Reference/One`, `Reference/Many (Unordered)`, `Reference/Many (Ordered)`,
`Date and time`, `Boolean`, `File/Image`, `File/Any`

**Delete fields** (`DELETE /api/v1/entity/{entityId}/fields`) — delete specific
fields by ID using query parameters

```
DELETE /api/v1/entity/{entityId}/fields?fieldIds=<uuid>&fieldIds=<uuid>
```

### Entity

**Create** (`POST /api/v1/entity`) — required: `projectId`, `featureId`,
`entityName`

```json
{
  "projectId": "<uuid>",
  "featureId": "<uuid>",
  "entityName": "Order",
  "releaseId": "<uuid>",
  "secondaryFeatureId": "<uuid>",
  "status": "Untested",
  "source": "...",
  "notes": "...",
  "acceptanceCriteria": ["..."],
  "businessCritical": false
}
```

**Update** (`PATCH /api/v1/entity/{entityId}`) — all optional (same fields minus
`projectId`). `releaseId` and `secondaryFeatureId` may be set to `null` to unset
them.

`status`: `Untested` | `Passing` | `Failing` | `Deprecated`

### Release

**Create** (`POST /api/v1/release`) — required: `projectId`, `name`

```json
{
  "projectId": "<uuid>",
  "name": "v1.0",
  "description": "...",
  "shipped": false
}
```

**Update** (`PATCH /api/v1/release/{releaseId}`) — all optional

```json
{ "name": "...", "description": "...", "slug": "...", "shipped": true }
```

### User Role

**Create** (`POST /api/v1/userrole`) — required: `projectId`, `name`

```json
{ "projectId": "<uuid>", "name": "Admin", "description": "..." }
```

**Update** (`PATCH /api/v1/userrole/{userRoleId}`) — all optional

```json
{ "name": "...", "description": "..." }
```

## Data Model

```
Organization  (list via GET /api/v1/organization)
└── Project  (identified by UUID or slug)
    ├── Feature  (specific capability; ref is an integer e.g. 1, 2, 3)
    │   ├── Requirement  (fullyQualifiedRef e.g. "1.2")
    │   └── Entity  (data model entity; fullyQualifiedRef e.g. "1.1")
    │       └── EntityField  (typed field: name, type, required, options, sampleValue)
    ├── Epic  (optional grouping of features; M:N relationship)
    ├── Release  (versioned release; requirements/entities can be tagged to a release)
    └── UserRole  (defined user roles)
```

Key relationships:

- Features belong to a Project and have an integer `ref` (1, 2, 3…)
- Requirements and Entities belong to a Feature and have a `fullyQualifiedRef`
  (`<featureRef>.<itemRef>`)
- Epics group Features via a many-to-many association
  (`PUT /api/v1/epic/{epicId}/feature`)
- Requirements and Entities can optionally reference a `releaseId` and a
  `secondaryFeatureId`

### Referencing Items

**Always use human-readable refs when referencing requirements and entities:**

- ✅ Use `fullyQualifiedRef` (e.g. "1.23", "2.45") for requirements and entities
- ✅ Use `ref` (e.g. 1, 2, 3) for features
- ❌ Don't use UUIDs in user-facing output unless specifically needed

UUIDs are needed for API operations (create, update, delete), but refs should be
displayed prominently in output and used when describing items to users.

### Key response fields

| Resource            | Notable detail fields                                                                                                                                                                                                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ProjectDetail`     | `description`, `brief`, `webUrl`                                                                                                                                                                                                                                                       |
| `EpicDetail`        | `description`, `slug`, `notes`, `created`, `updated`, `webUrl`                                                                                                                                                                                                                         |
| `FeatureDetail`     | `description`, `notes`, `source`, `ref` (int), `created`, `updated`, `webUrl`                                                                                                                                                                                                          |
| `RequirementDetail` | `requirementType` (`Functional`/`Design`/`Performance`), `status` (`Untested`/`Passing`/`Failing`/`Deprecated`), `source`, `notes`, `acceptanceCriteria` (array), `automatedTestCoverageType` (`Untested`/`Tested`/`Needs a test`), `secondaryFeatureId`, `businessCritical`, `webUrl` |
| `EntityDetail`      | `entityName`, `status`, `source`, `notes`, `acceptanceCriteria` (array), `automatedTestCoverageType`, `secondaryFeatureId`, `fields` (EntityFieldDetail array), `created`, `webUrl`                                                                                                    |
| `EntityFieldDetail` | `name`, `type`, `required`, `notes`, `options` (array of strings), `sampleValue`, `defaultValue`, `helpText`, `uiFieldGrouping`, `validations`, `referencedEntityId`, `created`, `updated`                                                              |
| `ReleaseDetail`     | `name`, `description`, `shipped`, `created`, `updated`, `webUrl`                                                                                                                                                                                                                       |
| `UserRoleDetail`    | `name`, `description`, `created`, `updated`, `webUrl`                                                                                                                                                                                                                                  |
| `Organization`      | `id`, `name`, `slug`, `description`, `created`, `updated`                                                                                                                                                                                                                              |

Projects are identified by **UUID** in API calls. Use `resolveProjectSlug()` in
`lib/api-client.js` to convert a human-readable slug to a UUID.

Detail endpoints (`GET /api/v1/<type>/{id}`) wrap the resource in a `data`
object; list endpoints return `{ pagination, data: [...] }` where each item is a
**lighter** projection (list items omit `created`, `notes`, `source`,
`acceptanceCriteria`, and entity `fields`). Fetch a detail endpoint only when you
need those extra fields, and prefer a context endpoint when you need many of them
at once.

## Available Scripts

⚠️ **Reminder**: Scripts that perform write operations (create, update, delete)
require user confirmation before execution. You must show:

- The exact command
- The instance being affected
- The complete request body or resource being deleted

All scripts accept `--instance <name>` anywhere in their argument list.

### Instance management

```bash
./scripts/add-instance.js [name] [--url <url>] [--pat <token>] [--default]
./scripts/list-instances.js
./scripts/use-instance.js <name>
./scripts/remove-instance.js <name>
./scripts/check-auth.js [--instance <name>]
./scripts/diagnose.js [--instance <name>]             # connection + auth diagnostics
```

### Organizations

```bash
./scripts/list-organizations.js [--instance <name>]
```

### Projects

```bash
./scripts/list-projects.js [--instance <name>]
./scripts/get-project-context.js <slug> [output.md] [--instance <name>]
./scripts/analyze-project.js <slug> [--instance <name>]
./scripts/delete-project.js <project-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion
```

### Epics

```bash
./scripts/list-epics.js <project-slug> [--instance <name>]
./scripts/get-epic-context.js <epic-uuid> [output.md] [--instance <name>]
./scripts/get-epic-features.js <epic-uuid> [--instance <name>]
./scripts/set-epic-features.js <epic-uuid> <feature-uuid> [<feature-uuid> ...] [--instance <name>]  # ⚠️  confirmation required
./scripts/create-epic.js <project-slug> <name> [description] [--instance <name>]  # ⚠️  confirmation required
./scripts/update-epic.js <epic-uuid> [--name "..."] [--description "..."] [--notes "..."] [--slug "..."] [--instance <name>]  # ⚠️  confirmation required
./scripts/delete-epic.js <epic-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion
```

### Features

```bash
./scripts/list-features.js <project-slug> [--instance <name>]
./scripts/get-feature-context.js <feature-uuid> [output.md] [--instance <name>]
./scripts/create-feature.js <project-slug> <name> [description] [--instance <name>]  # ⚠️  confirmation required
./scripts/update-feature.js <feature-uuid> [--name "..."] [--description "..."] [--notes "..."] [--source "..."] [--instance <name>]  # ⚠️  confirmation required
./scripts/delete-feature.js <feature-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion
```

### Requirements

⚠️ **Write operations below require confirmation** - show complete request body
before execution.

```bash
./scripts/list-requirements.js <project-slug> [options] [--instance <name>]
  Options: --feature <uuid>, --epic <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --refs <1.2,3.4>,
           --include-deprecated

./scripts/get-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]
  # Get full details of a requirement by ref (e.g. "133.8") or UUID

./scripts/create-requirement.js <project-slug> <feature-uuid> <description> [options] [--instance <name>]  # ⚠️  confirmation required
  Options: --type Functional|Design|Performance
           --status Untested|Passing|Failing|Deprecated
           --release <uuid>, --secondary-feature <uuid>
           --source, --notes, --business-critical true|false

./scripts/update-requirement.js <project-slug> <requirement-ref-or-uuid> [options] [--instance <name>]  # ⚠️  confirmation required
  Options: --description, --type, --status, --feature <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --source, --notes,
           --acceptance-criteria, --business-critical true|false

./scripts/get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...] [--instance <name>]

./scripts/delete-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion
```

### Entities

⚠️ **Write operations below require confirmation** - show complete request body
before execution.

```bash
./scripts/get-entities.js <project-slug> [options] [--instance <name>]
  Options: --feature <uuid>, --epic <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --refs <1.2,3.4>,
           --include-deprecated

./scripts/get-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]
  # Get full details of an entity by ref (e.g. "1.1") or UUID

./scripts/create-entity.js <project-slug> <feature-uuid> <entity-name> [options] [--instance <name>]  # ⚠️  confirmation required
  Options: --release <uuid>, --secondary-feature <uuid>, --status Untested|Passing|Failing|Deprecated,
           --source, --notes, --business-critical true|false

./scripts/update-entity.js <project-slug> <entity-ref-or-uuid> [options] [--instance <name>]  # ⚠️  confirmation required
  Options: --entity-name, --feature <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --status Untested|Passing|Failing|Deprecated, --source, --notes,
           --acceptance-criteria, --business-critical true|false

./scripts/set-entity-fields.js <project-slug> <entity-ref-or-uuid> --fields <file.json> [--instance <name>]  # ⚠️  confirmation required
  # Upsert fields on an entity. A field given with an id is updated in place
  # (including renames); one without an id is created. Reference/One and
  # Reference/Many fields take referencedEntityId, so reference fields can be
  # created through the API.
./scripts/set-entity-fields.js <project-slug> <entity-ref-or-uuid> --delete <field-uuid>[,<field-uuid>...] [--instance <name>]  # ⚠️  confirmation required - permanent deletion

./scripts/delete-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion (idempotent)
```

### Releases

```bash
./scripts/list-releases.js <project-slug> [--instance <name>]
./scripts/get-release-context.js <release-uuid> [output.md] [--instance <name>]
./scripts/create-release.js <project-slug> <name> [description] [--instance <name>]  # ⚠️  confirmation required
./scripts/update-release.js <release-uuid> [--name "..."] [--description "..."] [--slug "..."] [--shipped true|false] [--instance <name>]  # ⚠️  confirmation required
./scripts/delete-release.js <release-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion
```

### User Roles

```bash
./scripts/list-userroles.js <project-slug> [--instance <name>]
./scripts/create-userrole.js <project-slug> <name> [description] [--instance <name>]  # ⚠️  confirmation required
./scripts/update-userrole.js <userrole-uuid> [--name "..."] [--description "..."] [--instance <name>]  # ⚠️  confirmation required
./scripts/delete-userrole.js <userrole-uuid> [--instance <name>]  # ⚠️  confirmation required - permanent deletion
```

## Common Workflows

### Initial setup

```bash
# Add your production instance
./scripts/add-instance.js production --url https://api.spechub.app --pat <your-pat>

# Add a staging instance
./scripts/add-instance.js staging --url https://staging.api.spechub.app --pat <staging-pat>

# Verify both work
./scripts/check-auth.js
./scripts/check-auth.js --instance staging
```

### Explore a project

```bash
./scripts/list-projects.js
./scripts/get-project-context.js spechub
./scripts/analyze-project.js spechub
```

### Work across instances

```bash
# Check what features exist in staging
./scripts/list-features.js --instance staging spechub

# Create a feature on staging
./scripts/create-feature.js --instance staging spechub "Payment processing"

# Approve a requirement on production
./scripts/update-requirement.js --instance production <uuid> --status Passing
```

### Make direct API calls

```javascript
// lib/cli.js loads .env and re-exports the api-client helpers, so scripts
// require a single module. Use lib/api-client directly for library-only usage.
const { createClient, fetchAll, resolveProjectSlug } = require("../lib/cli");
const instances = require("../lib/instances");

// Use the default instance
const client = await createClient();

// Or target a specific instance explicitly
const cfg = instances.getConfig("staging");
const stagingClient = await createClient(cfg);

// Find a project by slug
const project = await resolveProjectSlug(client, "spechub");

// Create a feature
const res = await client.post("/api/v1/feature", {
  projectId: project.id,
  name: "My new feature",
  description: "Feature description",
});
console.log("Created:", res.data.data.id);

// Update a requirement
await client.patch(`/api/v1/requirement/${requirementId}`, {
  status: "Passing",
});

// Get project context (Markdown) — one request instead of many
const cli = require("../lib/cli");
const ctx = await cli.getContext(client, "/api/v1/project/context", {
  projectId: project.id,
});
console.log(ctx);
```

## Technical Details

### lib/cli.js exports

Shared CLI plumbing so scripts stay small and their API calls stay explicit.
Re-exports `createClient`, `getAccessToken`, `fetchAll`, `getContext`, `isUuid`,
`listProjects`, `resolveProjectSlug`, `resolveRequirement`, and `resolveEntity`
from `lib/api-client`, and adds:

- `parseFlags(args, start=0)` — parse `--flag value` and bare boolean `--flag`
  options
- `positionals(args)` — non-flag arguments, in order
- `bool(value)` — interpret a flag value as boolean (`'true'` or bare flag)
- `buildBody(flags, spec)` — build a JSON body from flags using a declarative
  map of `flagName → bodyKey` or `flagName → { key, transform }`; only provided
  flags are included (safe for partial PATCH bodies)
- `usage(...lines)` — print usage lines to stderr and exit 1
- `abort(message)` — print `Error: <message>` and exit 1
- `run(mainFn)` — run an async entrypoint with the uniform RFC 9457 error
  handler
- `printContext(client, path, params, { title, outputFile })` — fetch a
  `text/markdown` context endpoint, optionally save it, and print it

Requiring `lib/cli.js` also loads `.env` automatically. A typical script:

```javascript
const cli = require("../lib/cli");
const args = process.argv.slice(2);
const [slug, name] = cli.positionals(args);
if (!slug || !name) cli.usage("Usage: ./create-x.js <project-slug> <name>");

cli.run(async () => {
  const client = await cli.createClient();
  const project = await cli.resolveProjectSlug(client, slug);
  const res = await client.post("/api/v1/x", { projectId: project.id, name });
  console.log("Created", res.data.data.id);
});
```

### lib/instances.js exports

- `getConfig(name?)` — resolves and returns `{ name, url, pat }` for the given
  instance name (or default)
- `addOrUpdate(name, url, pat, setDefault)` — add or update an instance
- `remove(name)` — remove an instance; returns `true` if found
- `setDefault(name)` — set the default instance; returns `true` if found
- `list()` — returns `{ default, instances }` from `instances.json`
- `load()` / `save(data)` — raw file read/write

### lib/api-client.js exports

- `createClient(instanceConfig?)` — returns an authenticated axios instance
- `getAccessToken(instanceConfig?)` — returns the bearer token (refreshing if
  needed)
- `fetchAll(client, path, params)` — fetches all pages of a list endpoint at
  `limit=500`
- `getContext(client, path, params)` — fetches a `text/markdown` context
  endpoint and returns the Markdown string (⚡ prefer this for overviews)
- `isUuid(value)` — true when a value looks like a UUID rather than a slug/ref
- `listProjects(client)` — all projects, cached per process
- `resolveProjectSlug(client, slugOrId)` — resolves a project slug (or UUID) to
  its project object, using the cached project list
- `resolveRequirement(client, projectId, refOrId)` — resolves a UUID via the
  detail endpoint, or a `fullyQualifiedRef` via a server-side `?refs=` filter
- `resolveEntity(client, projectId, refOrId)` — same, for entities

Both `createClient` and `getAccessToken` accept an optional `{ url, pat }`
config object. When omitted, the active instance is auto-resolved (via
`--instance` flag, `SPECHUB_INSTANCE` env var, or the default in
`instances.json`).

### Error responses

Errors follow RFC 9457 `application/problem+json`:

```json
{
  "title": "Not Found",
  "status": 404,
  "detail": "Project not found"
}
```

Scripts surface `title` and `detail` to users:

```javascript
.catch(err => console.error(err.response?.data?.detail || err.message))
```

### Rate limiting

The API enforces rate limits. On `429 Too Many Requests`, back off and retry
after the `Retry-After` header duration.

## Known Constraints

- **Parameter casing**: all query/path/body identifiers are camelCase with a
  lowercase `Id`/`Ids` suffix (`projectId`, `organizationId`, `featureIds`,
  `fieldIds`, `requirementIds`). The API validates against the OpenAPI spec and
  returns `400` for `projectID`-style names.
- **Context endpoints first**: for any overview or analysis task, one
  `/context` call replaces many list/detail calls. See
  "⚡ Read efficiently" above.
- **User-Agent**: The client sends `spechub-skill (curl)` which the API expects. No special UA handling is required for API consumers.
- **Pagination**: Always paginate — lists default to 100 items, max 500; use
  `fetchAll()` for everything
- **UUIDs vs Refs**: All resources identified by UUID in the API; use
  `resolveProjectSlug()` for projects. However, **always display and reference
  requirements/entities by their `fullyQualifiedRef`** (e.g. "1.23") in
  user-facing output, not by UUID.
- **PATCH semantics**: All update endpoints are partial — omitted fields are
  left unchanged
- **Project creation**: Requires `organizationId` — use
  `GET /api/v1/organization` to find your org UUID
- **Deletion**: All resources support DELETE; deletions are permanent. Entity
  DELETE and entity field DELETE are idempotent (return `204` on subsequent
  calls); all other DELETE operations return `404` when the resource doesn't
  exist.
- **Deprecated items**: Entities and requirements can be marked as deprecated.
  By default, list endpoints exclude deprecated items; pass
  `includeDeprecated=true` to include them.
- **Requirement description length**: The `description` field of a requirement
  has a 300-character maximum. The skill automatically handles this by
  truncating at sentence or word boundaries and moving excess text to the
  `notes` field. This applies to both create and update operations.

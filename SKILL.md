---
name: spechub
description:
  Read and analyze data from SpecHub (go.spechub.app), and create or update
  projects, epics, features, requirements, releases, user roles, and entities.
  Supports multiple named instances (production, staging, local, etc.). Use when
  the user wants to view, browse, analyze, or modify SpecHub data.
license: MIT
compatibility:
  Requires Node.js 18+, axios, dotenv. Access to SpecHub API with personal
  access token.
---

# SpecHub Integration

This skill provides **read and write** access to SpecHub via the REST API. It
supports **multiple named instances** — each with its own URL and access token.

## ⚠️ Write Action Policy — MANDATORY

Before executing **any** write operation (POST, PATCH, or DELETE) against the
API, you **must** pause and present a confirmation prompt to the user that
includes:

1. The **HTTP method** and full **endpoint path** (e.g. `POST /api/v1/feature`)
2. The **instance** the request will be sent to (name + URL)
3. The **request body** as formatted JSON, or for DELETE the resource identifier
   and name

Do **not** run the script or make the API call until the user explicitly
confirms. Acceptable confirmation responses include "yes", "go ahead",
"confirm", "do it", or similar. If the user says no or asks for changes, update
the plan and show a new confirmation prompt.

This rule applies to every write action, even when the user has already
described what they want. Never skip confirmation on the grounds that the intent
is obvious.

## Security Considerations

**Important**: This skill executes write operations against the SpecHub API:

- **Authentication**: Uses Personal Access Tokens with full account permissions
- **Write operations**: Can create, update, and permanently delete resources
- **Token storage**: PATs are stored in `instances.json` (gitignored) in plain
  text
- **Confirmation required**: All write operations require explicit user
  confirmation before execution
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
> operations.

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
| GET    | `/api/v1/project/{projectID}` | Get project detail by UUID                        |
| PATCH  | `/api/v1/project/{projectID}` | Update a project (partial update)                 |
| DELETE | `/api/v1/project/{projectID}` | Delete a project (permanent deletion)             |
| GET    | `/api/v1/project/context`     | Get project context (Markdown), `?projectID=UUID` |

### Epics

| Method | Path                            | Description                                      |
| ------ | ------------------------------- | ------------------------------------------------ |
| GET    | `/api/v1/epic`                  | List epics for a project, `?projectID=UUID`      |
| POST   | `/api/v1/epic`                  | Create a new epic                                |
| GET    | `/api/v1/epic/{epicID}`         | Get epic detail                                  |
| PATCH  | `/api/v1/epic/{epicID}`         | Update an epic (partial update)                  |
| DELETE | `/api/v1/epic/{epicID}`         | Delete an epic (permanent deletion)              |
| GET    | `/api/v1/epic/context`          | Get epic context (Markdown), `?epicID=UUID`      |
| GET    | `/api/v1/epic/{epicID}/feature` | List features associated with an epic            |
| PUT    | `/api/v1/epic/{epicID}/feature` | Replace the complete set of features for an epic |

### Features

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/feature`             | List features, `?projectID=UUID`                  |
| POST   | `/api/v1/feature`             | Create a new feature                              |
| GET    | `/api/v1/feature/{featureID}` | Get feature detail                                |
| PATCH  | `/api/v1/feature/{featureID}` | Update a feature (partial update)                 |
| DELETE | `/api/v1/feature/{featureID}` | Delete a feature (permanent deletion)             |
| GET    | `/api/v1/feature/context`     | Get feature context (Markdown), `?featureID=UUID` |

### Requirements

| Method | Path                                  | Description                                                              |
| ------ | ------------------------------------- | ------------------------------------------------------------------------ |
| GET    | `/api/v1/requirement`                 | List requirements, `?projectID=UUID`                                     |
| POST   | `/api/v1/requirement`                 | Create a new requirement                                                 |
| GET    | `/api/v1/requirement/{requirementID}` | Get requirement detail                                                   |
| PATCH  | `/api/v1/requirement/{requirementID}` | Update a requirement (partial)                                           |
| DELETE | `/api/v1/requirement/{requirementID}` | Delete a requirement (permanent deletion)                                |
| GET    | `/api/v1/requirement/improve`         | Suggest improved descriptions (AI), `?projectID=UUID&requirementIDs=...` |

### Entities

| Method | Path                               | Description                                   |
| ------ | ---------------------------------- | --------------------------------------------- |
| GET    | `/api/v1/entity`                   | List entities, `?projectID=UUID`              |
| POST   | `/api/v1/entity`                   | Create a new entity                           |
| GET    | `/api/v1/entity/{entityID}`        | Get entity detail                             |
| PATCH  | `/api/v1/entity/{entityID}`        | Update an entity (partial)                    |
| DELETE | `/api/v1/entity/{entityID}`        | Delete an entity (permanent, idempotent)      |
| PATCH  | `/api/v1/entity/{entityID}/fields` | Upsert fields on an entity (create or update) |
| DELETE | `/api/v1/entity/{entityID}/fields` | Delete fields from an entity (idempotent)     |

### Releases

| Method | Path                          | Description                                       |
| ------ | ----------------------------- | ------------------------------------------------- |
| GET    | `/api/v1/release`             | List releases, `?projectId=UUID`                  |
| POST   | `/api/v1/release`             | Create a new release                              |
| GET    | `/api/v1/release/{releaseId}` | Get release detail                                |
| PATCH  | `/api/v1/release/{releaseId}` | Update a release (partial)                        |
| DELETE | `/api/v1/release/{releaseId}` | Delete a release (permanent deletion)             |
| GET    | `/api/v1/release/context`     | Get release context (Markdown), `?releaseId=UUID` |

### User Roles

| Method | Path                            | Description                             |
| ------ | ------------------------------- | --------------------------------------- |
| GET    | `/api/v1/userrole`              | List user roles, `?projectID=UUID`      |
| POST   | `/api/v1/userrole`              | Create a new user role                  |
| GET    | `/api/v1/userrole/{userRoleID}` | Get user role detail                    |
| PATCH  | `/api/v1/userrole/{userRoleID}` | Update a user role (partial)            |
| DELETE | `/api/v1/userrole/{userRoleID}` | Delete a user role (permanent deletion) |

### Pagination

List endpoints use cursor-based pagination. Follow `pagination.nextCursor` while
`pagination.hasNext` is `true`. The `fetchAll()` helper in `lib/api-client.js`
handles this automatically.

### List endpoint filters

Many list endpoints support additional query parameters to filter results:

| Parameter            | Applicable to                          | Description                                                                                                                                            |
| -------------------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `projectId`          | All list endpoints                     | UUID of the project to scope the request to (required for most list endpoints)                                                                         |
| `featureId`          | Entity, Requirement                    | UUID of the feature to filter by                                                                                                                       |
| `epicId`             | Entity, Requirement, Epic/Feature list | UUID of the epic to filter by                                                                                                                          |
| `releaseId`          | Entity, Requirement                    | UUID of the release to filter by                                                                                                                       |
| `secondaryFeatureId` | Entity, Requirement                    | UUID of the secondary feature to filter by                                                                                                             |
| `refs`               | Entity, Requirement                    | Comma-separated fully qualified refs e.g. `1.23,2.45` — **both parts must be integers** (`<featureRef>.<requirementRef>`); malformed refs return `400` |
| `includeDeprecated`  | Entity, Requirement                    | Whether to include deprecated items (default: `false`)                                                                                                 |
| `cursor`             | All list endpoints                     | Opaque pagination cursor                                                                                                                               |
| `limit`              | All list endpoints                     | Page size (default 100, min 20, max 500)                                                                                                               |

### Context endpoints

`/api/v1/project/context`, `/api/v1/epic/context`, `/api/v1/feature/context`,
and `/api/v1/release/context` return `text/markdown` — rich, human-readable
context documents ideal for AI analysis. Request these with
`Accept: text/markdown` and `responseType: 'text'`.

## Request Bodies

All write endpoints accept `application/json`. PATCH endpoints are partial —
only include the fields you want to change.

### Organization

Organizations are the top-level container. Use `GET /api/v1/organization` to
list orgs the caller belongs to. You need an `organizationID` to create a
project.

### Project

**Create** (`POST /api/v1/project`) — required: `organizationID`, `name`, `slug`

```json
{
  "organizationID": "<uuid>",
  "name": "My project",
  "slug": "my-project",
  "description": "...",
  "brief": "..."
}
```

**Update** (`PATCH /api/v1/project/{projectID}`) — all optional

```json
{ "name": "...", "slug": "...", "description": "...", "brief": "..." }
```

### Epic

**Create** (`POST /api/v1/epic`) — required: `projectID`, `name`

```json
{ "projectID": "<uuid>", "name": "Checkout redesign", "description": "..." }
```

**Update** (`PATCH /api/v1/epic/{epicID}`) — all optional

```json
{ "name": "...", "description": "...", "notes": "...", "slug": "..." }
```

### Epic Features

**List** (`GET /api/v1/epic/{epicID}/feature`) — paginated list of features
belonging to the epic.

**Replace** (`PUT /api/v1/epic/{epicID}/feature`) — idempotent replacement of
the epic's feature set.

```json
{ "featureIDs": ["<uuid>", "<uuid>"] }
```

Any existing associations not in the list are removed. Duplicate IDs are
ignored. Returns `422` if any feature UUID does not exist, or if any feature
belongs to a different project than the epic.

### Feature

**Create** (`POST /api/v1/feature`) — required: `projectID`, `name`

```json
{
  "projectID": "<uuid>",
  "name": "User auth",
  "description": "...",
  "source": "...",
  "notes": "..."
}
```

**Update** (`PATCH /api/v1/feature/{featureID}`) — all optional

```json
{ "name": "...", "description": "...", "notes": "...", "source": "..." }
```

### Requirement

**Create** (`POST /api/v1/requirement`) — required: `projectID`, `featureID`,
`description`

```json
{
  "projectID": "<uuid>",
  "featureID": "<uuid>",
  "description": "The system shall ...",
  "requirementType": "Functional",
  "status": "Untested",
  "releaseID": "<uuid>",
  "secondaryFeatureID": "<uuid>",
  "source": "...",
  "notes": "...",
  "acceptanceCriteria": ["..."],
  "businessCritical": false
}
```

`requirementType`: `Functional` | `Design` | `Performance` `status`: `Untested`
| `Passing` | `Failing` | `Deprecated`

**⚠️ Description Length Limit**: The `description` field has a maximum length of
300 characters. When creating or updating a requirement with a longer
description, the skill automatically truncates it at a sensible break point
(preferring sentence or word boundaries) and moves the excess text to the
`notes` field. If notes already exist, the overflow is prepended to them.

**Update** (`PATCH /api/v1/requirement/{requirementID}`) — all optional (same
fields minus `projectID`). `releaseID` and `secondaryFeatureID` may be set to
`null` to unset them.

### Requirement Improvements

**Get**
(`GET /api/v1/requirement/improve?projectID=<uuid>&requirementIDs=<uuid>,<uuid>`)

Returns AI-generated improved descriptions keyed by requirement ID:

```json
{ "requirementImprovements": { "<uuid>": "Improved description text..." } }
```

- `requirementIDs` is comma-separated in a **single** query parameter
  (`style=form, explode=false`): `?requirementIDs=uuid1,uuid2` — do **not**
  repeat the parameter
- All requirements must belong to the specified `projectID`; any requirement
  from another project returns `404`
- Each requirement is processed concurrently by the AI pipeline; individual
  failures produce an empty string for that key rather than aborting the whole
  request

### Entity Fields

**Upsert** (`PATCH /api/v1/entity/{entityID}/fields`) — include `id` to update
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

**Delete fields** (`DELETE /api/v1/entity/{entityID}/fields`) — delete specific
fields by ID using query parameters

```
DELETE /api/v1/entity/{entityID}/fields?fieldIDs=<uuid>&fieldIDs=<uuid>
```

### Entity

**Create** (`POST /api/v1/entity`) — required: `projectID`, `featureID`,
`entityName`

```json
{
  "projectID": "<uuid>",
  "featureID": "<uuid>",
  "entityName": "Order",
  "releaseID": "<uuid>",
  "secondaryFeatureID": "<uuid>",
  "status": "Untested",
  "source": "...",
  "notes": "...",
  "acceptanceCriteria": ["..."],
  "businessCritical": false
}
```

**Update** (`PATCH /api/v1/entity/{entityID}`) — all optional (same fields minus
`projectID`). `releaseID` and `secondaryFeatureID` may be set to `null` to unset
them.

`status`: `Untested` | `Passing` | `Failing` | `Deprecated`

### Release

**Create** (`POST /api/v1/release`) — required: `projectID`, `name`

```json
{
  "projectID": "<uuid>",
  "name": "v1.0",
  "description": "...",
  "shipped": false
}
```

**Update** (`PATCH /api/v1/release/{releaseID}`) — all optional

```json
{ "name": "...", "description": "...", "slug": "...", "shipped": true }
```

### User Role

**Create** (`POST /api/v1/userrole`) — required: `projectID`, `name`

```json
{ "projectID": "<uuid>", "name": "Admin", "description": "..." }
```

**Update** (`PATCH /api/v1/userrole/{userRoleID}`) — all optional

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
| `EntityDetail`      | `entityName`, `status`, `source`, `notes`, `acceptanceCriteria` (array), `automatedTestCoverageType`, `secondaryFeatureID`, `fields` (EntityFieldDetail array), `created`, `webUrl`                                                                                                    |
| `EntityFieldDetail` | `name`, `type`, `required`, `notes`, `options` (array of strings), `sampleValue`, `defaultValue`, `helpText`, `uiFieldGrouping`, `validations`, `created`, `updated`                                                                                                                   |
| `ReleaseDetail`     | `name`, `description`, `shipped`, `created`, `updated`, `webUrl`                                                                                                                                                                                                                       |
| `UserRoleDetail`    | `name`, `description`, `created`, `updated`, `webUrl`                                                                                                                                                                                                                                  |
| `Organization`      | `id`, `name`, `slug`, `description`, `created`, `updated`                                                                                                                                                                                                                              |

Projects are identified by **UUID** in API calls. Use `resolveProjectSlug()` in
`lib/api-client.js` to convert a human-readable slug to a UUID.

## Available Scripts

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
./scripts/delete-project.js <project-uuid> [--instance <name>]  # ⚠️  permanent deletion
```

### Epics

```bash
./scripts/list-epics.js <project-slug> [--instance <name>]
./scripts/get-epic-context.js <epic-uuid> [output.md] [--instance <name>]
./scripts/get-epic-features.js <epic-uuid> [--instance <name>]
./scripts/set-epic-features.js <epic-uuid> <feature-uuid> [<feature-uuid> ...] [--instance <name>]
./scripts/create-epic.js <project-slug> <name> [description] [--instance <name>]
./scripts/update-epic.js <epic-uuid> [--name "..."] [--description "..."] [--notes "..."] [--slug "..."] [--instance <name>]
./scripts/delete-epic.js <epic-uuid> [--instance <name>]  # ⚠️  permanent deletion
```

### Features

```bash
./scripts/list-features.js <project-slug> [--instance <name>]
./scripts/get-feature-context.js <feature-uuid> [output.md] [--instance <name>]
./scripts/create-feature.js <project-slug> <name> [description] [--instance <name>]
./scripts/update-feature.js <feature-uuid> [--name "..."] [--description "..."] [--notes "..."] [--source "..."] [--instance <name>]
./scripts/delete-feature.js <feature-uuid> [--instance <name>]  # ⚠️  permanent deletion
```

### Requirements

```bash
./scripts/list-requirements.js <project-slug> [options] [--instance <name>]
  Options: --feature <uuid>, --epic <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --refs <1.2,3.4>,
           --include-deprecated

./scripts/get-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]
  # Get full details of a requirement by ref (e.g. "133.8") or UUID

./scripts/create-requirement.js <project-slug> <feature-uuid> <description> [options] [--instance <name>]
  Options: --type Functional|Design|Performance
           --status Untested|Passing|Failing|Deprecated
           --release <uuid>, --secondary-feature <uuid>
           --source, --notes, --business-critical true|false

./scripts/update-requirement.js <project-slug> <requirement-ref-or-uuid> [options] [--instance <name>]
  Options: --description, --type, --status, --feature <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --source, --notes,
           --acceptance-criteria, --business-critical true|false

./scripts/get-requirement-improvements.js <project-slug> <requirement-uuid> [<requirement-uuid> ...] [--instance <name>]

./scripts/delete-requirement.js <project-slug> <requirement-ref-or-uuid> [--instance <name>]  # ⚠️  permanent deletion
```

### Entities

```bash
./scripts/get-entities.js <project-slug> [options] [--instance <name>]
  Options: --feature <uuid>, --epic <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --refs <1.2,3.4>,
           --include-deprecated

./scripts/get-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]
  # Get full details of an entity by ref (e.g. "1.1") or UUID

./scripts/create-entity.js <project-slug> <feature-uuid> <entity-name> [options] [--instance <name>]
  Options: --release <uuid>, --secondary-feature <uuid>, --status Untested|Passing|Failing|Deprecated,
           --source, --notes, --business-critical true|false

./scripts/update-entity.js <project-slug> <entity-ref-or-uuid> [options] [--instance <name>]
  Options: --entity-name, --feature <uuid>, --release <uuid>,
           --secondary-feature <uuid>, --status Untested|Passing|Failing|Deprecated, --source, --notes,
           --acceptance-criteria, --business-critical true|false

./scripts/delete-entity.js <project-slug> <entity-ref-or-uuid> [--instance <name>]  # ⚠️  permanent deletion (idempotent)
```

### Releases

```bash
./scripts/list-releases.js <project-slug> [--instance <name>]
./scripts/get-release-context.js <release-uuid> [output.md] [--instance <name>]
./scripts/create-release.js <project-slug> <name> [description] [--instance <name>]
./scripts/update-release.js <release-uuid> [--name "..."] [--description "..."] [--slug "..."] [--shipped true|false] [--instance <name>]
./scripts/delete-release.js <release-uuid> [--instance <name>]  # ⚠️  permanent deletion
```

### User Roles

```bash
./scripts/list-userroles.js <project-slug> [--instance <name>]
./scripts/create-userrole.js <project-slug> <name> [description] [--instance <name>]
./scripts/update-userrole.js <userrole-uuid> [--name "..."] [--description "..."] [--instance <name>]
./scripts/delete-userrole.js <userrole-uuid> [--instance <name>]  # ⚠️  permanent deletion
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
  projectID: project.id,
  name: "My new feature",
  description: "Feature description",
});
console.log("Created:", res.data.data.id);

// Update a requirement
await client.patch(`/api/v1/requirement/${requirementID}`, {
  status: "Passing",
});

// Get project context (Markdown)
const ctx = await client.get("/api/v1/project/context", {
  params: { projectID: project.id },
  headers: { Accept: "text/markdown" },
  responseType: "text",
});
console.log(ctx.data);
```

## Technical Details

### lib/cli.js exports

Shared CLI plumbing so scripts stay small and their API calls stay explicit.
Re-exports `createClient`, `getAccessToken`, `fetchAll`, `resolveProjectSlug`
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
- `fetchAll(client, path, params)` — fetches all pages of a list endpoint
- `resolveProjectSlug(client, slug)` — resolves a project slug to its UUID

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

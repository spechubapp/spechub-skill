# Context Endpoints - Understanding and Usage

## Overview

SpecHub exposes four **context endpoints** that return a `text/markdown` digest
assembled server-side. They are the most token- and request-efficient way to
understand a project, epic, feature, or release, because a single call replaces
several paginated list calls plus one detail call per item.

Prefer them for any overview, summary, review, documentation, or analysis task.

## Endpoints

| Endpoint                      | Required query param | Contents                                                                                   | Requests it replaces                                                                        |
| ----------------------------- | -------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `GET /api/v1/project/context` | `projectId`          | Project name/description, all user roles, all entities **with every field and type**, features | `listProjects` + `listUserRoles` + `listEntities` + `getEntity` per entity + `listFeatures` |
| `GET /api/v1/epic/context`    | `epicId`             | Epic name, its features, requirements nested under each feature                             | `getEpic` + `listEpicFeatures` + `listRequirements` per feature                              |
| `GET /api/v1/feature/context` | `featureId`          | Feature name and all its requirement descriptions                                          | `getFeature` + `listRequirements?featureId=`                                                |
| `GET /api/v1/release/context` | `releaseId`          | Release name/description, features with nested requirements                                | `getRelease` + `listFeatures` + `listRequirements?releaseId=`                                |

All four require the standard bearer token and should be requested with
`Accept: text/markdown`.

## Calling them

```bash
./scripts/get-project-context.js <project-slug> [out.md] [--instance <name>]
./scripts/get-epic-context.js <epic-uuid> [out.md]
./scripts/get-feature-context.js <feature-uuid> [out.md]
./scripts/get-release-context.js <release-uuid> [out.md]
```

From code:

```javascript
const cli = require("../lib/cli");

const client = await cli.createClient();
const project = await cli.resolveProjectSlug(client, "spechub");

// Returns the Markdown string
const md = await cli.getContext(client, "/api/v1/project/context", {
  projectId: project.id,
});

// Or print/save it
await cli.printContext(
  client,
  "/api/v1/project/context",
  { projectId: project.id },
  { title: "Project Context", outputFile: "out.md" },
);
```

Raw axios equivalent (note the headers and `responseType`):

```javascript
const res = await client.get("/api/v1/project/context", {
  params: { projectId },
  headers: { Accept: "text/markdown" },
  responseType: "text",
});
```

## Example shapes

Project context:

```
Project Name:
Checkout redesign

Project Description:
Overhaul the checkout flow to reduce cart abandonment.

User Roles:
- Admin: Administrator with full project access
- Viewer: Read-only access to project

Entities and their Fields:

User
- email: string
- id: uuid

Features:
- User authentication
- Payment processing
```

Release context:

```
Release Name:
1.2

Release Description:
Improved checkout workflow

Release Features and Requirements:
- Checkout flow on single page
  - User can see the current cart contents, shipping, and payment forms all on one page
  - Errors upon submission leave all possible fields populated
```

## When NOT to use context endpoints

Context documents contain names and prose only. Use list/detail endpoints when
you need:

- UUIDs (required for any create/update/delete)
- `fullyQualifiedRef` values, `ref` numbers, or `webUrl`
- `status`, `requirementType`, `automatedTestCoverageType`, `businessCritical`
- `acceptanceCriteria`, `source`, `notes`
- `created`/`updated` timestamps
- deprecated items (`includeDeprecated=true`)

When you do need structured data, still minimise requests: filter server-side
with `refs`, `featureId`, `epicId`, `releaseId`, or `secondaryFeatureId`, let
`fetchAll()` page at `limit=500`, and run independent list calls concurrently.

## Errors

- `401` — expired or invalid token; run `./scripts/check-auth.js`
- `404` — the project/epic/feature/release UUID does not exist or is not visible
  to the caller
- `429` — rate limited; back off using `Retry-After`

Error bodies are RFC 9457 `application/problem+json`; surface `title` and
`detail` rather than guessing.

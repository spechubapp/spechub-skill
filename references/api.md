# API reference

Paths are relative to the instance URL; use the authenticated client from
`lib/cli.js`. Bodies are JSON; identifiers use lowercase `Id` / `Ids`
(`projectID` returns 400). For undocumented fields, see the instance's
`/.well-known/openapi.yaml`.

## Resources and endpoints

Organizations contain projects; projects contain features, epics, releases, and
user roles. Requirements and entities belong to a feature and may reference a
release and a secondary feature; entities contain fields. Epics and features
are many-to-many.

For `project`, `epic`, `feature`, `requirement`, `entity`, `release`, and
`userrole`:

| Operation      | Method and path                  |
| -------------- | -------------------------------- |
| List           | `GET /api/v1/<resource>`         |
| Create         | `POST /api/v1/<resource>`        |
| Detail         | `GET /api/v1/<resource>/{id}`    |
| Partial update | `PATCH /api/v1/<resource>/{id}`  |
| Delete         | `DELETE /api/v1/<resource>/{id}` |

Organizations support only `GET /api/v1/organization`. Raw context requests
need `Accept: text/markdown` and `responseType: 'text'`.

Deletes are permanent. Entity and entity-field deletes are idempotent (204);
other deletes return 404 if absent.

## Lists and responses

Lists return `{ pagination, data: [...] }`; details wrap the resource in
`{ data: {...} }`. Follow `pagination.nextCursor` while
`pagination.hasNext`; cursors are opaque. Page size defaults to 100, minimum
20, maximum 500. Prefer `fetchAll()`.

| List                                 | Accepted query parameters                                                                        |
| ------------------------------------ | ------------------------------------------------------------------------------------------------ |
| Organization, project, epic features | `cursor`, `limit`                                                                                |
| Feature, epic, release, user role    | Required `projectId`, `cursor`, `limit`                                                          |
| Requirement, entity                  | Above plus `featureId`, `epicId`, `releaseId`, `secondaryFeatureId`, `refs`, `includeDeprecated` |

`refs` is a comma-separated string of integer pairs, e.g. `1.23,2.45`;
malformed refs return 400. `includeDeprecated` defaults to false.

List items are lighter than detail responses. Detail may include `notes`,
`source`, `acceptanceCriteria`, `created`, `updated`, and `webUrl`.
Entity detail includes `fields`; requirement detail includes `replacement`
(below). Requirements/entities expose `fullyQualifiedRef` and
`automatedTestCoverageType`; responses may omit `businessCritical`, and entity
detail omits `created`. Features use integer `ref`. Projects include
`url`, an external site or app URL, or null. Requirement create and PATCH
responses report the stored `fullyQualifiedRef`, including after a feature
move. Entity create and move responses may report its feature part and
`webUrl` as `0`; re-read the detail for the stored values.

## Create and update bodies

For PATCH, send only changed fields and omit the parent ID (`organizationId` /
`projectId`).

| Resource    | Required on create                      | Optional on create and PATCH                                                 | PATCH only                 |
| ----------- | --------------------------------------- | ---------------------------------------------------------------------------- | -------------------------- |
| Project     | `organizationId`, `name`, `slug`        | `description`, `brief`, `url`                                                | —                          |
| Epic        | `projectId`, `name`                     | `description`                                                                | `notes`, `slug`            |
| Feature     | `projectId`, `name`                     | `description`, `source`, `notes`                                             | —                          |
| Requirement | `projectId`, `featureId`, `description` | `requirementType`, `automatedTestCoverageType`, and shared item fields below | `replacementRequirementId` |
| Entity      | `projectId`, `featureId`, `entityName`  | Shared item fields below                                                     | —                          |
| Release     | `projectId`, `name`                     | `description`, `shipped` (boolean)                                           | `slug`                     |
| User role   | `projectId`, `name`                     | `description`                                                                | —                          |

Shared requirement/entity fields:

- `status`: `Untested` | `Passing` | `Failing` | `Deprecated`.
- `releaseId`, `secondaryFeatureId`: UUIDs; PATCH accepts null to clear them.
- `source`, `notes`: strings.
- `acceptanceCriteria`: array of strings.
- `businessCritical`: boolean.

`requirementType` is `Functional`, `Design`, or `Performance`.
`automatedTestCoverageType` is `No automated test` (the default),
`Has automated test`, or `Needs automated test`; entities cannot set it.
Project `url` must be an absolute http or https URL; PATCH accepts null or
`""` to clear it. Example:

```json
{
  "projectId": "<uuid>",
  "featureId": "<uuid>",
  "description": "The application displays a login form.",
  "requirementType": "Functional",
  "status": "Untested",
  "releaseId": "<uuid>",
  "acceptanceCriteria": ["..."],
  "businessCritical": false
}
```

## Requirement replacements

A `Deprecated` requirement can point at the requirement that replaces it.
PATCH `replacementRequirementId` with the replacement's UUID, in the same
request as `"status": "Deprecated"` or later. Null removes the replacement;
omitting it leaves it unchanged, and changing the status away from
`Deprecated` keeps it. The replacement must be another requirement in the same
project; otherwise, or when the requirement is not `Deprecated`, the PATCH
returns 422 and changes nothing.

Requirement detail then includes `replacement`, omitted when there is none:

```json
{ "name": "1.31: Users can check out as a guest.", "url": "<webUrl>" }
```

`name` is the replacement's ref and description when it was set and does not
follow later edits. The replacement is stored as a `Replacement` external
reference on the deprecated requirement.

## External references

Epics, features, and requirements carry ordered links to external resources.

| Operation | Method and path                                          |
| --------- | -------------------------------------------------------- |
| List      | `GET /api/v1/{epic,feature,requirement}/{id}/reference`  |
| Add       | `POST /api/v1/{epic,feature,requirement}/{id}/reference` |
| Update    | `PATCH /api/v1/reference/{referenceId}`                  |
| Delete    | `DELETE /api/v1/reference/{referenceId}`                 |

Lists are not paginated: `{ "data": [...] }`, ordered by `weight`. Create
appends; create and update return the reference in `{ data: {...} }`.

```json
{
  "name": "Login issue",
  "url": "https://github.com/myorg/myrepo/issues/42",
  "type": "Implementation",
  "notes": "Tracks the implementation work."
}
```

`name` (at most 300 characters), a valid `url`, and `type` are required on
create; PATCH changes only the fields sent. Writable types are
`Documentation`, `Test`, `Implementation`, and `Other`. SpecHub manages
`Figma` and `Replacement` references: they appear in lists but cannot be
created, and other types cannot be changed to them (422). References also
include `id`, `weight`, `created`, and `updated`.

When the project is connected to a GitHub repository, an issue or pull request
URL in that repository is enriched on create or URL change with
`github: { kind: "issue" | "pr", number, title, status, labels, assignees }`;
enrichment failures do not fail the request. GitHub-enriched and `Replacement`
references cannot be updated (422) but can be deleted. Deleting a
`Replacement` reference removes the requirement's replacement.

## Epic features

`GET /api/v1/epic/{epicId}/feature` lists associated features (paginated).

`PUT /api/v1/epic/{epicId}/feature` replaces the complete association set:

```json
{ "featureIds": ["<uuid>", "<uuid>"] }
```

Omitted associations are removed; duplicate IDs are ignored. Nonexistent
features or features belonging to another project return 422.

## Resolve

`GET /api/v1/resolve` identifies an object from either `url`, a SpecHub web
URL, or `ref` (`2` for a feature, `2.45` for a requirement or entity) with
`projectId`. Pass one form, not both, or the request returns 400.

```json
{
  "data": {
    "type": "requirement",
    "id": "<uuid>",
    "projectId": "<uuid>",
    "webUrl": "https://go.spechub.app/acme/checkout/2.45"
  }
}
```

`url` may be absolute, lack the scheme, or be a path alone; query strings and
fragments are ignored. A sub-page resolves to its object: `.../2.45/notes` to
requirement 2.45, `.../features` to the project. `type` is `project`, `epic`,
`feature`, `requirement`, `entity`, `release`, `userRole`, or `reference`
(external references), naming the endpoints that accept the ID; `webUrl` is
canonical. An unknown or inaccessible object
returns 404; an unparseable `url` or `ref` returns 400.

## Project search

`GET /api/v1/project/{projectId}/search` takes a required `searchTerm`,
`typeFilter` (`all`, the default, `epic`, `feature`, `requirement`, `release`,
or `discussion`), `sortBy` (`relevance`, the default, or `last_updated`),
`cursor`, and `limit`. An empty `searchTerm` or invalid filter returns 400.

The response is a paginated list plus
`meta: { currentTypeFilter, currentSort, typeCounts }`. `typeCounts` gives the
matches of every type, regardless of `typeFilter`. Each result has `type`,
`id`, `title`, `relevance` (comparable only within one search), `updated`,
`webUrl`, and, by type, `ref` (features), `slug` (epics and releases),
`fullyQualifiedRef` (requirements), or `requirementId` (discussions, whose `id`
is the comment's).

`title` is the item's name, a requirement's description, or for discussions
the parent requirement's description. `snippet`, when present, is the first
matching field among name, description, notes, and discussion body, with
keywords in `<mark>` tags and other characters HTML-escaped (`&#34;`).
Entities appear as `requirement` results titled with the entity name.
Deprecated requirements are included, without their status. Search does not
match refs; resolve them instead.

## Requirement standardization

`POST /api/v1/project/{projectId}/requirements/standardize` rewrites 1 to 20
description strings into SpecHub's formulation types, using the project's
roles, entities, and entity fields. It creates and changes nothing.

```json
{ "requirements": ["usernames can only have letters and numbers"] }
```

```json
{
  "requirements": [
    {
      "original": "usernames can only have letters and numbers",
      "standardized": "The application prevents User.username values that contain characters other than letters and numbers."
    }
  ]
}
```

Results keep the input order, including duplicates. An empty or oversized list
returns 400; an inaccessible project returns 404; if any description fails,
the request returns 500. Vet results against project context and the
authoring rules.

## Requirement improvements

`GET /api/v1/requirement/improve` takes `projectId` and `requirementIds`.
Serialize IDs as one comma-separated parameter
(`?projectId=<uuid>&requirementIds=uuid1,uuid2`), not repeated parameters.

Response: `{ "requirementImprovements": { "<uuid>": "Suggested text" } }`.
Requirements outside the project return 404; a failed item yields `""`. Vet
suggestions against project context and the authoring rules.

## Entity fields

`PATCH /api/v1/entity/{entityId}/fields` upserts fields: include `id` to
update (including renames), omit it to create. Field names must match
`^[a-z0-9_]+$` (e.g. `api_url`, not `apiUrl`); the request is rejected
otherwise.

```json
{
  "fields": [
    { "id": "<uuid>", "name": "email", "type": "Text/Short", "required": true },
    { "name": "age", "type": "Number/Integer", "sampleValue": "25" }
  ]
}
```

Field types: `Text/Short`, `Text/UUID`, `Text/Slug`, `Text/Long (Plain)`,
`Text/Long (Rich)`, `Text/URI`, `Text/Email`, `Number/Integer`,
`Number/Decimal`, `Choice/One`, `Choice/Many`, `Reference/One`,
`Reference/Many (Unordered)`, `Reference/Many (Ordered)`, `Date and time`,
`Boolean`, `File/Image`, `File/Any`.

Reference types take `referencedEntityId`. Other field details include
`notes`, `options` (string array), `defaultValue`, `helpText`,
`uiFieldGrouping`, `validations`, `created`, and `updated`.

`DELETE /api/v1/entity/{entityId}/fields` takes **repeated** `fieldIds`:

```text
/api/v1/entity/{entityId}/fields?fieldIds=uuid1&fieldIds=uuid2
```

Axios's default `fieldIds[]=uuid` is rejected. Use
`scripts/set-entity-fields.js` or explicitly build the query string.

## Authentication and errors

The client exchanges the PAT at `POST /api/v1/auth/token/refresh` and sends
`Authorization: Bearer <token>`.

Errors use RFC 9457 `application/problem+json`; surface `title` and `detail`.
For 401, use `scripts/check-auth.js`; for connectivity problems, use
`scripts/diagnose.js`. On 429, honor `Retry-After`.

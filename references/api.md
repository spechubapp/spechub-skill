# API reference

All paths are relative to the selected instance URL. Use the authenticated
client from `lib/cli.js`. Requests use JSON; identifiers are camelCase with
lowercase `Id` / `Ids` (`projectId`, not `projectID`, which returns 400).
For fields not documented here, consult the instance's
`/.well-known/openapi.yaml`.

## Resources and endpoints

Organizations contain projects; projects contain features, epics, releases, and
user roles. Requirements and entities belong to features; entities contain
fields. Epics group features through a many-to-many association. Requirements
and entities can also reference a release and a secondary feature.

For `project`, `epic`, `feature`, `requirement`, `entity`, `release`, and
`userrole`:

| Operation      | Method and path                  |
| -------------- | -------------------------------- |
| List           | `GET /api/v1/<resource>`         |
| Create         | `POST /api/v1/<resource>`        |
| Detail         | `GET /api/v1/<resource>/{id}`    |
| Partial update | `PATCH /api/v1/<resource>/{id}`  |
| Delete         | `DELETE /api/v1/<resource>/{id}` |

Organizations support `GET /api/v1/organization`. For Markdown endpoints and
their contents, see [project context](../SKILL.md#project-context-and-analysis).
Special endpoints are described below.

Deletes are permanent. Entity and entity-field deletes are idempotent (204
even if already deleted); other resource deletes return 404 if absent.
Follow the [write policy](../SKILL.md#write-confirmation).

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
Entity detail includes `fields`. Requirements/entities expose
`fullyQualifiedRef`, `businessCritical`, and `automatedTestCoverageType`
(`Untested`, `Tested`, `Needs a test`); features use integer `ref`.

## Create and update bodies

The table separates required create fields from optional fields. For PATCH,
send only changed fields; omit the creation-only parent ID
(`organizationId` for projects, `projectId` for other resources).
PATCH-only fields are listed separately.

| Resource    | Required on create                      | Optional on create and PATCH                   | PATCH only      |
| ----------- | --------------------------------------- | ---------------------------------------------- | --------------- |
| Project     | `organizationId`, `name`, `slug`        | `description`, `brief`                         | —               |
| Epic        | `projectId`, `name`                     | `description`                                  | `notes`, `slug` |
| Feature     | `projectId`, `name`                     | `description`, `source`, `notes`               | —               |
| Requirement | `projectId`, `featureId`, `description` | `requirementType` and shared item fields below | —               |
| Entity      | `projectId`, `featureId`, `entityName`  | Shared item fields below                       | —               |
| Release     | `projectId`, `name`                     | `description`, `shipped` (boolean)             | `slug`          |
| User role   | `projectId`, `name`                     | `description`                                  | —               |

Shared requirement/entity fields:

- `status`: `Untested` | `Passing` | `Failing` | `Deprecated`.
- `releaseId`, `secondaryFeatureId`: UUIDs; PATCH accepts null to clear them.
- `source`, `notes`: strings.
- `acceptanceCriteria`: array of strings.
- `businessCritical`: boolean.

`requirementType` is `Functional`, `Design`, or `Performance`.
Apply the [requirement rules](../SKILL.md#requirement-creation) for release
selection and description overflow before preparing the final body.

Example requirement body:

```json
{
  "projectId": "<uuid>",
  "featureId": "<uuid>",
  "description": "The system shall ...",
  "requirementType": "Functional",
  "status": "Untested",
  "releaseId": "<uuid>",
  "acceptanceCriteria": ["..."],
  "businessCritical": false
}
```

## Epic features

`GET /api/v1/epic/{epicId}/feature` lists associated features (paginated).

`PUT /api/v1/epic/{epicId}/feature` replaces the complete association set:

```json
{ "featureIds": ["<uuid>", "<uuid>"] }
```

Omitted associations are removed; duplicate IDs are ignored. Nonexistent
features or features belonging to another project return 422.

## Requirement improvements

`GET /api/v1/requirement/improve` takes `projectId` and `requirementIds`.
Serialize IDs as one comma-separated parameter
(`?projectId=<uuid>&requirementIds=uuid1,uuid2`), not repeated parameters.

Response: `{ "requirementImprovements": { "<uuid>": "Suggested text" } }`.
Requirements outside the project return 404; individual processing failures
produce an empty string for that ID. Evaluate suggestions against project
context before recommending them.

## Entity fields

`PATCH /api/v1/entity/{entityId}/fields` upserts fields: include `id` to
update (including renames), omit it to create.

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

`POST /api/v1/auth/token/refresh` exchanges
`{ "personalAccessToken": "<pat>" }` for `{ token, expires }`.
The client handles this and sends `Authorization: Bearer <token>`.

Errors use RFC 9457 `application/problem+json`; surface `title` and `detail`.
For 401, use `scripts/check-auth.js`; for connectivity problems, use
`scripts/diagnose.js`. On 429, honor `Retry-After`.

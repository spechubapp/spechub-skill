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
Entity detail includes `fields`. Requirements/entities expose
`fullyQualifiedRef`, `businessCritical`, and `automatedTestCoverageType`
(OpenAPI lists `Untested`, `Tested`, `Needs a test`; responses also return
`No automated test`); features use integer `ref`. Create responses report the
feature part of `fullyQualifiedRef` and `webUrl` as `0`; re-read the detail
for the stored values.

## Create and update bodies

For PATCH, send only changed fields and omit the parent ID (`organizationId` /
`projectId`).

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

`requirementType` is `Functional`, `Design`, or `Performance`. Example:

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

# SpecHub Quick Reference

Authoritative details live in `SKILL.md`. This is the cheat sheet.

> ⚠️ Every write operation (POST/PATCH/PUT/DELETE) requires explicit user
> confirmation before execution. See the Write Action Policy in `SKILL.md`.

## Installation

```bash
cd ~/.pi/agent/skills/spechub
npm install
./scripts/add-instance.js production --url https://api.spechub.app --pat <your-pat>
./scripts/check-auth.js
```

Auth is bearer-token based: a long-lived personal access token is exchanged for a
short-lived access token via `POST /api/v1/auth/token/refresh` (handled
automatically by `lib/api-client.js`).

## ⚡ Read the fewest requests possible

Use a context endpoint whenever the question is about an overview. Each returns
Markdown assembled server-side in one request.

```bash
./scripts/get-project-context.js <project-slug> [out.md]   # roles + entities/fields + features
./scripts/get-epic-context.js <epic-uuid> [out.md]         # epic features + their requirements
./scripts/get-feature-context.js <feature-uuid> [out.md]   # feature + its requirements
./scripts/get-release-context.js <release-uuid> [out.md]    # release features + requirements
./scripts/analyze-project.js <project-slug>                # counts + project context
```

Use list/detail endpoints only when you need UUIDs, refs, statuses, timestamps,
`acceptanceCriteria`, `businessCritical`, or data you intend to mutate. Then let
the server filter:

```bash
./scripts/list-requirements.js <project-slug> --refs 1.23,2.45
./scripts/list-requirements.js <project-slug> --feature <uuid>
./scripts/get-entities.js <project-slug> --release <uuid>
```

## Browse & view

```bash
./scripts/list-instances.js
./scripts/list-organizations.js
./scripts/list-projects.js
./scripts/list-features.js <project-slug>
./scripts/list-epics.js <project-slug>
./scripts/get-epic-features.js <epic-uuid>
./scripts/list-releases.js <project-slug>
./scripts/list-userroles.js <project-slug>
./scripts/list-requirements.js <project-slug> [filters]
./scripts/get-requirement.js <project-slug> <ref-or-uuid>
./scripts/get-entities.js <project-slug> [filters]
./scripts/get-entity.js <project-slug> <ref-or-uuid>
```

All scripts accept `--instance <name>` anywhere in the argument list.

## Conventions that trip people up

- Identifiers are camelCase with a lowercase `Id`/`Ids` suffix: `projectId`,
  `organizationId`, `featureIds`, `fieldIds`, `requirementIds`. `projectID`
  returns `400`.
- `requirementIds` is comma-separated in one param; `fieldIds` is repeated.
- `limit` defaults to 100, min 20, max 500. Follow `pagination.nextCursor` while
  `pagination.hasNext`; never construct a cursor.
- Requirement `description` is capped at 300 characters; overflow moves to
  `notes` automatically.
- Refer to requirements/entities by `fullyQualifiedRef` (e.g. "1.23") in output,
  not UUID.
- Errors are RFC 9457 problem+json: surface `title` and `detail`.
- On `429`, honour `Retry-After`.

## Data hierarchy

```
Organization
└── Project
    ├── Feature (integer ref)
    │   ├── Requirement (fullyQualifiedRef "1.2")
    │   └── Entity (fullyQualifiedRef "1.1") → EntityField
    ├── Epic (M:N with Features)
    ├── Release
    └── UserRole
```

## Troubleshooting

| Problem                       | Solution                                        |
| ----------------------------- | ----------------------------------------------- |
| `401 Unauthorized`            | Check the PAT: `./scripts/check-auth.js`        |
| `400` on a query parameter    | Check casing (`projectId`, not `projectID`)     |
| Module not found              | `npm install` in the skill directory            |
| Can't connect                 | `./scripts/diagnose.js [--instance <name>]`     |
| Wrong environment             | `./scripts/use-instance.js <name>`              |
| Asked to write data           | Confirm with the user first, every time         |

# SpecHub Skill for Pi

A comprehensive skill for interacting with [SpecHub](https://go.spechub.app) via
the REST API. Manage projects, features, requirements, entities, epics,
releases, and user roles across multiple instances (production, staging, local).

## Features

✅ **Full CRUD operations** - Create, read, update, and delete all SpecHub
resources ✅ **Multiple instances** - Manage production, staging, and local
environments ✅ **Human-readable refs** - Reference requirements and entities by
ref (e.g. "1.23") instead of UUIDs ✅ **Rich filtering** - Filter requirements
and entities by feature, epic, release, secondary feature, or refs ✅ **AI
context endpoints** - Get rich Markdown context for projects, epics, and
features ✅ **Deprecation support** - Include or exclude deprecated items from
list operations

## Quick Start

### 1. Install Dependencies

```bash
cd ~/.pi/agent/skills/spechub && npm install
```

### 2. Add an Instance

```bash
# Interactive setup
./scripts/add-instance.js

# Or specify all options
./scripts/add-instance.js production \
  --url https://api.spechub.app \
  --pat <your-personal-access-token> \
  --default
```

Get your Personal Access Token from your SpecHub account settings at
https://go.spechub.app.

### 3. Verify Authentication

```bash
./scripts/check-auth.js
```

## Authentication

SpecHub uses **Personal Access Tokens (PATs)** with automatic JWT bearer token
refresh:

1. **PAT** - Long-lived token from your SpecHub account settings
2. **JWT** - Short-lived bearer token obtained by exchanging your PAT
3. **Auto-refresh** - Tokens are cached and refreshed automatically when within
   60 seconds of expiry

PATs are stored as plaintext in `instances.json` (gitignored).

## Instance Management

Manage multiple SpecHub environments (production, staging, local):

```bash
./scripts/list-instances.js              # Show all instances
./scripts/use-instance.js <name>         # Switch default instance
./scripts/add-instance.js <name> ...     # Add or update instance
./scripts/remove-instance.js <name>      # Remove instance
```

All scripts accept `--instance <name>` to target a specific instance:

```bash
./scripts/list-projects.js --instance staging
./scripts/create-feature.js --instance local spechub "My Feature"
```

## Usage Examples

### List and Browse

```bash
# List resources
./scripts/list-organizations.js
./scripts/list-projects.js
./scripts/list-features.js spechub
./scripts/list-requirements.js spechub --feature <uuid> --include-deprecated
./scripts/get-entities.js spechub --epic <uuid> --refs 1.1,2.3

# Get context (Markdown)
./scripts/get-project-context.js spechub [output.md]
./scripts/get-epic-context.js <epic-uuid> [output.md]
./scripts/get-feature-context.js <feature-uuid> [output.md]
./scripts/get-release-context.js <release-uuid> [output.md]
```

### Create Resources

```bash
./scripts/create-epic.js spechub "Checkout Redesign" "Overhaul the checkout flow"
./scripts/create-feature.js spechub "User Authentication"
./scripts/create-requirement.js spechub <feature-uuid> "The application displays a login form." --formulation simple --type Functional
./scripts/create-entity.js spechub <feature-uuid> "Order" --status Untested
```

### Update Resources (by ref or UUID)

```bash
# Update by ref (recommended)
./scripts/update-requirement.js spechub 1.23 --status Passing
./scripts/update-entity.js spechub 1.1 --entity-name "Customer"

# Or by UUID
./scripts/update-requirement.js spechub <uuid> --description "The application displays a sign-in form." --formulation simple
```

### Delete Resources (⚠️ permanent)

```bash
# Delete by ref (recommended)
./scripts/delete-requirement.js spechub 1.23
./scripts/delete-entity.js spechub 1.1

# Or by UUID
./scripts/delete-epic.js <epic-uuid>
./scripts/delete-feature.js <feature-uuid>
```

## Data Model

```
Organization
└── Project (UUID or slug)
    ├── Feature (ref: 1, 2, 3...)
    │   ├── Requirement (fullyQualifiedRef: 1.1, 1.2...)
    │   └── Entity (fullyQualifiedRef: 1.1, 1.2...)
    │       └── EntityField (name, type, required, etc.)
    ├── Epic (groups features, M:N)
    ├── Release (version tagging)
    └── UserRole (defined roles)
```

### Referencing Items

**Always use human-readable refs when possible:**

- ✅ Requirements/Entities: `1.23`, `2.45` (fullyQualifiedRef)
- ✅ Features: `1`, `2`, `3` (ref)
- ✅ Projects: `spechub`, `my-project` (slug)
- ❌ Avoid UUIDs in user-facing contexts

UUIDs are needed for API operations but should be secondary in output.

## Query Parameters

All list endpoints support filtering:

| Parameter            | Applicable To       | Description                             |
| -------------------- | ------------------- | --------------------------------------- |
| `featureId`          | Entity, Requirement | Filter by feature                       |
| `epicId`             | Entity, Requirement | Filter by epic                          |
| `releaseId`          | Entity, Requirement | Filter by release                       |
| `secondaryFeatureId` | Entity, Requirement | Filter by secondary feature             |
| `refs`               | Entity, Requirement | Comma-separated refs (e.g. `1.23,2.45`) |
| `includeDeprecated`  | Entity, Requirement | Include deprecated items                |

## Write Action Confirmation

The agent follows the [write confirmation policy](SKILL.md#write-confirmation)
before changing SpecHub data. Scripts execute directly and do not prompt for
approval themselves.

## Requirements

- Node.js 18+
- SpecHub account with API access (https://go.spechub.app)
- Personal Access Token from account settings

## Documentation

- [`SKILL.md`](./SKILL.md) - Operating rules and context workflow
- [Commands and helpers](./references/commands.md) - Script arguments and setup
- [API reference](./references/api.md) - Endpoints, bodies, filters, and errors

## License

MIT

## Support

For issues or questions about the SpecHub API, visit https://spechub.app or
contact hello@spechub.app.

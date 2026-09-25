# SpecHub skill

An agent skill for [SpecHub](https://go.spechub.app): browse and manage
projects, epics, features, requirements, entities, releases, and user roles
across multiple instances through the REST API.

## Setup

Requires Node.js 18+ and a personal access token from your SpecHub account
settings.

```bash
npm install
./scripts/add-instance.js            # interactive; or:
./scripts/add-instance.js production --url https://api.spechub.app --pat <token> --default
./scripts/check-auth.js
```

PATs are stored in plaintext in `instances.json`, which is gitignored.

## Documentation

- [`SKILL.md`](SKILL.md): agent operating rules (write confirmation, project
  context, requirement workflow, identifiers).
- [Commands and helpers](references/commands.md): script usage and library API.
- [API reference](references/api.md): endpoints, bodies, filters, and errors.
- [Requirement authoring](references/requirement-authoring.md): formulation
  types and quality rules.

## License

MIT. For SpecHub API questions, visit https://spechub.app or contact
hello@spechub.app.

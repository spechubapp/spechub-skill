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

## Linking a repository

Commit a `.spechub.json` at a repository's root (or a package's root in a
monorepo) so agents know which project it implements:

```bash
./scripts/link-project.js ~/src/acme-portal acme-portal
./scripts/show-link.js ~/src/acme-portal
```

```json
{
  "version": 1,
  "apiUrl": "https://api.spechub.app",
  "projectId": "3f2c9a1e-0000-4000-8000-000000000000"
}
```

`projectId` identifies the project, so renaming it in SpecHub never breaks the
link; `show-link.js` prints its current name and slug. `apiUrl` selects each
developer's matching local instance. The file holds no credentials.
Requirement refs in code comments and commit messages are always written as
`REQ 1.23`. A line in the repository's `AGENTS.md` or `CLAUDE.md` pointing to
it helps agents load this skill.

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

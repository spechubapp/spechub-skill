# SpecHub skill

Build and maintain software with AI agents using
[SpecHub](https://go.spechub.app) spec-driven development. With this skill,
your agent can:

- Create a SpecHub spec from existing source code
- Query a SpecHub project
- Draft specs for new or existing projects, implement them, and keep the code
  aligned with the spec
- Review a spec's quality and check the implementation against it

## Install

Requires Node.js 18+. Clone into your agent's skills directory, such as
`~/.agents/skills/` or `~/.claude/skills/`:

```bash
git clone https://github.com/spechubapp/spechub-skill.git ~/.claude/skills/spechub-skill
cd ~/.claude/skills/spechub-skill && npm install
```

Create a personal access token (PAT) in your SpecHub account settings, then add
an instance in your own terminal rather than through an agent:

```bash
./scripts/add-instance.js    # prompts for name, URL, and PAT (hidden)
./scripts/check-auth.js
```

For scripted setup, pipe the PAT on stdin:

```bash
pass show spechub | ./scripts/add-instance.js production --pat-stdin --default
```

PATs are stored in plaintext in `instances.json`, which is gitignored and
readable only by you.

## Linking a repository

A committed `.spechub.json` tells agents which project a repository, or a
package in a monorepo, implements:

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

It holds no credentials. `projectId` survives project renames, and `apiUrl`
selects each developer's matching instance. Agents cite requirements as
`REQ 1.23` in code comments and commit messages. Mention the skill in the
repository's `AGENTS.md` or `CLAUDE.md` so agents load it.

This repository is linked to its own private SpecHub project, so its `REQ`
comments illustrate the convention but cannot be opened publicly.

## Documentation

- [`SKILL.md`](SKILL.md): agent rules for writes, project context,
  requirements, and identifiers.
- [Commands](references/commands.md): scripts and library helpers.
- [API](references/api.md): endpoints, bodies, filters, and errors.
- [Requirement authoring](references/requirement-authoring.md): formulation
  types and quality rules.
- [Reconciliation](references/reconciliation.md): check a linked repository
  against its requirements.

## License

[MIT](LICENSE). Questions: hello@spechub.app.

# Requirement reconciliation

<!-- REQ 6.5, REQ 12.7 -->

Compare a linked repository's implementation with its SpecHub project,
requirement by requirement, and produce an actionable report. This is a
read-only audit: it changes neither code nor SpecHub data.

## Prepare

1. Run `./scripts/show-link.js <repo-path>` and use the linked project and
   instance.
2. Load project context for roles, entities, and releases.
3. Agree on scope: the whole project, or a feature, epic, release, or refs. For
   more than about 50 requirements, suggest reconciling one feature at a time.
4. Export the requirements in scope:
   `./scripts/export-requirements.js <project> [filters] --output <file>`,
   saving to a temporary directory, not the repository. The export is the
   checklist: every requirement in it must appear in the report exactly once.
   Its description, notes, and acceptance criteria are the requirement; notes
   may begin with description overflow.
5. Find existing traceability with a search for `REQ <ref>` comments. A
   comment is a lead, not evidence. Report comments that cite unknown or
   deprecated refs.

## Classify each requirement

Locate the implementing logic and check every clause: actor or role,
triggering event, condition, values, bounds, and each acceptance criterion.
Read the code path; a matching name, route, or comment alone is not a match.
Tests show intended behavior but do not replace reading the implementation.

- **Passing:** every clause is implemented as specified.
- **Inconsistent:** an implementation exists but diverges. State exactly how:
  wrong values or bounds, wrong conditions, a different role, missing edge
  cases, partial coverage, or different behavior for certain inputs.
- **Missing:** no implementation exists in this repository. Name where you
  looked.
- **Unverified:** the code cannot settle it, such as performance targets,
  visual design, or behavior owned by configuration or systems outside the
  repository. State what would verify it. Use this only when reading the code
  genuinely cannot decide; never as a hedge for a hard search.

Do not skip requirements because they seem minor or obvious. When the
requirement and the code disagree, report the discrepancy as-is; do not guess
which one is correct or reinterpret the requirement to fit the code.

When requirements in scope contradict each other, classify each against the
code on its own terms and report the contradiction under Other findings. To
check requirements against each other systematically, follow
[consistency](consistency.md).

## Find undocumented behavior

List implemented, observable behavior with no corresponding requirement:
routes and views, API endpoints, commands and flags, validations, permissions,
defaults, side effects, notifications, and scheduled jobs. Exclude internal
helpers, refactoring, and incidental implementation detail. Check candidates
against all of the project's requirements, including deprecated ones, not only
those in scope; if one matches a deprecated requirement, say so. When
reconciling a subset, look only at the code for that scope.

## Report

Lead with the project, instance, scope, commit (`git rev-parse --short HEAD`),
and a count per category. Link each ref to its `webUrl`. Give locations as
repository-relative `path:line`, with the function when useful. Quote the
requirement text a finding depends on, and describe the concrete difference,
not just "doesn't match".

```markdown
## Passing

- [REQ 1.2](url): matches `src/auth.ts:42` (`login`)

## Inconsistent

- [REQ 1.3](url) Spec says: "…" Implementation does: … Location: `path:line`
  Actions: change the code to …, or update the requirement to …

## Missing

- [REQ 2.1](url) Spec says: "…" No implementation found (searched: …).
  Actions: implement it, or deprecate or delete the requirement.

## Unverified

- [REQ 3.4](url) Spec says: "…" Cannot be determined because … Verify by …

## Undocumented behavior

- `path:line` (`function`) Implementation does: … No corresponding requirement.
  Actions: add `[State-based] If …` (Source: …) to feature 4, or remove the
  behavior.

## Other findings

- `REQ` comments citing unknown or deprecated refs.
- SpecHub `status` that contradicts a finding, such as `Passing` on an
  Inconsistent or Missing requirement.
- Requirements that contradict each other, so the code cannot satisfy both.
```

Keep Passing entries to one line each. Offer every plausible action without
choosing between them; the user decides whether the code or the requirement is
right. Draft proposed requirements per
[requirement authoring](requirement-authoring.md), with a formulation label
and source, only for behavior that serves a product purpose; ask for their
release only when the user chooses to add them. The report goes in the conversation; for a long report, offer to save it to a
file.

## Follow-up

Act only on findings the user selects. Requirement changes follow the release
and change rules in `SKILL.md`, and every SpecHub write, including a status
update, needs write confirmation. Code fixes follow the linked-repository rules,
including `REQ` comments.

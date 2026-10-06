# Requirement consistency

Check a project's requirements against each other and against the project's
roles, entities, and releases, and produce an actionable report. This is a
read-only audit of SpecHub data: it changes nothing and does not read the
implementation. To compare requirements with code, follow
[reconciliation](reconciliation.md); check consistency first when the
requirements are in doubt, because no implementation can satisfy requirements
that contradict each other.

The audit reports what the requirements state inconsistently. Behavior that
no requirement states is an omission, not an inconsistency, and is out of
scope.

## Prepare

1. Identify the project and instance. In a linked repository, run
   `./scripts/show-link.js <repo-path>`; otherwise ask which project to check.
2. Load project context for roles, entities and fields, features, and
   releases.
3. Agree on scope: the whole project, or a feature, epic, release, or refs.
   Scope selects the requirements under review, not what they are compared
   with: contradictions often cross features, so compare each requirement in
   scope with every active requirement in the project. For more than about 50
   requirements in scope, suggest checking one feature or epic at a time.
4. Export the whole project, without filters:
   `./scripts/export-requirements.js <project> --output <file>`, saving to a
   temporary directory, not the repository. Its description, notes, and
   acceptance criteria are the requirement; notes may begin with description
   overflow. Each heading links the ref to its `webUrl`. Deprecated
   requirements are excluded: they no longer state intended behavior.

## Index the claims

Conflicting requirements usually sit in different features, so reading the
export from top to bottom misses them. First record what each active
requirement claims, in a working file in the temporary directory:

- **Subjects:** the entity, field, role, view, route, event, or quantity it
  governs.
- **Actor:** the role or system component that acts.
- **Condition:** the triggering event, state, or scope.
- **Assertion:** what it permits, prevents, limits, performs, or displays.
- **Values:** numbers, bounds, units, defaults, orderings, and named options.
- **Release:** its release, and whether that release is shipped.

Index notes and each acceptance criterion as separate claims when they
assert something the description does not. The source states purpose, not
behavior: use it to understand intent, not as a claim to compare.

Then group the claims by the narrowest subject they share: a field, an
operation on an entity, an event, a quantity, a view, or a route, not a whole
entity. Use the entity and role names from project context. A claim with
several subjects belongs to each group.

When two names may denote one thing, such as "reply" and "comment", compare
the groups with each other anyway and record the terminology question. A
finding that holds only if the names mean the same thing is at most a
Possible contradiction.

A requirement with no identifiable subject, actor, or assertion cannot be
compared. Record what is missing and report it as Not comparable; do not
supply the missing part yourself.

## Check

**Within each requirement.** Compare the description, notes, and acceptance
criteria with each other for differing values, roles, or conditions.

**Between requirements.** Within each group, compare every requirement in
scope with the others:

- Opposite outcomes: one permits or performs what another prevents.
- Different values: bounds, units, defaults, or orderings for one quantity.
- Competing responses: responses to one event or state that cannot both occur.
- Shared identifiers: one route, name, or key assigned to different things.
- Repetition: the same behavior stated more than once, or one requirement
  that contains another.

**Against the project.** Compare each requirement in scope with project
context:

- Roles it names that the project does not define.
- Entities, fields, or options it names that do not exist, and assumptions
  that a field's type, required flag, options, default, or validations
  contradict. Context gives entity UUIDs and field names and types only: read
  `./scripts/get-entity.js <project> <uuid>`, or `GET /api/v1/entity/{id}` for
  options, defaults, and validations, which the script does not print.
- Entities it depends on that are assigned only to a later release.

## Classify each finding

Two requirements conflict only where their conditions overlap, so compare
role, state, and scope before reporting. Reread both in full first: notes or
acceptance criteria may hold the condition that removes the conflict. A later
release does not remove a conflict: requirements in different releases
conflict until the earlier one is deprecated.

Report each finding once, in the first category that fits:

- **Contradiction:** the requirements, or parts of one requirement, cannot
  both hold under any reasonable reading.
- **Possible contradiction:** they conflict under at least one reasonable
  reading. State the reading under which they conflict, the reading under
  which they do not, and the question that settles it. This includes a
  specific requirement that makes an exception the general one does not
  allow for.
- **Duplicate:** the same behavior is required more than once. State any
  difference in detail, since duplicates drift apart when only one is edited.
- **Mismatch:** the requirement conflicts with the project's roles, entities,
  fields, or releases.
- **Not comparable:** the requirement is too vague to index. State what is
  missing.

Report each conflict as-is. Do not decide which requirement is right,
reinterpret one to fit the other, or use the implementation to settle it.
Report conflicts between what the requirements state, not between
consequences inferred from them: when a conflict rests on an assumption the
text does not make, name the assumption and report at most a Possible
contradiction. Do not report differences in wording or level of detail that
leave the behavior the same.

## Report

Lead with the project, instance, scope, the number of requirements in scope,
the number of findings per category, and any check that could not be
completed. Link each ref to its `webUrl`. Quote the text a finding depends
on, and describe the concrete conflict, not just "inconsistent". Give each
requirement's release and whether it is shipped, since that decides how it
may be changed: under the change rules in `SKILL.md`, a requirement in a
shipped release is replaced and deprecated rather than edited.

```markdown
## Contradictions

- [REQ 2.4](url) (release 1.0, shipped) says: "…"
  [REQ 7.1](url) (release 1.2) says: "…"
  Conflict: both set the session timeout, to 30 and to 60 minutes.
  Actions: change REQ 7.1 to …, or replace REQ 2.4 with … and deprecate it.
- [REQ 1.3](url) (release 1.1) says: "…" Its acceptance criterion 2 says: "…"
  Conflict: the description locks the account after 5 attempts, the criterion
  after 3.
  Actions: change the description to …, or change the criterion to …

## Possible contradictions

- [REQ 3.2](url) (release 1.1) says: "…"
  [REQ 3.9](url) (release 1.1) says: "…"
  Conflict if: "users" in REQ 3.2 includes blocked users.
  No conflict if: …
  Question: …
  Actions: add the exception to REQ 3.2, or …

## Duplicates

- [REQ 4.1](url) and [REQ 9.3](url) both require …; only REQ 9.3 states …
  Actions: delete one, deprecate one with the other as its replacement, or
  narrow REQ 4.1 to …

## Mismatches

- [REQ 5.2](url) says: "…" The project defines: `status` with options …
  Actions: change the requirement to …, or add the option to the field.

## Not comparable

- [REQ 6.1](url) says: "…" Missing: the actor and an observable result.

## Other findings

- Terminology: different names for one thing, or one name for different
  things, with the refs that use each.
- References to behavior, views, or requirements that no active requirement
  defines.

## Cleared

- [REQ 2.5](url) and [REQ 6.3](url) limit the title to 120 and to 80
  characters; REQ 6.3 applies to email subject lines only.
```

Omit requirements with no findings. Under Cleared, list in one line each the
pairs that look like conflicts but are not, so a reader can tell a cleared
pair from a missed one.

Offer every plausible action without choosing between them; the user decides
which requirement is right. Draft proposed wording per
[requirement authoring](requirement-authoring.md), with a formulation label
and source, and change only what the finding requires. Where a draft needs a
decision or a purpose that only the user can supply, such as which role or
value to use, leave a marked placeholder instead of inventing one. The report
goes in the conversation; for a long report, offer to save it to a file.

## Follow-up

Act only on findings the user selects. Requirement changes follow the release
and change rules in `SKILL.md`, and every SpecHub write needs write
confirmation.

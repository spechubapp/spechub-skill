# Requirement authoring

Applies to every drafted, reviewed, or improved requirement, including
improvement- and standardization-API suggestions. Based on
[SpecHub core concepts](https://spechub.app/docs/core-concepts).

## Five formulation types

Angle brackets mark text to replace. Use present-tense, observable behavior;
qualifiers must not introduce another behavior.

### Simple

Baseline system functionality without a condition, role restriction, or event
trigger.

Canonical form: `The application <baseline behavior>.`

Example: The application initializes new environments with the countries
Canada, Japan, and China.

### User role capability

A capability available to a specific project role. Name that role explicitly.

Canonical form: `<user role> can <perform one action> [within a defined scope].`

Example: Administrators can delete any project from the project list view.

This describes permission or capability. A prohibition belongs under
Constraint; a system response to exercising the capability is Event-triggered.

### Event-triggered

A system response to a discrete user or system action. Merely loading or
viewing a page is not a qualifying event.

Canonical form: `When <discrete action occurs>, the application <response>.`

Example: When a user creates a feature, the application logs it in the project
activity feed.

Name the action and one resulting response. Do not disguise an ongoing state
as an event by prefixing it with “When.”

### Constraint

A prohibition or limit on what the system is allowed to do.

Canonical forms: `The application prevents <prohibited behavior> [under a
defined condition].` or `The application limits <quantity or operation> to
<explicit bound>.`

Example: The application prevents authentication for users whose accounts
have been blocked.

A condition may scope a constraint without changing its type: the main
assertion is still a prohibition or limit.

### State-based

A behavior or appearance that applies whenever a specified system or data state
is true, rather than as a response to a discrete action.

Canonical form: `If <state or data condition is true>, the application
<behavior or appearance>.`

Example: If a user has sold more than 100 items, the application displays a
top-seller badge next to their avatar.

Use this type for conditional visibility, appearance, and ongoing behavior.
Specify the condition itself rather than a passive page-view trigger.

## Purpose

Every requirement must add real value in defining the product. Before
drafting one, state why the product needs it: the user need, business rule,
risk, or decision it serves. If there is no concrete reason, or another
requirement already covers it, do not propose it.

Put that reason in `source` (`--source` in the scripts) as one or two short
sentences, and show it with each proposal. Explain why, not what: do not
restate the description. For example:

> [Constraint] The application prevents authentication for users whose
> accounts have been blocked.
> Source: Blocking must cut off access at once to contain compromised or
> abusive accounts.

When improving a stored requirement, keep its `source` unless the purpose
changes; propose one if it is empty.

## Standardization

<!-- REQ 14.8, REQ 14.9, REQ 14.10, REQ 12.8 -->

Before presenting requirements you drafted or rewrote, including proposals in
consistency and reconciliation reports, standardize them:
`./scripts/standardize-requirements.js <project> <draft>...`, at most 20 per
run. SpecHub rewrites each draft into a formulation type using the project's
roles, entities, and fields. It changes no data and needs no write
confirmation.

Present the standardized text, checked as below like any draft. Keep your
draft instead, and say why, when the rewrite changes its meaning, drops a
condition or bound, or names a role, entity, or field the project does not
define. If standardization fails, present your drafts and say they are not
standardized. Stored requirements and improvement-API suggestions are not
re-standardized.

## Classification and quality

Classify each proposal by its main assertion into exactly one type; split or
rewrite anything that needs more than one. Label drafts, e.g.
`[State-based] If ...`; if the output omits labels, still classify every item
before presenting it. In reviews, flag nonconforming items and propose
classified replacements; never silently rewrite stored requirements.

Before presenting each requirement, confirm it uses its type's canonical form
and the project's roles and terminology, and that it is:

- **Atomic:** one independently testable behavior or constraint. Split separate
  outcomes that could pass or fail independently.
- **Objective:** observable system behavior, not an opinion such as “easy” or
  “intuitive.”
- **Unambiguous:** a specific actor, action, scope, and any necessary condition
  or bound. Use project roles and terminology; ask for missing business rules
  instead of inventing them.
- **Verifiable:** a clear pass/fail test with defined inputs or conditions and
  an observable result.

For example, saving a document within two seconds and displaying a confirmation
are separate behaviors: write one Event-triggered requirement for the save
timing and another for the confirmation. “And” in a value list, such as the
countries in the Simple example, does not itself violate atomicity.

Formulation type describes sentence structure. It is **not** the API
`requirementType`, whose categories are `Functional`, `Design`, and
`Performance`. Choose that category independently; never send formulation
labels as API category values or insert draft labels into stored descriptions.

Recheck the final description after edits or length splitting; keep the
behavior and essential conditions in it and supporting detail in notes.

## Views and routes

For each feature that needs an application view, write a separate requirement
describing that view's URL pattern. Assign the route requirement to the view's
primary feature and the secondary feature named `URLs (routes)`; create that
feature if the project lacks it. Use application-wide UUIDs for IDs in paths,
and prefer `/<entity>/<id>` for entity detail views. This application has no
organization segment, so omit `<org>` from every route. For example: “The
application routes release detail views at `/releases/<id>`.” Classify route requirements and assign their release like
any other.

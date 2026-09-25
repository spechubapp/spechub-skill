# Requirement authoring

Read this reference before drafting, suggesting, reviewing, or improving
requirements, including suggestions returned by the improvement API.

Based on [SpecHub core concepts](https://spechub.app/docs/core-concepts), with
canonical templates and the mandatory classification and preflight rules below.
Use the project's context for its roles, terminology, entities, and release
scope, as required by [SKILL.md](../SKILL.md#project-context-and-analysis).

## Five formulation types

Every proposed requirement must use exactly one of these types. Angle brackets
in the templates indicate text to replace. Use present-tense, observable
behavior; optional context qualifiers must not introduce another behavior.

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

## Classification and quality

Assign exactly one formulation type to each proposal. Classify by the main
assertion: baseline behavior, role capability, action response, prohibition or
limit, or state-dependent behavior. If a statement needs multiple types,
rewrite or split it until each requirement fits one canonical form.

Label drafts with the type, for example `[State-based] If ...`. If the requested
output omits labels, perform an explicit classification pass over every item
before presenting it. For reviews, identify nonconforming items and propose
classified replacements; do not silently rewrite stored requirements.

Each requirement must be:

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

## Preflight checklist

Before presenting each proposed requirement, verify:

- Does it match exactly one of the five types?
- Does it use the canonical structure?
- Does it express one independently testable behavior?
- Does it use project roles and terminology?
- Does it avoid combining separate behaviors with “and”?

Revise any failing item before presenting it. Recheck the final description
after edits or length splitting so its behavior and essential conditions remain
clear and testable; use notes for supporting detail.

## Views and routes

For each feature that needs an application view, write a separate requirement
describing that view's URL pattern. Assign the route requirement to the view's
primary feature and the secondary feature named `URLs (routes)`; create that
feature if the project lacks it. Use application-wide UUIDs for IDs in paths,
and prefer `/<entity>/<id>` for entity detail views. This application has no
organization segment, so omit `<org>` from every route. For example: “The
application routes release detail views at `/releases/<id>`.” Classify each
route requirement under one of the five formulation types and include its
release number like any other proposal.

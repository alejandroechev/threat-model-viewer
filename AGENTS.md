# Threat Model Viewer

## Description

Standalone web app to view Microsoft Threat Modeling Tool (`.tm7`) files. Load a file from disk or paste its XML contents directly into a textarea — everything runs client-side in the browser. Deployed as a static site on GitHub Pages.

## Code Implementation Flow

### Pre-Development
- **Read ADRs** Before starting any development work, read all Architecture Decision Records in `docs/adrs/` to understand existing design decisions and constraints. Do not contradict or duplicate existing ADRs without explicit user approval.

### Architecture
- **TypeScript** Use TypeScript as default language, unless told otherwise.
- **Web-only** This is a standalone web app — no desktop wrapper (Tauri), no mobile build, no Automerge / sync. Everything runs client-side in the browser.
- **Static deployment** The app is deployed as a static site to GitHub Pages via the `deploy.yml` workflow. No backend, no server-side state.
- **Domain Logic Separation** Separate domain logic (TM7 parsing, model, rendering math) from React UI. Domain code must be plain TypeScript, framework-agnostic, and unit-testable without a DOM where possible.
- **No file persistence** The app does not persist anything across reloads. Each session starts fresh; the user provides input (file or pasted XML) every time.
- **Language Convention** UI text visible to users is in English. All code (variables, functions, types, comments), documentation, and test descriptions are in English.
- **UI Iconography** Use **Heroicons** via `@heroicons/react` instead of emoji or raw Unicode glyphs for buttons, navigation, banners, and status chips.

### Git Workflow
- **Work directly on master** — solo developer, no branch overhead.
- **Commit after every completed unit of work** — never leave working code uncommitted.
- **Push after each work session** — remote backup is non-negotiable. Remote: https://github.com/alejandroechev/threat-model-viewer.git
- **Tag milestones**: `git tag v0.1.0-mvp` when deploying or reaching a checkpoint.

### Coding — TDD Workflow (strict, per-function)

1. **RED** — Write a failing test FIRST. Run it. Confirm it fails.
2. **GREEN** — Write the MINIMUM implementation to make the test pass. Run the test.
3. **REFACTOR** — Clean up. Run the test again.
4. Repeat for the next behavior/function.

Domain-layer code (TM7 parser, model transforms, rendering math) is the primary target for TDD with Vitest.

### Documentation
- **Docs hierarchy**: ADRs are the source of truth for architecture decisions, README is the public summary, AGENTS.md contains process rules only. Avoid duplicating design detail across all three.
- **README** Update with any relevant public-facing change.
- **System Diagram** Keep `docs/system-diagram.md` up to date.
- **ADR** Add an ADR in `docs/adrs/` for every major design decision.
- **Docs sync** After every feature, review `git diff --stat` against README, system diagram, and ADRs. Update what is stale.

### Commit Checklist

Before `git commit`:
- [ ] Source files have corresponding test files (for domain logic).
- [ ] All tests pass: `npm test`.
- [ ] Zero type errors: `npm run typecheck`.
- [ ] Zero lint errors: `npm run lint`.
- [ ] Every new function/component built with TDD (red → green → refactor).
- [ ] README updated (if public-facing change).
- [ ] System diagram updated (if architecture changed).
- [ ] ADR written (if major design decision).

### Release Completion Gate

After pushing, do not consider work complete until:
- the CI workflow (`ci.yml`) passes,
- and the `deploy.yml` workflow successfully publishes to GitHub Pages.

Check workflow status with `gh run list --limit 5` and `gh run watch <run-id>`.

## Reference

The original prototype with full canvas/rendering/presentation logic lives at
`C:\Local\Code\ai-tools\_experiments\threat-model`. Use it as a reference for
the TM7 parser, model types, and rendering — but adapt for the web-only,
viewer-only scope of this project.

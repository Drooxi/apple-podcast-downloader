# Project Working Rules

This folder is the working reference for future changes to the project.

## Mandatory workflow

Before any code change or design decision:

1. Read every Markdown file in `docs/`.
2. Inspect the code and configuration affected by the proposed change.
3. Check the current status and recent Git history.
4. Update the relevant documentation if the intended behavior, architecture, interface, or known risks change.

After every code change:

1. Update the affected Markdown files in `docs/`.
2. Add an entry to `CHANGELOG.md` when the change is user-visible or architectural.
3. Re-check the documented file paths, commands, IPC contracts, and test status.
4. Run the smallest relevant validation and record its result when useful.

## Documentation boundaries

- `PROJECT_OVERVIEW.md` describes the product purpose, current scope, and runtime behavior.
- `ARCHITECTURE.md` describes processes, data flow, file responsibilities, and IPC contracts.
- `DECISIONS.md` records durable technical and product decisions.
- `CHANGELOG.md` records documentation and implementation milestones.
- `README.md` is the public project documentation; it is not a replacement for these internal working notes.

## Current baseline

- The application is a local Electron desktop application with a React/Vite renderer.
- The project has one hard-coded podcast identifier and one download workflow.
- The renderer communicates with Node/Electron only through the preload bridge.
- No installer or packaging workflow is currently implemented.
- Documentation must remain aligned with the code, even when a change is small.

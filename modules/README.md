# Modules Architecture

The `modules` directory is organized by business domain. A module owns its
server actions, validation schemas, helpers, UI components, and local types.

## Module Contract

Use this structure for new or refactored modules:

```text
modules/<domain>/
  actions/      Server actions and mutations grouped by responsibility
  components/   React components owned by the domain
  helpers/      Pure domain helpers, no React and no request/session state
  types/        TypeScript types and validation schemas
```

Small modules can stay flatter temporarily, but new code should move toward the
same boundaries.

## Responsibilities

- `app/` wires routes, layouts, and data loading for pages.
- `modules/<domain>/actions` is the public server-action API for the domain.
- `modules/<domain>/components` contains UI for that domain only.
- `modules/<domain>/helpers` contains reusable domain logic.
- `modules/<domain>/types` contains shared types and validation schemas.
- `lib/` contains cross-domain infrastructure only: Prisma, auth primitives,
  upload, formatting, constants, and generic utilities.

## Import Rules

- Prefer public module entrypoints such as `@/modules/orders/actions`.
- Avoid importing deep implementation files from outside a module.
- Cross-module imports are allowed only through public entrypoints or helpers.
- Validation belongs at server boundaries before data reaches Prisma.
- Client-side validation is for UX; server-side validation is authoritative.

## Current Migration Notes

- `orders` and `products` already expose action façades.
- `settings`, `logistics`, `auth`, `crm`, `marketing`, and `media` still contain
  flat action files and should be migrated gradually.
- Keep compatibility wrappers while moving files, then update imports in small
  batches.

# Backstage ADR Plugin

A Backstage plugin for managing Architecture Decision Records (ADRs) with organization-wide visibility, full CRUD capabilities, and GitHub integration via Pull Requests.

## Features

- **Centralized ADR Management** - Organization-wide view of all ADRs via sidebar navigation
- **GitHub Integration** - ADR changes create Pull Requests for review
- **Multiple Formats** - Support for MADR v3, Nygard format, and custom templates
- **Full CRUD** - Create, read, update, and delete ADRs through the UI
- **Advanced Search** - Full-text search with filters by status, tags, date, and more
- **Visualizations** - Dashboard with stats and timeline views
- **Entity Linking** - Connect ADRs to Backstage catalog entities

## Packages

| Package | Description |
|---------|-------------|
| `@backstage-community/plugin-adr` | Frontend plugin with React components |
| `@backstage-community/plugin-adr-backend` | Backend plugin with API and GitHub integration |
| `@backstage-community/plugin-adr-common` | Shared types and utilities |

## Installation

### Backend

Add the backend plugin to your Backstage backend:

```typescript
// packages/backend/src/index.ts
import { createBackend } from '@backstage/backend-defaults';

const backend = createBackend();

// ... other plugins

backend.add(import('@backstage-community/plugin-adr-backend'));

backend.start();
```

### Frontend

1. Install the frontend plugin:

```bash
yarn --cwd packages/app add @backstage-community/plugin-adr
```

2. Add the ADR page to your app routes:

```tsx
// packages/app/src/App.tsx
import { AdrPage } from '@backstage-community/plugin-adr';

const routes = (
  <FlatRoutes>
    {/* ... other routes */}
    <Route path="/adr" element={<AdrPage />} />
  </FlatRoutes>
);
```

3. Add the sidebar item:

```tsx
// packages/app/src/components/Root/Root.tsx
import DescriptionIcon from '@material-ui/icons/Description';

export const Root = ({ children }: PropsWithChildren<{}>) => (
  <SidebarPage>
    <Sidebar>
      {/* ... other items */}
      <SidebarItem icon={DescriptionIcon} to="adr" text="Decision Records" />
    </Sidebar>
    {children}
  </SidebarPage>
);
```

## Configuration

### Catalog Annotation

Add the ADR location annotation to your catalog entities:

```yaml
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/adr-location: ./docs/decisions
```

### App Config (optional)

```yaml
# app-config.yaml
adr:
  defaults:
    template: madr-v3
    branch: main
  categories:
    - security
    - infrastructure
    - api-design
  ui:
    defaultView: dashboard
```

## ADR Statuses

| Status | Description |
|--------|-------------|
| `draft` | Work in progress, not yet proposed |
| `proposed` | Under discussion/review |
| `accepted` | Approved and active |
| `rejected` | Considered but not accepted |
| `deprecated` | No longer relevant but kept for history |
| `superseded` | Replaced by another ADR |

## Supported ADR Formats

### MADR v3 (Recommended)

```markdown
---
status: accepted
date: 2024-01-15
decision-makers:
  - Jane Doe
tags:
  - api
---

# Use OAuth 2.0 for API Authentication

## Context and Problem Statement

We need to decide on an authentication mechanism for our public API.

## Decision Outcome

Chosen option: "OAuth 2.0" because it provides...
```

### Nygard (Classic)

```markdown
# 1. Record architecture decisions

Date: 2024-01-15

## Status

Accepted

## Context

We need to record the architectural decisions made on this project.

## Decision

We will use Architecture Decision Records.

## Consequences

All significant decisions will be documented.
```

## Development

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests
yarn test

# Lint code
yarn lint
```

## Documentation

- [Design Specification](docs/DESIGN.md) - Complete functional and technical requirements

## References

- [Backstage Plugin Development](https://backstage.io/docs/plugins/)
- [MADR - Markdown Architectural Decision Records](https://adr.github.io/madr/)
- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's ADR Blog Post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)

## License

Apache 2.0

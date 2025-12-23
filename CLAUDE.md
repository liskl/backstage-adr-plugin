# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Backstage plugin monorepo for managing Architecture Decision Records (ADRs). It provides organization-wide ADR visibility with GitHub integration for PR-based workflows.

## Commands

```bash
# Install dependencies
yarn install

# Build all packages
yarn build

# Run tests across all packages
yarn test

# Lint all packages
yarn lint

# Type check
yarn tsc

# Build/test/lint a single package
yarn workspace @backstage-community/plugin-adr build
yarn workspace @backstage-community/plugin-adr-backend test
yarn workspace @backstage-community/plugin-adr-common lint
```

## Architecture

### Package Structure

The monorepo contains three packages in `plugins/`:

| Package | Role | Purpose |
|---------|------|---------|
| `adr-common` | common-library | Shared TypeScript types (`Adr`, `AdrStatus`, `AdrTemplate`, etc.) |
| `adr-backend` | backend-plugin | REST API (15 endpoints), GitHub service, ADR parsing |
| `adr` | frontend-plugin | React components for dashboard, list, and detail views |

### Data Flow

```
Catalog Entities (with backstage.io/adr-location annotation)
    ↓
Backend: AdrService scans GitHub repos via GitHubService
    ↓
Backend: Parses MADR/Nygard markdown, caches in memory
    ↓
REST API (/api/adr/*)
    ↓
Frontend: AdrClient → React components
```

### Key Backend Services

- **AdrService** (`plugins/adr-backend/src/service/AdrService.ts`): Core business logic, ADR parsing, caching, CRUD operations
- **GitHubService** (`plugins/adr-backend/src/service/GitHubService.ts`): GitHub API wrapper for file operations and PR creation

### Key Frontend Components

**Core Views:**
- **AdrDashboardPage**: Stats cards + tabbed dashboard/list view + pending PRs + advanced filters
- **AdrDetailPage**: Markdown rendering with metadata sidebar + edit/delete/status actions
- **AdrList**: Paginated table with search and status filters
- **AdrStatusBadge**: Color-coded status chip

**Filter Components** (`components/AdrFilterBar/`):
- **AdrFilterBar**: Comprehensive filter bar with search, status, date range, author, and repository filters; includes saved preset management and active filter chips

**Editor Components** (`components/AdrEditor/`):
- **AdrEditorPage**: Step-by-step wizard for create/edit (Template → Metadata → Content → Review)
- **AdrMarkdownEditor**: Split-view markdown editor with live preview and formatting toolbar
- **AdrMetadataForm**: Form for ADR metadata (title, status, authors, tags, category)
- **AdrTemplateSelector**: Radio button selection for MADR v3, Nygard, custom templates

**Action Components** (`components/AdrActions/`):
- **AdrDeleteDialog**: Confirmation dialog requiring "delete" to be typed
- **AdrStatusChangeDialog**: Visual status transition with dropdown selection
- **AdrPrStatusCard**: PR status display (Open/Closed/Merged)
- **AdrPendingPrsList**: List of pending PRs for dashboard

### API Endpoints

All endpoints under `/api/adr/`:
- `GET /adrs` - List with filters/pagination
- `GET /adrs/:id` - Single ADR
- `POST/PUT/DELETE /adrs` - CRUD (creates PRs)
- `GET /search`, `/tags`, `/categories`, `/stats` - Discovery
- `GET /authors` - List unique ADR authors
- `GET /repositories` - List unique ADR repositories
- `GET /templates` - Available ADR templates

## ADR Format Support

The plugin parses two formats:

1. **MADR v3**: YAML frontmatter with `status`, `date`, `decision-makers`, `tags`
2. **Nygard**: Classic format with `## Status`, `## Context`, `## Decision`, `## Consequences` sections

Detection is automatic based on content structure.

## Development Status

- **Phase 1 (Core Foundation)**: Complete - Basic ADR model, GitHub integration, list/detail views
- **Phase 2 (CRUD & PR Workflow)**: Complete - Editor, create/edit/delete dialogs, PR tracking
- **Phase 3 (Search & Organization)**: Complete - AdrFilterBar with date/author/repo filters, saved presets
- **Phase 4 (Dashboard & Visualizations)**: Next - Charts, timeline view, relationship graph

See `docs/DESIGN.md` for the full roadmap and requirements.

# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 2: CRUD & PR Workflow (in progress)

## [0.1.0] - 2024-12-22

### Added

#### Documentation
- Complete design specification (`docs/DESIGN.md`) with 14 functional requirements
- Technical architecture documentation for 3-package plugin structure
- API endpoint specifications (15 endpoints)
- Data model definitions with TypeScript interfaces
- Configuration schema for `app-config.yaml`
- Installation and usage guide in README

#### Package: @backstage-community/plugin-adr-common
- TypeScript types for ADR entities (`Adr`, `AdrSummary`, `AdrTemplate`)
- Status types (`draft`, `proposed`, `accepted`, `rejected`, `deprecated`, `superseded`)
- Format types (`madr-v3`, `madr-v2`, `nygard`, `custom`)
- Filter and pagination interfaces
- Entity reference types for catalog integration
- Utility functions for ADR annotation handling

#### Package: @backstage-community/plugin-adr-backend
- New Backend System plugin architecture
- REST API router with 15 endpoints:
  - ADR CRUD operations (`GET/POST/PUT/DELETE /adrs`)
  - Search and filtering (`GET /search`, `/tags`, `/categories`)
  - Statistics (`GET /stats`)
  - Templates (`GET /templates`)
  - Relationships (`GET /adrs/:id/related`, `/entities`)
  - PR tracking (`GET /prs`)
- `GitHubService` for repository operations:
  - File listing and content retrieval
  - Branch creation
  - File create/update/delete
  - Pull request creation and status
- `AdrService` for business logic:
  - ADR discovery from catalog entities
  - Content parsing for MADR and Nygard formats
  - In-memory caching with automatic refresh
  - CRUD operations with PR workflow

#### Package: @backstage-community/plugin-adr
- Plugin definition with route configuration
- API client (`AdrClient`) with full type safety
- React components:
  - `AdrDashboardPage` - Main landing page with tabs
  - `AdrStatsCards` - Status statistics display
  - `AdrList` - Paginated list with search and filters
  - `AdrStatusBadge` - Color-coded status indicator
  - `AdrDetailPage` - Full ADR view with metadata sidebar
  - `AdrRouter` - Route handling for plugin pages

#### Configuration
- Monorepo setup with Yarn workspaces
- TypeScript project references
- Catalog annotation support (`backstage.io/adr-location`)

### Technical Details
- 34 files, ~4,300 lines of code
- Backstage New Backend System compatible
- React 17/18 compatible
- Material-UI v4 components

[Unreleased]: https://github.com/liskl/backstage-adr-plugin/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/liskl/backstage-adr-plugin/releases/tag/v0.1.0

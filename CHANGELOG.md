# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 4: Dashboard & Visualizations (planned)

## [0.3.0] - 2024-12-22

### Added

#### Phase 3: Search & Organization

**AdrFilterBar Component**
- New comprehensive filter bar component with search and advanced filters
- Full-text search input with debounced updates
- Status dropdown filter with multi-select support
- Expandable filter panel for advanced options
- Compact mode for space-constrained layouts

**Date Range Filters**
- Created After/Before date filters
- Updated After/Before date filters
- Date picker inputs with proper date formatting

**Author & Repository Filters**
- Author dropdown populated from ADR authors
- Repository dropdown for multi-repo filtering
- New API endpoints: `GET /authors`, `GET /repositories`

**Saved Filter Presets**
- Built-in presets: "Active Decisions", "Pending Review", "Updated Recently"
- Custom preset creation via dialog
- Preset deletion for user-created presets
- localStorage persistence for user presets

**Active Filters Display**
- Visual chips showing all active filters
- Individual filter removal via chip delete
- "Clear All Filters" button
- Hide/Show toggle for expanded filter panel

**Dashboard Integration**
- AdrFilterBar integrated into AdrDashboardPage
- Filters persist across dashboard/list tab switches
- Author and repository lists fetched from API

#### New Components
- `AdrFilterBar` - Comprehensive search and filter component

#### New API Endpoints
- `GET /api/adr/authors` - List all unique ADR authors
- `GET /api/adr/repositories` - List all unique ADR repositories

#### Tests
- 27 new tests for AdrFilterBar component
- Updated router tests for new endpoints
- Updated AdrService tests for getAuthors/getRepositories
- Total: 102 tests across all packages

### Technical Details
- ~600 lines of new component code
- Full TypeScript type safety
- localStorage for preset persistence
- Material-UI Select, TextField, Chip components

## [0.2.0] - 2024-12-22

### Added

#### Phase 2: CRUD & PR Workflow

**ADR Editor Component**
- `AdrMarkdownEditor` - Split-view markdown editor with live preview
- Toolbar with formatting buttons (bold, italic, code, links, lists, headings)
- Three view modes: Write, Preview, Split
- Syntax highlighting and GitHub-flavored markdown support

**Create ADR Wizard**
- `AdrEditorPage` - Step-by-step wizard for creating new ADRs
- Template selection step (MADR v3, Nygard, custom)
- Metadata form with title, status, authors, tags, category
- Content editing with markdown preview
- Review step before submission
- Automatic PR creation on submit

**Edit ADR Functionality**
- Integrated with `AdrEditorPage` for editing existing ADRs
- Pre-populated form with existing ADR data
- Edit button on ADR detail page
- PR creation for changes

**Delete ADR Functionality**
- `AdrDeleteDialog` - Confirmation dialog with safety check
- Requires typing "delete" to confirm
- Creates PR to remove ADR from repository

**Status Change**
- `AdrStatusChangeDialog` - Visual status transition dialog
- Shows current and new status badges
- Dropdown with all status options and descriptions
- Creates PR for status updates

**PR Status Tracking**
- `AdrPrStatusCard` - Card showing PR details and status
- `AdrPendingPrsList` - List of pending PRs on dashboard
- Open, Closed, and Merged status indicators
- Links to GitHub PRs

**Dashboard Updates**
- "Create ADR" button in header
- Pending Pull Requests section
- Navigation to create/edit pages

#### New Components
- `AdrMarkdownEditor` - Markdown editor with preview
- `AdrMetadataForm` - ADR metadata input form
- `AdrTemplateSelector` - Template selection for new ADRs
- `AdrDeleteDialog` - Delete confirmation dialog
- `AdrStatusChangeDialog` - Status change dialog
- `AdrPrStatusCard` - PR status display card
- `AdrPendingPrsList` - Pending PRs list

#### Tests
- 4 new test files for Phase 2 components
- 34 new tests added
- Total: 123 tests across 12 test suites

### Technical Details
- 12 new component files added
- ~1,800 lines of new code
- Full TypeScript type safety maintained

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

[Unreleased]: https://github.com/liskl/backstage-adr-plugin/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/liskl/backstage-adr-plugin/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/liskl/backstage-adr-plugin/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/liskl/backstage-adr-plugin/releases/tag/v0.1.0

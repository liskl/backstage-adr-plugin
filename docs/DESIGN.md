# Backstage ADR Plugin - Design Specification

## 1. Overview

### 1.1 Purpose
Build a new Backstage plugin for managing Architecture Decision Records (ADRs) with organization-wide visibility, full CRUD capabilities, and GitHub integration via Pull Requests.

### 1.2 Goals
- Provide a centralized view of all ADRs across the organization
- Enable creation, editing, and management of ADRs through the Backstage UI
- Integrate with GitHub using PR-based workflows for change management
- Support multiple ADR formats (MADR, Nygard, custom)
- Offer advanced search, filtering, and visualization capabilities

### 1.3 Non-Goals (Out of Scope for v1)
- Support for GitLab, Bitbucket, Azure DevOps (future versions)
- Offline editing capabilities
- Real-time collaborative editing
- AI-assisted ADR generation

---

## 2. Functional Requirements

### 2.1 Core Features

#### FR-01: Sidebar Navigation
- Top-level "Decision Records" item in Backstage sidebar
- Icon and label consistent with Backstage design system

#### FR-02: ADR Discovery
- Discover ADRs from repositories via catalog annotation: `backstage.io/adr-location`
- Annotation value specifies path to ADR directory (relative or absolute)
- Index ADRs from all annotated entities in the catalog

#### FR-03: ADR Formats
Support multiple ADR templates:
- **MADR v3** (Markdown Architectural Decision Records with YAML frontmatter)
- **Nygard format** (original simple format: Status, Context, Decision, Consequences)
- **Custom templates** (user-definable)

#### FR-04: ADR Statuses
Extended status workflow:
- `draft` - Work in progress, not yet proposed
- `proposed` - Under discussion/review
- `accepted` - Approved and active
- `rejected` - Considered but not accepted
- `deprecated` - No longer relevant but kept for history
- `superseded` - Replaced by another ADR (with link)

#### FR-05: CRUD Operations
- **Create**: New ADR via form/editor, generates PR to target repo
- **Read**: View rendered markdown with syntax highlighting
- **Update**: Edit ADR content, generates PR with changes
- **Delete**: Soft delete via status change or hard delete via PR

#### FR-06: PR Workflow
- All create/edit/delete operations create GitHub Pull Requests
- PR includes descriptive title and body
- Link back to Backstage ADR page in PR description
- Optional: auto-merge for certain changes (configurable)

#### FR-07: Search & Filtering
- Full-text search across ADR content
- Filters:
  - Status (draft, proposed, accepted, etc.)
  - Date range (created, modified)
  - Author/decision-makers
  - Repository/team
  - Tags/categories
- Saved filter presets

#### FR-08: Tags & Categories
- Categorize ADRs (e.g., "security", "infrastructure", "api-design")
- Custom tags per ADR
- Filter and group by tags

#### FR-09: ADR Relationships
**ADR-to-ADR:**
- `supersedes` - This ADR replaces another
- `superseded-by` - This ADR is replaced by another
- `relates-to` - General relationship
- `amends` - Modifies/extends another ADR

**ADR-to-Entity:**
- Link ADRs to catalog entities (services, components, APIs)
- Show related ADRs on entity pages (optional entity tab)

### 2.2 Views & Visualizations

#### FR-10: Dashboard View
- Statistics: total ADRs, by status, recent activity
- Recent ADRs list
- Pending reviews (PRs awaiting merge)
- Charts: status distribution, ADRs over time

#### FR-11: List View
- Paginated table of all ADRs
- Sortable columns: title, status, date, author, repository
- Quick actions: view, edit, change status

#### FR-12: Detail View
- Rendered markdown content
- Metadata sidebar (status, dates, authors, tags)
- Related ADRs and entities
- Edit/status change actions
- PR history

#### FR-13: Timeline View
- Chronological visualization of ADRs
- Filter by date range
- Show status changes over time

#### FR-14: Graph View
- Visual network of ADR relationships
- Node = ADR, Edge = relationship type
- Click to navigate to ADR detail
- Filter by relationship type

---

## 3. Non-Functional Requirements

### NFR-01: Performance
- ADR list page loads in < 2 seconds
- Search results return in < 1 second
- Support indexing 1000+ ADRs

### NFR-02: Security
- Respect GitHub repository permissions
- Only show ADRs from accessible repos
- Audit log for ADR modifications

### NFR-03: Scalability
- Efficient caching of ADR content
- Incremental indexing (only re-index changed files)
- Background sync jobs

### NFR-04: Usability
- Responsive design (desktop-first)
- Keyboard navigation support
- Accessibility (WCAG 2.1 AA)

---

## 4. Technical Architecture

### 4.1 Plugin Structure
```
plugins/
├── adr/                          # Frontend plugin
│   ├── src/
│   │   ├── api/                  # API client
│   │   ├── components/           # React components
│   │   │   ├── AdrDashboard/
│   │   │   ├── AdrList/
│   │   │   ├── AdrDetail/
│   │   │   ├── AdrEditor/
│   │   │   ├── AdrTimeline/
│   │   │   ├── AdrGraph/
│   │   │   └── AdrSidebar/
│   │   ├── hooks/                # Custom React hooks
│   │   ├── routes.ts
│   │   ├── plugin.ts
│   │   └── index.ts
│   └── package.json
│
├── adr-backend/                  # Backend plugin
│   ├── src/
│   │   ├── service/
│   │   │   ├── AdrService.ts     # Core business logic
│   │   │   ├── GitHubService.ts  # GitHub API integration
│   │   │   ├── IndexService.ts   # ADR indexing
│   │   │   └── SearchService.ts  # Search functionality
│   │   ├── router.ts             # API routes
│   │   ├── plugin.ts
│   │   └── index.ts
│   └── package.json
│
└── adr-common/                   # Shared types/utilities
    ├── src/
    │   ├── types.ts
    │   └── utils.ts
    └── package.json
```

### 4.2 Backend System
- Uses Backstage New Backend System
- Integrates with:
  - Catalog API (for entity relationships)
  - GitHub integration (via Backstage integrations)
  - Search API (for indexing ADRs in Backstage search)

### 4.3 Data Flow
```
GitHub Repo → Backend Indexer → Cache/Database → REST API → Frontend
                    ↓
              Search Index
```

### 4.4 Storage Strategy
- **Primary**: Git repositories (source of truth)
- **Cache**: In-memory or database cache for performance
- **Search**: Backstage search index for full-text search

---

## 5. Data Models

### 5.1 ADR Entity
```typescript
interface Adr {
  id: string;                    // Unique identifier
  title: string;                 // ADR title
  number: number;                // Sequential number (e.g., 0001)
  status: AdrStatus;             // Current status
  content: string;               // Raw markdown content
  format: AdrFormat;             // MADR, Nygard, custom

  // Metadata
  createdAt: string;             // ISO date
  updatedAt: string;             // ISO date
  authors: string[];             // GitHub usernames or names
  decisionMakers: string[];      // People who made the decision

  // Location
  repositoryUrl: string;         // GitHub repo URL
  filePath: string;              // Path within repo
  branch: string;                // Branch name

  // Organization
  tags: string[];                // Custom tags
  category: string;              // Primary category

  // Relationships
  supersedes: string[];          // ADR IDs this supersedes
  supersededBy: string | null;   // ADR ID that supersedes this
  relatesTo: string[];           // Related ADR IDs
  linkedEntities: EntityRef[];   // Backstage entity references
}

type AdrStatus = 'draft' | 'proposed' | 'accepted' | 'rejected' | 'deprecated' | 'superseded';
type AdrFormat = 'madr-v3' | 'madr-v2' | 'nygard' | 'custom';
```

### 5.2 ADR Template
```typescript
interface AdrTemplate {
  id: string;
  name: string;
  format: AdrFormat;
  sections: TemplateSection[];
  defaultContent: string;        // Markdown template
}

interface TemplateSection {
  name: string;
  required: boolean;
  description: string;
}
```

### 5.3 ADR Index Entry (for search)
```typescript
interface AdrIndexEntry {
  id: string;
  title: string;
  status: AdrStatus;
  excerpt: string;               // First 200 chars of content
  tags: string[];
  category: string;
  repository: string;
  updatedAt: string;
  searchText: string;            // Full text for search
}
```

---

## 6. API Endpoints

### 6.1 ADR Operations
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adr/adrs` | List all ADRs (with pagination, filters) |
| GET | `/api/adr/adrs/:id` | Get single ADR |
| POST | `/api/adr/adrs` | Create new ADR (creates PR) |
| PUT | `/api/adr/adrs/:id` | Update ADR (creates PR) |
| DELETE | `/api/adr/adrs/:id` | Delete ADR (creates PR) |
| PATCH | `/api/adr/adrs/:id/status` | Change ADR status |

### 6.2 Search & Discovery
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adr/search` | Full-text search |
| GET | `/api/adr/tags` | List all tags |
| GET | `/api/adr/categories` | List all categories |
| GET | `/api/adr/stats` | Dashboard statistics |

### 6.3 Templates
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adr/templates` | List available templates |
| GET | `/api/adr/templates/:id` | Get template content |

### 6.4 Relationships
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adr/adrs/:id/related` | Get related ADRs |
| GET | `/api/adr/adrs/:id/entities` | Get linked entities |
| POST | `/api/adr/adrs/:id/link` | Link to entity |

### 6.5 GitHub Integration
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adr/prs` | List pending PRs |
| GET | `/api/adr/prs/:id` | Get PR status |

---

## 7. UI Components

### 7.1 Pages
1. **AdrDashboardPage** - Main landing page with stats and recent ADRs
2. **AdrListPage** - Paginated list with filters
3. **AdrDetailPage** - Single ADR view
4. **AdrEditorPage** - Create/edit ADR
5. **AdrTimelinePage** - Chronological view
6. **AdrGraphPage** - Relationship visualization

### 7.2 Components
- `AdrCard` - Summary card for list views
- `AdrStatusBadge` - Status indicator
- `AdrMetadataSidebar` - Metadata panel
- `AdrMarkdownViewer` - Rendered content
- `AdrMarkdownEditor` - Edit with preview
- `AdrFilterBar` - Search and filter controls
- `AdrRelationshipPanel` - Show/manage relationships
- `AdrTemplateSelector` - Choose template for new ADR
- `AdrPrStatus` - Show pending PR status

---

## 8. Configuration

### 8.1 App Config (`app-config.yaml`)
```yaml
adr:
  # GitHub integration
  github:
    token: ${GITHUB_TOKEN}        # Or use Backstage GitHub integration

  # Default settings
  defaults:
    template: madr-v3             # Default ADR template
    branch: main                  # Default branch for PRs
    baseBranch: main              # Target branch for PRs

  # Categories (optional)
  categories:
    - security
    - infrastructure
    - api-design
    - data
    - frontend

  # Indexing
  indexing:
    schedule: '0 */15 * * * *'    # Every 15 minutes

  # UI options
  ui:
    defaultView: dashboard        # 'dashboard' or 'list'
    enableTimeline: true
    enableGraph: true
```

### 8.2 Catalog Annotation
```yaml
# In catalog-info.yaml for entities with ADRs
apiVersion: backstage.io/v1alpha1
kind: Component
metadata:
  name: my-service
  annotations:
    backstage.io/adr-location: ./docs/decisions
    # Or absolute URL:
    # backstage.io/adr-location: https://github.com/org/repo/tree/main/docs/adr
```

---

## 9. ADR Format Specifications

### 9.1 MADR v3 Format
```markdown
---
status: accepted
date: 2024-01-15
decision-makers:
  - Jane Doe
  - John Smith
tags:
  - api
  - security
---

# Use OAuth 2.0 for API Authentication

## Context and Problem Statement

We need to decide on an authentication mechanism for our public API.

## Decision Drivers

* Security requirements
* Developer experience
* Industry standards

## Considered Options

* OAuth 2.0
* API Keys
* JWT tokens

## Decision Outcome

Chosen option: "OAuth 2.0" because it provides...

### Consequences

* Good, because...
* Bad, because...

## More Information

Related to ADR-0005.
```

### 9.2 Nygard Format
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

---

## 10. Implementation Phases

### Phase 0: Documentation Setup
- [x] Create design specification document
- [x] Update README with project overview

### Phase 1: Core Foundation
- [ ] Project setup (frontend + backend plugins)
- [ ] Basic ADR model and types
- [ ] GitHub integration for reading ADRs
- [ ] Sidebar navigation
- [ ] Basic list view with pagination
- [ ] ADR detail view (read-only)

### Phase 2: CRUD & PR Workflow
- [ ] ADR editor component
- [ ] Create ADR (generates PR)
- [ ] Edit ADR (generates PR)
- [ ] Delete ADR (generates PR)
- [ ] PR status tracking
- [ ] Status change functionality

### Phase 3: Search & Organization
- [ ] Full-text search
- [ ] Filters (status, date, author, repo)
- [ ] Tags and categories
- [ ] Saved filter presets

### Phase 4: Dashboard & Visualizations
- [ ] Dashboard statistics
- [ ] Charts (status distribution, timeline)
- [ ] Timeline view
- [ ] Relationship graph view

### Phase 5: Relationships & Integration
- [ ] ADR-to-ADR relationships
- [ ] Entity linking
- [ ] Entity page tab (optional)
- [ ] Backstage search integration

### Phase 6: Polish & Enhancement
- [ ] Multiple template support
- [ ] Custom template creation
- [ ] Keyboard shortcuts
- [ ] Export functionality
- [ ] Accessibility audit

---

## 11. Design Decisions

1. **Template customization**: Config files only - templates defined in `app-config.yaml` or markdown files in the repo

2. **PR sync**: Auto-update ADR status when PR is merged - plugin monitors PR state and syncs automatically

3. **Notifications**: Deferred to future version - not in initial scope

4. **Permissions/RBAC**: Deferred to future version - initial version relies on GitHub repo permissions

5. **Versioning**: Rely on git history for version tracking (no separate versioning system)

---

## 12. References

- [Backstage Plugin Development](https://backstage.io/docs/plugins/)
- [MADR - Markdown Architectural Decision Records](https://adr.github.io/madr/)
- [ADR GitHub Organization](https://adr.github.io/)
- [Michael Nygard's ADR Blog Post](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions.html)
- [Existing Backstage ADR Plugin](https://www.npmjs.com/package/@backstage-community/plugin-adr)

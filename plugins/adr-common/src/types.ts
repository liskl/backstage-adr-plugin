import { Entity } from '@backstage/catalog-model';

/**
 * ADR status values representing the lifecycle of an Architecture Decision Record
 */
export type AdrStatus =
  | 'draft'
  | 'proposed'
  | 'accepted'
  | 'rejected'
  | 'deprecated'
  | 'superseded';

/**
 * Supported ADR format types
 */
export type AdrFormat = 'madr-v3' | 'madr-v2' | 'nygard' | 'custom';

/**
 * Reference to a Backstage catalog entity
 */
export interface EntityRef {
  kind: string;
  namespace: string;
  name: string;
}

/**
 * Core ADR entity representing an Architecture Decision Record
 */
export interface Adr {
  /** Unique identifier for the ADR */
  id: string;

  /** ADR title (extracted from markdown heading or frontmatter) */
  title: string;

  /** Sequential ADR number (e.g., 1, 2, 3) */
  number: number;

  /** Current status of the ADR */
  status: AdrStatus;

  /** Raw markdown content of the ADR */
  content: string;

  /** Format/template type of the ADR */
  format: AdrFormat;

  /** ISO date string when the ADR was created */
  createdAt: string;

  /** ISO date string when the ADR was last updated */
  updatedAt: string;

  /** Authors of the ADR (GitHub usernames or names) */
  authors: string[];

  /** People who made the decision */
  decisionMakers: string[];

  /** GitHub repository URL where the ADR is stored */
  repositoryUrl: string;

  /** File path within the repository */
  filePath: string;

  /** Git branch name */
  branch: string;

  /** Custom tags for categorization */
  tags: string[];

  /** Primary category */
  category?: string;

  /** ADR IDs that this ADR supersedes */
  supersedes: string[];

  /** ADR ID that supersedes this one */
  supersededBy?: string;

  /** Related ADR IDs */
  relatesTo: string[];

  /** Linked Backstage catalog entities */
  linkedEntities: EntityRef[];
}

/**
 * Minimal ADR data for list views and search results
 */
export interface AdrSummary {
  id: string;
  title: string;
  number: number;
  status: AdrStatus;
  updatedAt: string;
  repositoryUrl: string;
  filePath: string;
  tags: string[];
  category?: string;
}

/**
 * Section definition for an ADR template
 */
export interface TemplateSection {
  /** Section name/heading */
  name: string;

  /** Whether this section is required */
  required: boolean;

  /** Description of what this section should contain */
  description: string;
}

/**
 * ADR template definition
 */
export interface AdrTemplate {
  /** Unique template identifier */
  id: string;

  /** Human-readable template name */
  name: string;

  /** Template format type */
  format: AdrFormat;

  /** Sections defined in this template */
  sections: TemplateSection[];

  /** Default markdown content for new ADRs */
  defaultContent: string;
}

/**
 * Filter options for listing ADRs
 */
export interface AdrFilters {
  /** Filter by status(es) */
  status?: AdrStatus[];

  /** Filter by tag(s) */
  tags?: string[];

  /** Filter by category */
  category?: string;

  /** Filter by repository URL */
  repositoryUrl?: string;

  /** Filter by author */
  author?: string;

  /** Filter by date range (ISO date strings) */
  createdAfter?: string;
  createdBefore?: string;
  updatedAfter?: string;
  updatedBefore?: string;

  /** Full-text search query */
  search?: string;
}

/**
 * Pagination options
 */
export interface PaginationOptions {
  /** Number of items per page */
  limit: number;

  /** Offset for pagination */
  offset: number;
}

/**
 * Paginated response wrapper
 */
export interface PaginatedResponse<T> {
  /** Array of items */
  items: T[];

  /** Total count of all items matching the query */
  totalCount: number;

  /** Current offset */
  offset: number;

  /** Current limit */
  limit: number;
}

/**
 * Dashboard statistics
 */
export interface AdrStats {
  /** Total number of ADRs */
  totalCount: number;

  /** Count by status */
  byStatus: Record<AdrStatus, number>;

  /** Count by category */
  byCategory: Record<string, number>;

  /** Recently updated ADRs */
  recentlyUpdated: AdrSummary[];

  /** ADRs pending review (in proposed status) */
  pendingReview: AdrSummary[];
}

/**
 * ADR relationship types
 */
export type AdrRelationshipType =
  | 'supersedes'
  | 'superseded-by'
  | 'relates-to'
  | 'amends';

/**
 * ADR relationship definition
 */
export interface AdrRelationship {
  /** Source ADR ID */
  sourceId: string;

  /** Target ADR ID */
  targetId: string;

  /** Type of relationship */
  type: AdrRelationshipType;
}

/**
 * Request body for creating a new ADR
 */
export interface CreateAdrRequest {
  /** ADR title */
  title: string;

  /** Target repository URL */
  repositoryUrl: string;

  /** Directory path for the ADR file */
  directoryPath: string;

  /** Template ID to use */
  templateId: string;

  /** ADR format */
  format?: AdrFormat;

  /** Initial content (optional, uses template default if not provided) */
  content?: string;

  /** Initial status */
  status?: AdrStatus;

  /** Authors */
  authors?: string[];

  /** Decision makers */
  decisionMakers?: string[];

  /** Tags */
  tags?: string[];

  /** Category */
  category?: string;

  /** PR branch name (optional, auto-generated if not provided) */
  branchName?: string;
}

/**
 * Request body for updating an ADR
 */
export interface UpdateAdrRequest {
  /** Updated title */
  title?: string;

  /** Updated content */
  content?: string;

  /** Updated status */
  status?: AdrStatus;

  /** Updated authors */
  authors?: string[];

  /** Updated decision makers */
  decisionMakers?: string[];

  /** Updated tags */
  tags?: string[];

  /** Updated category */
  category?: string;

  /** Commit message for the update */
  commitMessage?: string;
}

/**
 * Pull request information
 */
export interface AdrPullRequest {
  /** PR number */
  number: number;

  /** PR title */
  title: string;

  /** PR URL */
  url: string;

  /** PR state */
  state: 'open' | 'closed';

  /** Branch name */
  branch?: string;

  /** Associated ADR ID */
  adrId?: string;

  /** PR author username */
  author: string;

  /** Whether the PR has been merged */
  merged: boolean;

  /** Merged at timestamp (if merged) */
  mergedAt?: string;

  /** Created at timestamp */
  createdAt: string;

  /** Updated at timestamp */
  updatedAt?: string;
}

/**
 * Catalog annotation key for ADR location
 */
export const ADR_LOCATION_ANNOTATION = 'backstage.io/adr-location';

/**
 * Check if an entity has ADR location annotation
 */
export function hasAdrAnnotation(entity: Entity): boolean {
  return Boolean(entity.metadata.annotations?.[ADR_LOCATION_ANNOTATION]);
}

/**
 * Get ADR location from entity annotation
 */
export function getAdrLocation(entity: Entity): string | undefined {
  return entity.metadata.annotations?.[ADR_LOCATION_ANNOTATION];
}

import { createApiRef } from '@backstage/core-plugin-api';
import {
  Adr,
  AdrFilters,
  AdrPullRequest,
  AdrStats,
  AdrStatus,
  AdrSummary,
  AdrTemplate,
  CreateAdrRequest,
  EntityRef,
  PaginatedResponse,
  PaginationOptions,
  UpdateAdrRequest,
} from '@backstage-community/plugin-adr-common';

/**
 * API interface for the ADR plugin
 *
 * @public
 */
export interface AdrApi {
  /**
   * List ADRs with optional filters and pagination
   */
  listAdrs(
    filters?: Partial<AdrFilters>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResponse<AdrSummary>>;

  /**
   * Get a single ADR by ID
   */
  getAdr(id: string): Promise<Adr | null>;

  /**
   * Create a new ADR
   */
  createAdr(request: CreateAdrRequest): Promise<{ adr: Adr; pr: AdrPullRequest }>;

  /**
   * Update an ADR
   */
  updateAdr(
    id: string,
    request: UpdateAdrRequest,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }>;

  /**
   * Delete an ADR
   */
  deleteAdr(id: string): Promise<AdrPullRequest>;

  /**
   * Update ADR status
   */
  updateAdrStatus(
    id: string,
    status: AdrStatus,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }>;

  /**
   * Search ADRs
   */
  searchAdrs(
    query: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResponse<AdrSummary>>;

  /**
   * Get all tags
   */
  getTags(): Promise<string[]>;

  /**
   * Get all categories
   */
  getCategories(): Promise<string[]>;

  /**
   * Get dashboard statistics
   */
  getStats(): Promise<AdrStats>;

  /**
   * Get available templates
   */
  getTemplates(): Promise<AdrTemplate[]>;

  /**
   * Get a specific template
   */
  getTemplate(id: string): Promise<AdrTemplate | null>;

  /**
   * Get related ADRs
   */
  getRelatedAdrs(id: string): Promise<AdrSummary[]>;

  /**
   * Get linked entities
   */
  getLinkedEntities(id: string): Promise<EntityRef[]>;

  /**
   * Link ADR to entity
   */
  linkToEntity(id: string, entityRef: EntityRef): Promise<void>;

  /**
   * Get pending PRs
   */
  getPendingPrs(): Promise<AdrPullRequest[]>;

  /**
   * Get PR status
   */
  getPrStatus(prNumber: number): Promise<AdrPullRequest | null>;
}

/**
 * API ref for the ADR API
 *
 * @public
 */
export const adrApiRef = createApiRef<AdrApi>({
  id: 'plugin.adr.api',
});

import { AuthService, DiscoveryService, LoggerService } from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import { CatalogClient } from '@backstage/catalog-client';
import matter from 'gray-matter';
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
  ADR_LOCATION_ANNOTATION,
} from '@backstage-community/plugin-adr-common';
import { GitHubService } from './GitHubService';

/**
 * Options for AdrService
 */
export interface AdrServiceOptions {
  logger: LoggerService;
  config: Config;
  discovery: DiscoveryService;
  auth: AuthService;
  githubService: GitHubService;
}

/**
 * Context for service operations
 */
export interface ServiceContext {
  credentials: any;
}

/**
 * Default ADR templates
 */
const DEFAULT_TEMPLATES: AdrTemplate[] = [
  {
    id: 'madr-v3',
    name: 'MADR v3',
    format: 'madr-v3',
    sections: [
      { name: 'Context and Problem Statement', required: true, description: 'Describe the context and problem' },
      { name: 'Decision Drivers', required: false, description: 'List the forces influencing the decision' },
      { name: 'Considered Options', required: true, description: 'List the options considered' },
      { name: 'Decision Outcome', required: true, description: 'State the chosen option and why' },
      { name: 'Consequences', required: false, description: 'Describe positive and negative consequences' },
      { name: 'More Information', required: false, description: 'Links, references, related ADRs' },
    ],
    defaultContent: `---
status: draft
date: {{DATE}}
decision-makers:
  - {{AUTHOR}}
tags: []
---

# {{TITLE}}

## Context and Problem Statement

Describe the context and problem statement.

## Decision Drivers

* Driver 1
* Driver 2

## Considered Options

* Option 1
* Option 2
* Option 3

## Decision Outcome

Chosen option: "[option]", because [justification].

### Consequences

* Good, because [positive consequence]
* Bad, because [negative consequence]

## More Information

Additional context and related decisions.
`,
  },
  {
    id: 'nygard',
    name: 'Nygard (Classic)',
    format: 'nygard',
    sections: [
      { name: 'Status', required: true, description: 'Current status of the decision' },
      { name: 'Context', required: true, description: 'Describe the context' },
      { name: 'Decision', required: true, description: 'State the decision' },
      { name: 'Consequences', required: true, description: 'Describe the consequences' },
    ],
    defaultContent: `# {{NUMBER}}. {{TITLE}}

Date: {{DATE}}

## Status

Draft

## Context

Describe the context and forces at play.

## Decision

We will...

## Consequences

Describe the resulting context after applying the decision.
`,
  },
];

/**
 * Service for managing Architecture Decision Records
 */
export class AdrService {
  private readonly logger: LoggerService;
  private readonly config: Config;
  private readonly discovery: DiscoveryService;
  private readonly auth: AuthService;
  private readonly githubService: GitHubService;
  private catalogClient: CatalogClient | null = null;

  // In-memory cache for ADRs (in production, use a proper cache/database)
  private adrCache: Map<string, Adr> = new Map();
  private lastCacheUpdate: Date | null = null;

  constructor(options: AdrServiceOptions) {
    this.logger = options.logger;
    this.config = options.config;
    this.discovery = options.discovery;
    this.auth = options.auth;
    this.githubService = options.githubService;
  }

  /**
   * Get the catalog client (lazy initialization)
   */
  private async getCatalogClient(): Promise<CatalogClient> {
    if (!this.catalogClient) {
      const baseUrl = await this.discovery.getBaseUrl('catalog');
      this.catalogClient = new CatalogClient({ discoveryApi: { getBaseUrl: async () => baseUrl } });
    }
    return this.catalogClient;
  }

  /**
   * Generate a unique ADR ID from repository and file path
   */
  private generateAdrId(repositoryUrl: string, filePath: string): string {
    const sanitized = `${repositoryUrl}/${filePath}`
      .replace(/https?:\/\//, '')
      .replace(/[^a-zA-Z0-9]/g, '-')
      .toLowerCase();
    return sanitized;
  }

  /**
   * Parse ADR content and extract metadata
   */
  private parseAdrContent(
    content: string,
    filePath: string,
    repositoryUrl: string,
  ): Partial<Adr> {
    const { data: frontmatter, content: markdown } = matter(content);

    // Extract title from first heading or frontmatter
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    const title = frontmatter.title || (titleMatch ? titleMatch[1] : filePath);

    // Extract ADR number from filename (e.g., 0001-some-decision.md)
    const numberMatch = filePath.match(/(\d+)[^/]*\.md$/);
    const number = numberMatch ? parseInt(numberMatch[1], 10) : 0;

    // Determine format based on frontmatter presence
    let format: Adr['format'] = 'custom';
    if (frontmatter.status && frontmatter.date) {
      format = 'madr-v3';
    } else if (markdown.includes('## Status') && markdown.includes('## Context')) {
      format = 'nygard';
    }

    // Parse status
    let status: AdrStatus = 'draft';
    if (frontmatter.status) {
      status = frontmatter.status.toLowerCase() as AdrStatus;
    } else {
      // Try to extract from Nygard format
      const statusMatch = markdown.match(/##\s+Status\s*\n+(\w+)/i);
      if (statusMatch) {
        status = statusMatch[1].toLowerCase() as AdrStatus;
      }
    }

    return {
      title: title.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, ''),
      number,
      status,
      content,
      format,
      authors: frontmatter['decision-makers'] || frontmatter.authors || [],
      decisionMakers: frontmatter['decision-makers'] || [],
      tags: frontmatter.tags || [],
      category: frontmatter.category,
      supersedes: frontmatter.supersedes || [],
      supersededBy: frontmatter['superseded-by'],
      relatesTo: frontmatter['relates-to'] || [],
      createdAt: frontmatter.date || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Refresh the ADR cache by scanning all annotated entities
   */
  async refreshCache(context: ServiceContext): Promise<void> {
    this.logger.info('Refreshing ADR cache...');

    try {
      const catalogClient = await this.getCatalogClient();
      const { token } = await this.auth.getPluginRequestToken({
        onBehalfOf: context.credentials,
        targetPluginId: 'catalog',
      });

      // Get all entities with ADR annotations
      const entities = await catalogClient.getEntities(
        {
          filter: {
            [`metadata.annotations.${ADR_LOCATION_ANNOTATION}`]: '*',
          },
        },
        { token },
      );

      const newCache = new Map<string, Adr>();

      for (const entity of entities.items) {
        const adrLocation = entity.metadata.annotations?.[ADR_LOCATION_ANNOTATION];
        if (!adrLocation) continue;

        // Get source location to build repository URL
        const sourceLocation = entity.metadata.annotations?.['backstage.io/source-location'];
        if (!sourceLocation) continue;

        const repoUrl = sourceLocation.replace(/^url:/, '').split('/blob/')[0].split('/tree/')[0];

        try {
          const files = await this.githubService.listFiles(repoUrl, adrLocation);

          for (const filePath of files) {
            const file = await this.githubService.getFileContent(repoUrl, filePath);
            if (!file) continue;

            const id = this.generateAdrId(repoUrl, filePath);
            const parsed = this.parseAdrContent(file.content, filePath, repoUrl);

            const adr: Adr = {
              id,
              title: parsed.title || filePath,
              number: parsed.number || 0,
              status: parsed.status || 'draft',
              content: parsed.content || '',
              format: parsed.format || 'custom',
              createdAt: parsed.createdAt || new Date().toISOString(),
              updatedAt: parsed.updatedAt || new Date().toISOString(),
              authors: parsed.authors || [],
              decisionMakers: parsed.decisionMakers || [],
              repositoryUrl: repoUrl,
              filePath,
              branch: 'main',
              tags: parsed.tags || [],
              category: parsed.category,
              supersedes: parsed.supersedes || [],
              supersededBy: parsed.supersededBy,
              relatesTo: parsed.relatesTo || [],
              linkedEntities: [
                {
                  kind: entity.kind,
                  namespace: entity.metadata.namespace || 'default',
                  name: entity.metadata.name,
                },
              ],
            };

            newCache.set(id, adr);
          }
        } catch (error) {
          this.logger.warn(`Failed to fetch ADRs from ${repoUrl}/${adrLocation}`, error as Error);
        }
      }

      this.adrCache = newCache;
      this.lastCacheUpdate = new Date();
      this.logger.info(`ADR cache refreshed with ${newCache.size} ADRs`);
    } catch (error) {
      this.logger.error('Failed to refresh ADR cache', error as Error);
    }
  }

  /**
   * Ensure cache is fresh
   */
  private async ensureCache(context: ServiceContext): Promise<void> {
    const cacheAge = this.lastCacheUpdate
      ? Date.now() - this.lastCacheUpdate.getTime()
      : Infinity;

    // Refresh if cache is older than 5 minutes or empty
    if (cacheAge > 5 * 60 * 1000 || this.adrCache.size === 0) {
      await this.refreshCache(context);
    }
  }

  /**
   * List ADRs with optional filters and pagination
   */
  async listAdrs(
    filters: Partial<AdrFilters>,
    pagination: PaginationOptions,
    context: ServiceContext,
  ): Promise<PaginatedResponse<AdrSummary>> {
    await this.ensureCache(context);

    let adrs = Array.from(this.adrCache.values());

    // Apply filters
    if (filters.status?.length) {
      adrs = adrs.filter(adr => filters.status!.includes(adr.status));
    }
    if (filters.tags?.length) {
      adrs = adrs.filter(adr =>
        filters.tags!.some(tag => adr.tags.includes(tag)),
      );
    }
    if (filters.category) {
      adrs = adrs.filter(adr => adr.category === filters.category);
    }
    if (filters.repositoryUrl) {
      adrs = adrs.filter(adr => adr.repositoryUrl === filters.repositoryUrl);
    }
    if (filters.author) {
      adrs = adrs.filter(adr => adr.authors.includes(filters.author!));
    }
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      adrs = adrs.filter(
        adr =>
          adr.title.toLowerCase().includes(searchLower) ||
          adr.content.toLowerCase().includes(searchLower),
      );
    }

    // Sort by updated date (most recent first)
    adrs.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const totalCount = adrs.length;
    const paginatedAdrs = adrs.slice(
      pagination.offset,
      pagination.offset + pagination.limit,
    );

    const summaries: AdrSummary[] = paginatedAdrs.map(adr => ({
      id: adr.id,
      title: adr.title,
      number: adr.number,
      status: adr.status,
      updatedAt: adr.updatedAt,
      repositoryUrl: adr.repositoryUrl,
      filePath: adr.filePath,
      tags: adr.tags,
      category: adr.category,
    }));

    return {
      items: summaries,
      totalCount,
      offset: pagination.offset,
      limit: pagination.limit,
    };
  }

  /**
   * Get a single ADR by ID
   */
  async getAdr(id: string, context: ServiceContext): Promise<Adr | null> {
    await this.ensureCache(context);
    return this.adrCache.get(id) || null;
  }

  /**
   * Create a new ADR
   */
  async createAdr(
    request: CreateAdrRequest,
    context: ServiceContext,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }> {
    const template = await this.getTemplate(request.templateId);
    if (!template) {
      throw new Error(`Template not found: ${request.templateId}`);
    }

    // Generate ADR number
    await this.ensureCache(context);
    const existingAdrs = Array.from(this.adrCache.values())
      .filter(adr => adr.repositoryUrl === request.repositoryUrl);
    const nextNumber = Math.max(0, ...existingAdrs.map(a => a.number)) + 1;
    const paddedNumber = String(nextNumber).padStart(4, '0');

    // Generate filename
    const slugifiedTitle = request.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const fileName = `${paddedNumber}-${slugifiedTitle}.md`;
    const filePath = `${request.directoryPath}/${fileName}`.replace(/\/+/g, '/');

    // Generate content from template
    const content = (request.content || template.defaultContent)
      .replace(/\{\{TITLE\}\}/g, request.title)
      .replace(/\{\{NUMBER\}\}/g, paddedNumber)
      .replace(/\{\{DATE\}\}/g, new Date().toISOString().split('T')[0])
      .replace(/\{\{AUTHOR\}\}/g, 'Unknown');

    // Create branch
    const branchName = request.branchName || `adr/${paddedNumber}-${slugifiedTitle}`;
    await this.githubService.createBranch(request.repositoryUrl, branchName);

    // Create file
    await this.githubService.createOrUpdateFile(
      request.repositoryUrl,
      filePath,
      content,
      `Add ADR ${paddedNumber}: ${request.title}`,
      branchName,
    );

    // Create PR
    const pr = await this.githubService.createPullRequest(
      request.repositoryUrl,
      `Add ADR ${paddedNumber}: ${request.title}`,
      `This PR adds a new Architecture Decision Record.\n\n## Summary\n\n${request.title}\n\n---\n*Created via Backstage ADR Plugin*`,
      branchName,
    );

    // Create ADR object
    const id = this.generateAdrId(request.repositoryUrl, filePath);
    const adr: Adr = {
      id,
      title: request.title,
      number: nextNumber,
      status: request.status || 'draft',
      content,
      format: template.format,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      authors: [],
      decisionMakers: [],
      repositoryUrl: request.repositoryUrl,
      filePath,
      branch: branchName,
      tags: request.tags || [],
      category: request.category,
      supersedes: [],
      relatesTo: [],
      linkedEntities: [],
    };

    // Add to cache
    this.adrCache.set(id, adr);

    return {
      adr,
      pr: {
        number: pr.number,
        title: `Add ADR ${paddedNumber}: ${request.title}`,
        url: pr.url,
        state: 'open',
        branch: branchName,
        adrId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Update an ADR
   */
  async updateAdr(
    id: string,
    request: UpdateAdrRequest,
    context: ServiceContext,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }> {
    const adr = await this.getAdr(id, context);
    if (!adr) {
      throw new Error(`ADR not found: ${id}`);
    }

    // Get current file content and SHA
    const file = await this.githubService.getFileContent(
      adr.repositoryUrl,
      adr.filePath,
    );
    if (!file) {
      throw new Error(`ADR file not found: ${adr.filePath}`);
    }

    // Create branch
    const branchName = `adr/update-${adr.number}-${Date.now()}`;
    await this.githubService.createBranch(adr.repositoryUrl, branchName);

    // Update content
    const newContent = request.content || adr.content;
    await this.githubService.createOrUpdateFile(
      adr.repositoryUrl,
      adr.filePath,
      newContent,
      request.commitMessage || `Update ADR ${adr.number}: ${adr.title}`,
      branchName,
      file.sha,
    );

    // Create PR
    const pr = await this.githubService.createPullRequest(
      adr.repositoryUrl,
      `Update ADR ${adr.number}: ${adr.title}`,
      `This PR updates an existing Architecture Decision Record.\n\n---\n*Updated via Backstage ADR Plugin*`,
      branchName,
    );

    // Update cache
    const updatedAdr: Adr = {
      ...adr,
      title: request.title || adr.title,
      content: newContent,
      status: request.status || adr.status,
      tags: request.tags || adr.tags,
      category: request.category ?? adr.category,
      updatedAt: new Date().toISOString(),
    };
    this.adrCache.set(id, updatedAdr);

    return {
      adr: updatedAdr,
      pr: {
        number: pr.number,
        title: `Update ADR ${adr.number}: ${adr.title}`,
        url: pr.url,
        state: 'open',
        branch: branchName,
        adrId: id,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Delete an ADR
   */
  async deleteAdr(id: string, context: ServiceContext): Promise<AdrPullRequest> {
    const adr = await this.getAdr(id, context);
    if (!adr) {
      throw new Error(`ADR not found: ${id}`);
    }

    // Get current file SHA
    const file = await this.githubService.getFileContent(
      adr.repositoryUrl,
      adr.filePath,
    );
    if (!file) {
      throw new Error(`ADR file not found: ${adr.filePath}`);
    }

    // Create branch
    const branchName = `adr/delete-${adr.number}-${Date.now()}`;
    await this.githubService.createBranch(adr.repositoryUrl, branchName);

    // Delete file
    await this.githubService.deleteFile(
      adr.repositoryUrl,
      adr.filePath,
      `Delete ADR ${adr.number}: ${adr.title}`,
      branchName,
      file.sha,
    );

    // Create PR
    const pr = await this.githubService.createPullRequest(
      adr.repositoryUrl,
      `Delete ADR ${adr.number}: ${adr.title}`,
      `This PR deletes an Architecture Decision Record.\n\n---\n*Deleted via Backstage ADR Plugin*`,
      branchName,
    );

    return {
      number: pr.number,
      title: `Delete ADR ${adr.number}: ${adr.title}`,
      url: pr.url,
      state: 'open',
      branch: branchName,
      adrId: id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Update ADR status
   */
  async updateAdrStatus(
    id: string,
    status: AdrStatus,
    context: ServiceContext,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }> {
    return this.updateAdr(
      id,
      {
        status,
        commitMessage: `Change ADR status to ${status}`,
      },
      context,
    );
  }

  /**
   * Search ADRs
   */
  async searchAdrs(
    query: string,
    pagination: PaginationOptions,
    context: ServiceContext,
  ): Promise<PaginatedResponse<AdrSummary>> {
    return this.listAdrs({ search: query }, pagination, context);
  }

  /**
   * Get all tags
   */
  async getTags(context: ServiceContext): Promise<string[]> {
    await this.ensureCache(context);
    const tagSet = new Set<string>();
    for (const adr of this.adrCache.values()) {
      adr.tags.forEach(tag => tagSet.add(tag));
    }
    return Array.from(tagSet).sort();
  }

  /**
   * Get all categories
   */
  async getCategories(context: ServiceContext): Promise<string[]> {
    await this.ensureCache(context);
    const categorySet = new Set<string>();
    for (const adr of this.adrCache.values()) {
      if (adr.category) {
        categorySet.add(adr.category);
      }
    }
    return Array.from(categorySet).sort();
  }

  /**
   * Get dashboard statistics
   */
  async getStats(context: ServiceContext): Promise<AdrStats> {
    await this.ensureCache(context);

    const adrs = Array.from(this.adrCache.values());

    const byStatus: Record<AdrStatus, number> = {
      draft: 0,
      proposed: 0,
      accepted: 0,
      rejected: 0,
      deprecated: 0,
      superseded: 0,
    };

    const byCategory: Record<string, number> = {};

    for (const adr of adrs) {
      byStatus[adr.status]++;
      if (adr.category) {
        byCategory[adr.category] = (byCategory[adr.category] || 0) + 1;
      }
    }

    // Get recently updated (last 10)
    const recentlyUpdated = adrs
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10)
      .map(adr => ({
        id: adr.id,
        title: adr.title,
        number: adr.number,
        status: adr.status,
        updatedAt: adr.updatedAt,
        repositoryUrl: adr.repositoryUrl,
        filePath: adr.filePath,
        tags: adr.tags,
        category: adr.category,
      }));

    // Get pending review (proposed status)
    const pendingReview = adrs
      .filter(adr => adr.status === 'proposed')
      .map(adr => ({
        id: adr.id,
        title: adr.title,
        number: adr.number,
        status: adr.status,
        updatedAt: adr.updatedAt,
        repositoryUrl: adr.repositoryUrl,
        filePath: adr.filePath,
        tags: adr.tags,
        category: adr.category,
      }));

    return {
      totalCount: adrs.length,
      byStatus,
      byCategory,
      recentlyUpdated,
      pendingReview,
    };
  }

  /**
   * Get available templates
   */
  async getTemplates(): Promise<AdrTemplate[]> {
    // TODO: Load custom templates from config
    return DEFAULT_TEMPLATES;
  }

  /**
   * Get a specific template
   */
  async getTemplate(id: string): Promise<AdrTemplate | null> {
    const templates = await this.getTemplates();
    return templates.find(t => t.id === id) || null;
  }

  /**
   * Get related ADRs
   */
  async getRelatedAdrs(id: string, context: ServiceContext): Promise<AdrSummary[]> {
    const adr = await this.getAdr(id, context);
    if (!adr) {
      return [];
    }

    await this.ensureCache(context);

    const relatedIds = new Set([
      ...adr.supersedes,
      ...(adr.supersededBy ? [adr.supersededBy] : []),
      ...adr.relatesTo,
    ]);

    return Array.from(this.adrCache.values())
      .filter(a => relatedIds.has(a.id))
      .map(a => ({
        id: a.id,
        title: a.title,
        number: a.number,
        status: a.status,
        updatedAt: a.updatedAt,
        repositoryUrl: a.repositoryUrl,
        filePath: a.filePath,
        tags: a.tags,
        category: a.category,
      }));
  }

  /**
   * Get linked entities
   */
  async getLinkedEntities(id: string, context: ServiceContext): Promise<EntityRef[]> {
    const adr = await this.getAdr(id, context);
    return adr?.linkedEntities || [];
  }

  /**
   * Link ADR to entity
   */
  async linkToEntity(
    id: string,
    entityRef: EntityRef,
    context: ServiceContext,
  ): Promise<void> {
    const adr = await this.getAdr(id, context);
    if (!adr) {
      throw new Error(`ADR not found: ${id}`);
    }

    // Add entity to linked entities if not already present
    const exists = adr.linkedEntities.some(
      e =>
        e.kind === entityRef.kind &&
        e.namespace === entityRef.namespace &&
        e.name === entityRef.name,
    );

    if (!exists) {
      adr.linkedEntities.push(entityRef);
      this.adrCache.set(id, adr);
    }
  }

  /**
   * Get pending PRs
   */
  async getPendingPrs(_context: ServiceContext): Promise<AdrPullRequest[]> {
    // TODO: Track PRs created by this plugin
    return [];
  }

  /**
   * Get PR status
   */
  async getPrStatus(
    _prNumber: number,
    _context: ServiceContext,
  ): Promise<AdrPullRequest | null> {
    // TODO: Implement PR status lookup
    return null;
  }
}

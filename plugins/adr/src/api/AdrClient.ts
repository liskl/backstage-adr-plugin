import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';
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
import { AdrApi } from './AdrApi';

/**
 * Options for the ADR client
 */
export interface AdrClientOptions {
  discoveryApi: DiscoveryApi;
  fetchApi: FetchApi;
}

/**
 * Client implementation for the ADR API
 *
 * @public
 */
export class AdrClient implements AdrApi {
  private readonly discoveryApi: DiscoveryApi;
  private readonly fetchApi: FetchApi;

  constructor(options: AdrClientOptions) {
    this.discoveryApi = options.discoveryApi;
    this.fetchApi = options.fetchApi;
  }

  private async getBaseUrl(): Promise<string> {
    return this.discoveryApi.getBaseUrl('adr');
  }

  private async fetch<T>(
    path: string,
    options?: RequestInit,
  ): Promise<T> {
    const baseUrl = await this.getBaseUrl();
    const response = await this.fetchApi.fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(error.message || `Request failed: ${response.status}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async listAdrs(
    filters?: Partial<AdrFilters>,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResponse<AdrSummary>> {
    const params = new URLSearchParams();

    if (filters?.status?.length) {
      params.set('status', filters.status.join(','));
    }
    if (filters?.tags?.length) {
      params.set('tags', filters.tags.join(','));
    }
    if (filters?.category) {
      params.set('category', filters.category);
    }
    if (filters?.repositoryUrl) {
      params.set('repositoryUrl', filters.repositoryUrl);
    }
    if (filters?.author) {
      params.set('author', filters.author);
    }
    if (filters?.search) {
      params.set('search', filters.search);
    }
    if (pagination?.limit) {
      params.set('limit', String(pagination.limit));
    }
    if (pagination?.offset) {
      params.set('offset', String(pagination.offset));
    }

    const query = params.toString();
    return this.fetch<PaginatedResponse<AdrSummary>>(
      `/adrs${query ? `?${query}` : ''}`,
    );
  }

  async getAdr(id: string): Promise<Adr | null> {
    try {
      return await this.fetch<Adr>(`/adrs/${encodeURIComponent(id)}`);
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async createAdr(
    request: CreateAdrRequest,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }> {
    return this.fetch<{ adr: Adr; pr: AdrPullRequest }>('/adrs', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateAdr(
    id: string,
    request: UpdateAdrRequest,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }> {
    return this.fetch<{ adr: Adr; pr: AdrPullRequest }>(
      `/adrs/${encodeURIComponent(id)}`,
      {
        method: 'PUT',
        body: JSON.stringify(request),
      },
    );
  }

  async deleteAdr(id: string): Promise<AdrPullRequest> {
    return this.fetch<AdrPullRequest>(`/adrs/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }

  async updateAdrStatus(
    id: string,
    status: AdrStatus,
  ): Promise<{ adr: Adr; pr: AdrPullRequest }> {
    return this.fetch<{ adr: Adr; pr: AdrPullRequest }>(
      `/adrs/${encodeURIComponent(id)}/status`,
      {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      },
    );
  }

  async searchAdrs(
    query: string,
    pagination?: PaginationOptions,
  ): Promise<PaginatedResponse<AdrSummary>> {
    const params = new URLSearchParams();
    params.set('q', query);
    if (pagination?.limit) {
      params.set('limit', String(pagination.limit));
    }
    if (pagination?.offset) {
      params.set('offset', String(pagination.offset));
    }

    return this.fetch<PaginatedResponse<AdrSummary>>(`/search?${params}`);
  }

  async getTags(): Promise<string[]> {
    return this.fetch<string[]>('/tags');
  }

  async getCategories(): Promise<string[]> {
    return this.fetch<string[]>('/categories');
  }

  async getStats(): Promise<AdrStats> {
    return this.fetch<AdrStats>('/stats');
  }

  async getTemplates(): Promise<AdrTemplate[]> {
    return this.fetch<AdrTemplate[]>('/templates');
  }

  async getTemplate(id: string): Promise<AdrTemplate | null> {
    try {
      return await this.fetch<AdrTemplate>(
        `/templates/${encodeURIComponent(id)}`,
      );
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }

  async getRelatedAdrs(id: string): Promise<AdrSummary[]> {
    return this.fetch<AdrSummary[]>(
      `/adrs/${encodeURIComponent(id)}/related`,
    );
  }

  async getLinkedEntities(id: string): Promise<EntityRef[]> {
    return this.fetch<EntityRef[]>(
      `/adrs/${encodeURIComponent(id)}/entities`,
    );
  }

  async linkToEntity(id: string, entityRef: EntityRef): Promise<void> {
    await this.fetch<void>(`/adrs/${encodeURIComponent(id)}/link`, {
      method: 'POST',
      body: JSON.stringify({ entityRef }),
    });
  }

  async getPendingPrs(): Promise<AdrPullRequest[]> {
    return this.fetch<AdrPullRequest[]>('/prs');
  }

  async getPrStatus(prNumber: number): Promise<AdrPullRequest | null> {
    try {
      return await this.fetch<AdrPullRequest>(`/prs/${prNumber}`);
    } catch (error: any) {
      if (error.message?.includes('404')) {
        return null;
      }
      throw error;
    }
  }
}

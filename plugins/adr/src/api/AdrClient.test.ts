import { AdrClient } from './AdrClient';
import { DiscoveryApi, FetchApi } from '@backstage/core-plugin-api';

describe('AdrClient', () => {
  let client: AdrClient;
  let mockDiscoveryApi: jest.Mocked<DiscoveryApi>;
  let mockFetchApi: jest.Mocked<FetchApi>;

  beforeEach(() => {
    mockDiscoveryApi = {
      getBaseUrl: jest.fn().mockResolvedValue('http://localhost:7007/api/adr'),
    };

    mockFetchApi = {
      fetch: jest.fn(),
    };

    client = new AdrClient({
      discoveryApi: mockDiscoveryApi,
      fetchApi: mockFetchApi,
    });
  });

  describe('listAdrs', () => {
    it('should fetch ADRs with no filters', async () => {
      const mockResponse = {
        items: [
          { id: '1', title: 'ADR 1', status: 'accepted' },
          { id: '2', title: 'ADR 2', status: 'proposed' },
        ],
        totalCount: 2,
        offset: 0,
        limit: 20,
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.listAdrs();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/adrs',
        expect.objectContaining({
          headers: { 'Content-Type': 'application/json' },
        }),
      );
      expect(result).toEqual(mockResponse);
    });

    it('should include status filter in query params', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], totalCount: 0, offset: 0, limit: 20 }),
      } as Response);

      await client.listAdrs({ status: ['accepted', 'proposed'] });

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining('status=accepted%2Cproposed'),
        expect.any(Object),
      );
    });

    it('should include pagination params', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], totalCount: 0, offset: 20, limit: 10 }),
      } as Response);

      await client.listAdrs({}, { limit: 10, offset: 20 });

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/limit=10.*offset=20|offset=20.*limit=10/),
        expect.any(Object),
      );
    });

    it('should include search query', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], totalCount: 0, offset: 0, limit: 20 }),
      } as Response);

      await client.listAdrs({ search: 'authentication' });

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining('search=authentication'),
        expect.any(Object),
      );
    });

    it('should include date range filters', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], totalCount: 0, offset: 0, limit: 20 }),
      } as Response);

      await client.listAdrs({
        createdAfter: '2024-01-01',
        createdBefore: '2024-12-31',
        updatedAfter: '2024-06-01',
        updatedBefore: '2024-06-30',
      });

      const url = mockFetchApi.fetch.mock.calls[0][0] as string;
      expect(url).toContain('createdAfter=2024-01-01');
      expect(url).toContain('createdBefore=2024-12-31');
      expect(url).toContain('updatedAfter=2024-06-01');
      expect(url).toContain('updatedBefore=2024-06-30');
    });

    it('should include author filter', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], totalCount: 0, offset: 0, limit: 20 }),
      } as Response);

      await client.listAdrs({ author: 'alice' });

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining('author=alice'),
        expect.any(Object),
      );
    });

    it('should include repository filter', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ items: [], totalCount: 0, offset: 0, limit: 20 }),
      } as Response);

      await client.listAdrs({ repositoryUrl: 'https://github.com/org/repo' });

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining('repositoryUrl='),
        expect.any(Object),
      );
    });
  });

  describe('getAdr', () => {
    it('should fetch a single ADR by ID', async () => {
      const mockAdr = {
        id: 'test-id',
        title: 'Test ADR',
        status: 'accepted',
        content: '# Test',
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAdr),
      } as Response);

      const result = await client.getAdr('test-id');

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/adrs/test-id',
        expect.any(Object),
      );
      expect(result).toEqual(mockAdr);
    });

    it('should return null for 404 response', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 404,
        json: () => Promise.resolve({ message: 'Not found' }),
      } as Response);

      const result = await client.getAdr('non-existent');

      expect(result).toBeNull();
    });

    it('should URL-encode special characters in ID', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ id: 'test/id' }),
      } as Response);

      await client.getAdr('test/id');

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/adrs/test%2Fid',
        expect.any(Object),
      );
    });
  });

  describe('getStats', () => {
    it('should fetch dashboard statistics', async () => {
      const mockStats = {
        totalCount: 10,
        byStatus: {
          draft: 2,
          proposed: 3,
          accepted: 4,
          rejected: 1,
          deprecated: 0,
          superseded: 0,
        },
        byCategory: {},
        recentlyUpdated: [],
        pendingReview: [],
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockStats),
      } as Response);

      const result = await client.getStats();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/stats',
        expect.any(Object),
      );
      expect(result).toEqual(mockStats);
    });
  });

  describe('getTags', () => {
    it('should fetch all tags', async () => {
      const mockTags = ['api', 'security', 'infrastructure'];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTags),
      } as Response);

      const result = await client.getTags();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/tags',
        expect.any(Object),
      );
      expect(result).toEqual(mockTags);
    });
  });

  describe('getCategories', () => {
    it('should fetch all categories', async () => {
      const mockCategories = ['security', 'infrastructure'];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockCategories),
      } as Response);

      const result = await client.getCategories();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/categories',
        expect.any(Object),
      );
      expect(result).toEqual(mockCategories);
    });
  });

  describe('getAuthors', () => {
    it('should fetch all authors', async () => {
      const mockAuthors = ['alice', 'bob', 'charlie'];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockAuthors),
      } as Response);

      const result = await client.getAuthors();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/authors',
        expect.any(Object),
      );
      expect(result).toEqual(mockAuthors);
    });
  });

  describe('getRepositories', () => {
    it('should fetch all repositories', async () => {
      const mockRepositories = [
        'https://github.com/org/repo1',
        'https://github.com/org/repo2',
      ];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockRepositories),
      } as Response);

      const result = await client.getRepositories();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/repositories',
        expect.any(Object),
      );
      expect(result).toEqual(mockRepositories);
    });
  });

  describe('getTemplates', () => {
    it('should fetch available templates', async () => {
      const mockTemplates = [
        { id: 'madr-v3', name: 'MADR v3', format: 'madr-v3' },
        { id: 'nygard', name: 'Nygard', format: 'nygard' },
      ];

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockTemplates),
      } as Response);

      const result = await client.getTemplates();

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        'http://localhost:7007/api/adr/templates',
        expect.any(Object),
      );
      expect(result).toEqual(mockTemplates);
    });
  });

  describe('searchAdrs', () => {
    it('should search ADRs with query', async () => {
      const mockResponse = {
        items: [{ id: '1', title: 'OAuth Decision' }],
        totalCount: 1,
        offset: 0,
        limit: 20,
      };

      mockFetchApi.fetch.mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.resolve(mockResponse),
      } as Response);

      const result = await client.searchAdrs('oauth');

      expect(mockFetchApi.fetch).toHaveBeenCalledWith(
        expect.stringContaining('q=oauth'),
        expect.any(Object),
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should throw error for non-404 failures', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ message: 'Internal server error' }),
      } as Response);

      await expect(client.getStats()).rejects.toThrow('Internal server error');
    });

    it('should handle JSON parse errors', async () => {
      mockFetchApi.fetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: () => Promise.reject(new Error('Invalid JSON')),
      } as Response);

      await expect(client.getStats()).rejects.toThrow();
    });
  });
});

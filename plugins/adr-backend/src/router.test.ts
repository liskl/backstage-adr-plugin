import express from 'express';
import request from 'supertest';
import { createRouter } from './router';
import { ConfigReader } from '@backstage/config';
import { mockServices } from '@backstage/backend-test-utils';
import { AdrService } from './service/AdrService';

// Mock the services
jest.mock('./service/AdrService');
jest.mock('./service/GitHubService');

const MockAdrService = AdrService as jest.MockedClass<typeof AdrService>;

describe('ADR Router', () => {
  let app: express.Express;

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Setup mock return values
    MockAdrService.prototype.getTemplates = jest.fn().mockResolvedValue([
      { id: 'madr-v3', name: 'MADR v3', format: 'madr-v3' },
      { id: 'nygard', name: 'Nygard', format: 'nygard' },
    ]);

    MockAdrService.prototype.listAdrs = jest.fn().mockResolvedValue({
      items: [],
      totalCount: 0,
      offset: 0,
      limit: 20,
    });

    const config = new ConfigReader({
      integrations: {
        github: [{ host: 'github.com', token: 'test-token' }],
      },
    });

    const router = await createRouter({
      logger: mockServices.logger.mock(),
      config,
      discovery: mockServices.discovery.mock(),
      auth: mockServices.auth.mock(),
      httpAuth: mockServices.httpAuth.mock(),
    });

    app = express();
    app.use(router);
  });

  describe('GET /health', () => {
    it('should return ok status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ status: 'ok' });
    });
  });

  describe('GET /templates', () => {
    it('should return available templates', async () => {
      const response = await request(app).get('/templates');

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('GET /authors', () => {
    it('should return list of authors', async () => {
      const mockAuthors = ['alice', 'bob', 'charlie'];
      MockAdrService.prototype.getAuthors = jest.fn().mockResolvedValue(mockAuthors);

      const response = await request(app).get('/authors');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockAuthors);
      expect(MockAdrService.prototype.getAuthors).toHaveBeenCalled();
    });
  });

  describe('GET /repositories', () => {
    it('should return list of repositories', async () => {
      const mockRepositories = [
        'https://github.com/org/repo1',
        'https://github.com/org/repo2',
      ];
      MockAdrService.prototype.getRepositories = jest.fn().mockResolvedValue(mockRepositories);

      const response = await request(app).get('/repositories');

      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockRepositories);
      expect(MockAdrService.prototype.getRepositories).toHaveBeenCalled();
    });
  });

  describe('GET /adrs with filters', () => {
    it('should pass date filters to service', async () => {
      await request(app).get('/adrs')
        .query({
          createdAfter: '2024-01-01',
          createdBefore: '2024-12-31',
          updatedAfter: '2024-06-01',
          updatedBefore: '2024-06-30',
        });

      expect(MockAdrService.prototype.listAdrs).toHaveBeenCalledWith(
        expect.objectContaining({
          createdAfter: '2024-01-01',
          createdBefore: '2024-12-31',
          updatedAfter: '2024-06-01',
          updatedBefore: '2024-06-30',
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should pass author filter to service', async () => {
      await request(app).get('/adrs').query({ author: 'alice' });

      expect(MockAdrService.prototype.listAdrs).toHaveBeenCalledWith(
        expect.objectContaining({
          author: 'alice',
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should pass repositoryUrl filter to service', async () => {
      await request(app).get('/adrs')
        .query({ repositoryUrl: 'https://github.com/org/repo' });

      expect(MockAdrService.prototype.listAdrs).toHaveBeenCalledWith(
        expect.objectContaining({
          repositoryUrl: 'https://github.com/org/repo',
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should pass status filter to service', async () => {
      await request(app).get('/adrs').query({ status: 'accepted,proposed' });

      expect(MockAdrService.prototype.listAdrs).toHaveBeenCalledWith(
        expect.objectContaining({
          status: ['accepted', 'proposed'],
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should pass search query to service', async () => {
      await request(app).get('/adrs').query({ search: 'oauth' });

      expect(MockAdrService.prototype.listAdrs).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'oauth',
        }),
        expect.any(Object),
        expect.any(Object),
      );
    });

    it('should pass pagination params to service', async () => {
      await request(app).get('/adrs').query({ limit: '10', offset: '20' });

      expect(MockAdrService.prototype.listAdrs).toHaveBeenCalledWith(
        expect.any(Object),
        { limit: 10, offset: 20 },
        expect.any(Object),
      );
    });
  });
});

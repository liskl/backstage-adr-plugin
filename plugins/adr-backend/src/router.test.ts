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
});

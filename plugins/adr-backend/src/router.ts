import { MiddlewareFactory } from '@backstage/backend-defaults/rootHttpRouter';
import {
  AuthService,
  DiscoveryService,
  HttpAuthService,
  LoggerService,
} from '@backstage/backend-plugin-api';
import { Config } from '@backstage/config';
import express from 'express';
import Router from 'express-promise-router';
import { AdrService } from './service/AdrService';
import { GitHubService } from './service/GitHubService';
import { AdrStatus } from '@backstage-community/plugin-adr-common';

/**
 * Options for creating the ADR router
 */
export interface RouterOptions {
  logger: LoggerService;
  config: Config;
  discovery: DiscoveryService;
  auth: AuthService;
  httpAuth: HttpAuthService;
}

/**
 * Creates the express router for the ADR backend plugin
 */
export async function createRouter(
  options: RouterOptions,
): Promise<express.Router> {
  const { logger, config, discovery, auth, httpAuth } = options;

  const githubService = new GitHubService({ config, logger });
  const adrService = new AdrService({
    logger,
    config,
    discovery,
    auth,
    githubService,
  });

  const router = Router();
  router.use(express.json());

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  // List all ADRs with optional filters and pagination
  router.get('/adrs', async (req, res) => {
    const credentials = await httpAuth.credentials(req);

    const {
      status,
      tags,
      category,
      repositoryUrl,
      author,
      search,
      limit = '20',
      offset = '0',
    } = req.query;

    const filters = {
      status: status ? (status as string).split(',') as AdrStatus[] : undefined,
      tags: tags ? (tags as string).split(',') : undefined,
      category: category as string | undefined,
      repositoryUrl: repositoryUrl as string | undefined,
      author: author as string | undefined,
      search: search as string | undefined,
    };

    const pagination = {
      limit: parseInt(limit as string, 10),
      offset: parseInt(offset as string, 10),
    };

    const result = await adrService.listAdrs(filters, pagination, { credentials });
    res.json(result);
  });

  // Get a single ADR by ID
  router.get('/adrs/:id', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;

    const adr = await adrService.getAdr(id, { credentials });
    if (!adr) {
      res.status(404).json({ error: 'ADR not found' });
      return;
    }
    res.json(adr);
  });

  // Create a new ADR (creates a PR)
  router.post('/adrs', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const createRequest = req.body;

    const result = await adrService.createAdr(createRequest, { credentials });
    res.status(201).json(result);
  });

  // Update an ADR (creates a PR)
  router.put('/adrs/:id', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;
    const updateRequest = req.body;

    const result = await adrService.updateAdr(id, updateRequest, { credentials });
    res.json(result);
  });

  // Delete an ADR (creates a PR)
  router.delete('/adrs/:id', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;

    await adrService.deleteAdr(id, { credentials });
    res.status(204).send();
  });

  // Update ADR status
  router.patch('/adrs/:id/status', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;
    const { status } = req.body;

    const result = await adrService.updateAdrStatus(id, status, { credentials });
    res.json(result);
  });

  // Search ADRs
  router.get('/search', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { q, limit = '20', offset = '0' } = req.query;

    const result = await adrService.searchAdrs(
      q as string,
      {
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      },
      { credentials },
    );
    res.json(result);
  });

  // Get all tags
  router.get('/tags', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const tags = await adrService.getTags({ credentials });
    res.json(tags);
  });

  // Get all categories
  router.get('/categories', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const categories = await adrService.getCategories({ credentials });
    res.json(categories);
  });

  // Get dashboard statistics
  router.get('/stats', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const stats = await adrService.getStats({ credentials });
    res.json(stats);
  });

  // Get available templates
  router.get('/templates', async (_req, res) => {
    const templates = await adrService.getTemplates();
    res.json(templates);
  });

  // Get a specific template
  router.get('/templates/:id', async (req, res) => {
    const { id } = req.params;
    const template = await adrService.getTemplate(id);
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  });

  // Get related ADRs
  router.get('/adrs/:id/related', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;

    const related = await adrService.getRelatedAdrs(id, { credentials });
    res.json(related);
  });

  // Get linked entities for an ADR
  router.get('/adrs/:id/entities', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;

    const entities = await adrService.getLinkedEntities(id, { credentials });
    res.json(entities);
  });

  // Link an ADR to an entity
  router.post('/adrs/:id/link', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { id } = req.params;
    const { entityRef } = req.body;

    await adrService.linkToEntity(id, entityRef, { credentials });
    res.status(201).json({ success: true });
  });

  // List pending PRs
  router.get('/prs', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const prs = await adrService.getPendingPrs({ credentials });
    res.json(prs);
  });

  // Get PR status
  router.get('/prs/:number', async (req, res) => {
    const credentials = await httpAuth.credentials(req);
    const { number } = req.params;

    const pr = await adrService.getPrStatus(parseInt(number, 10), { credentials });
    if (!pr) {
      res.status(404).json({ error: 'PR not found' });
      return;
    }
    res.json(pr);
  });

  const middleware = MiddlewareFactory.create({ logger, config });
  router.use(middleware.error());

  logger.info('ADR backend router created');

  return router;
}

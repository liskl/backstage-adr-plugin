import { AdrService } from './AdrService';
import { GitHubService } from './GitHubService';
import { ConfigReader } from '@backstage/config';
import { mockServices } from '@backstage/backend-test-utils';

// Mock the GitHubService
jest.mock('./GitHubService');

describe('AdrService', () => {
  let service: AdrService;
  let mockGitHubService: jest.Mocked<GitHubService>;

  beforeEach(() => {
    const config = new ConfigReader({});
    const logger = mockServices.logger.mock();
    const discovery = mockServices.discovery.mock();
    const auth = mockServices.auth.mock();

    mockGitHubService = {
      parseGitHubUrl: jest.fn(),
      getOctokit: jest.fn(),
      listFiles: jest.fn(),
      getFileContent: jest.fn(),
      createBranch: jest.fn(),
      createOrUpdateFile: jest.fn(),
      deleteFile: jest.fn(),
      createPullRequest: jest.fn(),
      getPullRequest: jest.fn(),
      listPullRequests: jest.fn(),
    } as unknown as jest.Mocked<GitHubService>;

    service = new AdrService({
      logger,
      config,
      discovery,
      auth,
      githubService: mockGitHubService,
    });
  });

  describe('parseAdrContent (via getAdr)', () => {
    // We'll test the parsing logic indirectly through integration tests
    // For now, test the service initialization
    it('should be created successfully', () => {
      expect(service).toBeDefined();
    });
  });

  describe('getTemplates', () => {
    it('should return default templates', async () => {
      const templates = await service.getTemplates();

      expect(templates).toHaveLength(2);
      expect(templates[0].id).toBe('madr-v3');
      expect(templates[0].name).toBe('MADR v3');
      expect(templates[1].id).toBe('nygard');
      expect(templates[1].name).toBe('Nygard (Classic)');
    });

    it('should have MADR template with required sections', async () => {
      const templates = await service.getTemplates();
      const madrTemplate = templates.find(t => t.id === 'madr-v3');

      expect(madrTemplate).toBeDefined();
      expect(madrTemplate?.sections).toContainEqual(
        expect.objectContaining({
          name: 'Context and Problem Statement',
          required: true,
        }),
      );
      expect(madrTemplate?.sections).toContainEqual(
        expect.objectContaining({
          name: 'Decision Outcome',
          required: true,
        }),
      );
    });

    it('should have Nygard template with required sections', async () => {
      const templates = await service.getTemplates();
      const nygardTemplate = templates.find(t => t.id === 'nygard');

      expect(nygardTemplate).toBeDefined();
      expect(nygardTemplate?.sections).toContainEqual(
        expect.objectContaining({
          name: 'Status',
          required: true,
        }),
      );
      expect(nygardTemplate?.sections).toContainEqual(
        expect.objectContaining({
          name: 'Context',
          required: true,
        }),
      );
      expect(nygardTemplate?.sections).toContainEqual(
        expect.objectContaining({
          name: 'Decision',
          required: true,
        }),
      );
      expect(nygardTemplate?.sections).toContainEqual(
        expect.objectContaining({
          name: 'Consequences',
          required: true,
        }),
      );
    });
  });

  describe('getTemplate', () => {
    it('should return a specific template by ID', async () => {
      const template = await service.getTemplate('madr-v3');

      expect(template).toBeDefined();
      expect(template?.id).toBe('madr-v3');
      expect(template?.format).toBe('madr-v3');
    });

    it('should return null for non-existent template', async () => {
      const template = await service.getTemplate('non-existent');

      expect(template).toBeNull();
    });
  });
});

describe('AdrService - Filter Methods', () => {
  // Test getAuthors, getRepositories, and date filtering

  class TestableAdrService extends AdrService {
    public setTestCache(adrs: any[]) {
      (this as any).adrCache = new Map(adrs.map(adr => [adr.id, adr]));
      (this as any).lastCacheUpdate = new Date();
    }
  }

  let service: TestableAdrService;

  const mockAdrs = [
    {
      id: 'adr-1',
      title: 'Use OAuth',
      number: 1,
      status: 'accepted',
      content: '# OAuth',
      format: 'madr-v3',
      createdAt: '2024-01-15T00:00:00Z',
      updatedAt: '2024-02-15T00:00:00Z',
      authors: ['alice', 'bob'],
      decisionMakers: ['alice'],
      repositoryUrl: 'https://github.com/org/repo1',
      filePath: 'docs/adr/0001.md',
      branch: 'main',
      tags: ['security'],
      category: 'api',
      supersedes: [],
      relatesTo: [],
      linkedEntities: [],
    },
    {
      id: 'adr-2',
      title: 'Use PostgreSQL',
      number: 2,
      status: 'proposed',
      content: '# PostgreSQL',
      format: 'madr-v3',
      createdAt: '2024-03-01T00:00:00Z',
      updatedAt: '2024-03-15T00:00:00Z',
      authors: ['charlie'],
      decisionMakers: ['charlie'],
      repositoryUrl: 'https://github.com/org/repo2',
      filePath: 'docs/adr/0002.md',
      branch: 'main',
      tags: ['database'],
      category: 'infrastructure',
      supersedes: [],
      relatesTo: [],
      linkedEntities: [],
    },
    {
      id: 'adr-3',
      title: 'Use React',
      number: 3,
      status: 'draft',
      content: '# React',
      format: 'nygard',
      createdAt: '2024-06-01T00:00:00Z',
      updatedAt: '2024-06-15T00:00:00Z',
      authors: ['alice', 'dave'],
      decisionMakers: ['alice'],
      repositoryUrl: 'https://github.com/org/repo1',
      filePath: 'docs/adr/0003.md',
      branch: 'main',
      tags: ['frontend'],
      category: 'frontend',
      supersedes: [],
      relatesTo: [],
      linkedEntities: [],
    },
  ];

  beforeEach(() => {
    const config = new ConfigReader({});
    const logger = mockServices.logger.mock();
    const discovery = mockServices.discovery.mock();
    const auth = mockServices.auth.mock();

    const mockGitHubService = {
      parseGitHubUrl: jest.fn(),
    } as unknown as GitHubService;

    service = new TestableAdrService({
      logger,
      config,
      discovery,
      auth,
      githubService: mockGitHubService,
    });

    // Populate the cache with mock data
    service.setTestCache(mockAdrs);
  });

  describe('getAuthors', () => {
    it('should return unique sorted authors from all ADRs', async () => {
      const authors = await service.getAuthors({ credentials: {} });

      expect(authors).toEqual(['alice', 'bob', 'charlie', 'dave']);
    });

    it('should return empty array when no ADRs have authors', async () => {
      service.setTestCache([
        { ...mockAdrs[0], id: 'no-authors', authors: [] },
      ]);

      const authors = await service.getAuthors({ credentials: {} });

      expect(authors).toEqual([]);
    });
  });

  describe('getRepositories', () => {
    it('should return unique sorted repositories from all ADRs', async () => {
      const repositories = await service.getRepositories({ credentials: {} });

      expect(repositories).toEqual([
        'https://github.com/org/repo1',
        'https://github.com/org/repo2',
      ]);
    });
  });

  describe('listAdrs with date filters', () => {
    it('should filter by createdAfter', async () => {
      const result = await service.listAdrs(
        { createdAfter: '2024-02-01' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(2);
      expect(result.items.map(a => a.id)).toEqual(['adr-3', 'adr-2']);
    });

    it('should filter by createdBefore', async () => {
      const result = await service.listAdrs(
        { createdBefore: '2024-02-01' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('adr-1');
    });

    it('should filter by updatedAfter', async () => {
      const result = await service.listAdrs(
        { updatedAfter: '2024-03-01' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(2);
      expect(result.items.map(a => a.id)).toEqual(['adr-3', 'adr-2']);
    });

    it('should filter by updatedBefore', async () => {
      const result = await service.listAdrs(
        { updatedBefore: '2024-03-01' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('adr-1');
    });

    it('should filter by date range', async () => {
      const result = await service.listAdrs(
        { createdAfter: '2024-02-01', createdBefore: '2024-04-01' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('adr-2');
    });

    it('should filter by author', async () => {
      const result = await service.listAdrs(
        { author: 'alice' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(2);
      expect(result.items.map(a => a.id)).toEqual(['adr-3', 'adr-1']);
    });

    it('should filter by repositoryUrl', async () => {
      const result = await service.listAdrs(
        { repositoryUrl: 'https://github.com/org/repo2' },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('adr-2');
    });

    it('should combine multiple filters', async () => {
      const result = await service.listAdrs(
        {
          author: 'alice',
          status: ['accepted'],
        },
        { limit: 20, offset: 0 },
        { credentials: {} },
      );

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe('adr-1');
    });
  });
});

describe('AdrService - ADR Parsing', () => {
  // These tests verify the parsing logic by testing the internal parseAdrContent method
  // We access it indirectly through a subclass for testing

  class TestableAdrService extends AdrService {
    public testParseAdrContent(
      content: string,
      filePath: string,
      repositoryUrl: string,
    ) {
      return (this as any).parseAdrContent(content, filePath, repositoryUrl);
    }
  }

  let service: TestableAdrService;

  beforeEach(() => {
    const config = new ConfigReader({});
    const logger = mockServices.logger.mock();
    const discovery = mockServices.discovery.mock();
    const auth = mockServices.auth.mock();

    const mockGitHubService = {
      parseGitHubUrl: jest.fn(),
    } as unknown as GitHubService;

    service = new TestableAdrService({
      logger,
      config,
      discovery,
      auth,
      githubService: mockGitHubService,
    });
  });

  describe('MADR v3 format parsing', () => {
    it('should parse MADR v3 content with YAML frontmatter', () => {
      const content = `---
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

We need to decide on an authentication mechanism.

## Decision Outcome

Chosen option: OAuth 2.0
`;

      const result = service.testParseAdrContent(
        content,
        'docs/adr/0001-use-oauth.md',
        'https://github.com/org/repo',
      );

      expect(result.title).toBe('Use OAuth 2.0 for API Authentication');
      expect(result.status).toBe('accepted');
      expect(result.format).toBe('madr-v3');
      expect(result.number).toBe(1);
      expect(result.decisionMakers).toEqual(['Jane Doe', 'John Smith']);
      expect(result.tags).toEqual(['api', 'security']);
    });

    it('should extract ADR number from filename', () => {
      const content = `---
status: draft
date: 2024-01-15
---

# Some Decision
`;

      const result = service.testParseAdrContent(
        content,
        'docs/0042-some-decision.md',
        'https://github.com/org/repo',
      );

      expect(result.number).toBe(42);
    });

    it('should handle missing decision-makers', () => {
      const content = `---
status: proposed
date: 2024-01-15
---

# A Decision
`;

      const result = service.testParseAdrContent(
        content,
        '0001-decision.md',
        'https://github.com/org/repo',
      );

      expect(result.decisionMakers).toEqual([]);
      expect(result.authors).toEqual([]);
    });
  });

  describe('Nygard format parsing', () => {
    it('should parse Nygard format content', () => {
      const content = `# 1. Record architecture decisions

Date: 2024-01-15

## Status

Accepted

## Context

We need to record architectural decisions.

## Decision

We will use ADRs.

## Consequences

All decisions will be documented.
`;

      const result = service.testParseAdrContent(
        content,
        'docs/adr/0001-record-decisions.md',
        'https://github.com/org/repo',
      );

      expect(result.title).toBe('Record architecture decisions');
      expect(result.status).toBe('accepted');
      expect(result.format).toBe('nygard');
      expect(result.number).toBe(1);
    });

    it('should extract status from Nygard format', () => {
      const content = `# 5. Use PostgreSQL

## Status

Proposed

## Context

We need a database.

## Decision

Use PostgreSQL.

## Consequences

Need to manage database.
`;

      const result = service.testParseAdrContent(
        content,
        '0005-use-postgresql.md',
        'https://github.com/org/repo',
      );

      expect(result.status).toBe('proposed');
    });
  });

  describe('Status parsing', () => {
    it.each([
      ['draft', 'draft'],
      ['Draft', 'draft'],
      ['DRAFT', 'draft'],
      ['proposed', 'proposed'],
      ['Proposed', 'proposed'],
      ['accepted', 'accepted'],
      ['Accepted', 'accepted'],
      ['rejected', 'rejected'],
      ['deprecated', 'deprecated'],
      ['superseded', 'superseded'],
    ])('should normalize status %s to %s', (input, expected) => {
      const content = `---
status: ${input}
date: 2024-01-15
---

# Test
`;

      const result = service.testParseAdrContent(
        content,
        '0001-test.md',
        'https://github.com/org/repo',
      );

      expect(result.status).toBe(expected);
    });
  });

  describe('Title extraction', () => {
    it('should extract title from markdown heading', () => {
      const content = `---
status: draft
---

# My Important Decision

Some content.
`;

      const result = service.testParseAdrContent(
        content,
        '0001-decision.md',
        'https://github.com/org/repo',
      );

      expect(result.title).toBe('My Important Decision');
    });

    it('should strip ADR number from title', () => {
      const content = `# 1. Record architecture decisions

## Status

Accepted
`;

      const result = service.testParseAdrContent(
        content,
        '0001-record.md',
        'https://github.com/org/repo',
      );

      expect(result.title).toBe('Record architecture decisions');
    });

    it('should use filename as fallback when no heading', () => {
      const content = `Some content without a heading.`;

      const result = service.testParseAdrContent(
        content,
        'docs/0001-my-decision.md',
        'https://github.com/org/repo',
      );

      expect(result.title).toBe('docs/0001-my-decision.md');
    });
  });
});

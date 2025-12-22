import { GitHubService } from './GitHubService';
import { ConfigReader } from '@backstage/config';
import { mockServices } from '@backstage/backend-test-utils';

describe('GitHubService', () => {
  let service: GitHubService;

  beforeEach(() => {
    const config = new ConfigReader({
      integrations: {
        github: [
          {
            host: 'github.com',
            token: 'test-token',
          },
        ],
      },
    });

    service = new GitHubService({
      config,
      logger: mockServices.logger.mock(),
    });
  });

  describe('parseGitHubUrl', () => {
    it('should parse a basic GitHub repository URL', () => {
      const result = service.parseGitHubUrl('https://github.com/owner/repo');

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        ref: 'main',
        path: '',
      });
    });

    it('should parse a GitHub URL with tree path', () => {
      const result = service.parseGitHubUrl(
        'https://github.com/owner/repo/tree/main/docs/adr',
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        ref: 'main',
        path: 'docs/adr',
      });
    });

    it('should parse a GitHub URL with blob path', () => {
      const result = service.parseGitHubUrl(
        'https://github.com/owner/repo/blob/develop/README.md',
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        ref: 'develop',
        path: 'README.md',
      });
    });

    it('should parse a GitHub URL with .git suffix', () => {
      const result = service.parseGitHubUrl('https://github.com/owner/repo.git');

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        ref: 'main',
        path: '',
      });
    });

    it('should parse a GitHub URL with branch containing slashes', () => {
      const result = service.parseGitHubUrl(
        'https://github.com/owner/repo/tree/feature/my-feature/src',
      );

      expect(result).toEqual({
        owner: 'owner',
        repo: 'repo',
        ref: 'feature',
        path: 'my-feature/src',
      });
    });

    it('should handle URLs with hyphenated names', () => {
      const result = service.parseGitHubUrl(
        'https://github.com/my-org/my-repo/tree/main/docs',
      );

      expect(result).toEqual({
        owner: 'my-org',
        repo: 'my-repo',
        ref: 'main',
        path: 'docs',
      });
    });

    it('should throw an error for invalid GitHub URL', () => {
      expect(() => {
        service.parseGitHubUrl('https://gitlab.com/owner/repo');
      }).toThrow('Invalid GitHub URL');
    });

    it('should throw an error for malformed URL', () => {
      expect(() => {
        service.parseGitHubUrl('not-a-url');
      }).toThrow('Invalid GitHub URL');
    });
  });
});

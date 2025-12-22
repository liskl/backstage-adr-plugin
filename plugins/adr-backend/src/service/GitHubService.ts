import { Config } from '@backstage/config';
import { LoggerService } from '@backstage/backend-plugin-api';
import {
  DefaultGithubCredentialsProvider,
  ScmIntegrations,
} from '@backstage/integration';
import { Octokit } from '@octokit/rest';

/**
 * Options for GitHubService
 */
export interface GitHubServiceOptions {
  config: Config;
  logger: LoggerService;
}

/**
 * Parsed GitHub repository information
 */
export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  path?: string;
  ref?: string;
}

/**
 * GitHub file content
 */
export interface GitHubFile {
  path: string;
  content: string;
  sha: string;
}

/**
 * Service for interacting with GitHub API
 */
export class GitHubService {
  private readonly config: Config;
  private readonly logger: LoggerService;
  private readonly integrations: ScmIntegrations;
  private readonly credentialsProvider: DefaultGithubCredentialsProvider;

  constructor(options: GitHubServiceOptions) {
    this.config = options.config;
    this.logger = options.logger;
    this.integrations = ScmIntegrations.fromConfig(this.config);
    this.credentialsProvider = DefaultGithubCredentialsProvider.fromIntegrations(
      this.integrations,
    );
  }

  /**
   * Parse a GitHub URL into owner, repo, path, and ref components
   */
  parseGitHubUrl(url: string): GitHubRepoInfo {
    const match = url.match(
      /github\.com\/([^/]+)\/([^/]+)(?:\/(?:tree|blob)\/([^/]+))?(?:\/(.+))?/,
    );

    if (!match) {
      throw new Error(`Invalid GitHub URL: ${url}`);
    }

    const [, owner, repoWithExt, ref, path] = match;
    const repo = repoWithExt.replace(/\.git$/, '');

    return {
      owner,
      repo,
      ref: ref || 'main',
      path: path || '',
    };
  }

  /**
   * Get an authenticated Octokit client for a repository
   */
  async getOctokit(repoUrl: string): Promise<Octokit> {
    const { token } = await this.credentialsProvider.getCredentials({
      url: repoUrl,
    });

    return new Octokit({
      auth: token,
    });
  }

  /**
   * List files in a directory
   */
  async listFiles(
    repoUrl: string,
    directoryPath: string,
    ref?: string,
  ): Promise<string[]> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: directoryPath,
        ref: ref || 'main',
      });

      if (!Array.isArray(response.data)) {
        return [];
      }

      return response.data
        .filter(item => item.type === 'file' && item.name.endsWith('.md'))
        .map(item => item.path);
    } catch (error: any) {
      if (error.status === 404) {
        this.logger.warn(
          `Directory not found: ${directoryPath} in ${owner}/${repo}`,
        );
        return [];
      }
      throw error;
    }
  }

  /**
   * Get file content from a repository
   */
  async getFileContent(
    repoUrl: string,
    filePath: string,
    ref?: string,
  ): Promise<GitHubFile | null> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    try {
      const response = await octokit.repos.getContent({
        owner,
        repo,
        path: filePath,
        ref: ref || 'main',
      });

      if (Array.isArray(response.data) || response.data.type !== 'file') {
        return null;
      }

      const content = Buffer.from(response.data.content, 'base64').toString(
        'utf-8',
      );

      return {
        path: filePath,
        content,
        sha: response.data.sha,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Create a new branch
   */
  async createBranch(
    repoUrl: string,
    branchName: string,
    fromRef: string = 'main',
  ): Promise<void> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    // Get the SHA of the source branch
    const refResponse = await octokit.git.getRef({
      owner,
      repo,
      ref: `heads/${fromRef}`,
    });

    // Create the new branch
    await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha: refResponse.data.object.sha,
    });
  }

  /**
   * Create or update a file in a repository
   */
  async createOrUpdateFile(
    repoUrl: string,
    filePath: string,
    content: string,
    message: string,
    branch: string,
    sha?: string,
  ): Promise<void> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    await octokit.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: filePath,
      message,
      content: Buffer.from(content).toString('base64'),
      branch,
      sha,
    });
  }

  /**
   * Delete a file from a repository
   */
  async deleteFile(
    repoUrl: string,
    filePath: string,
    message: string,
    branch: string,
    sha: string,
  ): Promise<void> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    await octokit.repos.deleteFile({
      owner,
      repo,
      path: filePath,
      message,
      sha,
      branch,
    });
  }

  /**
   * Create a pull request
   */
  async createPullRequest(
    repoUrl: string,
    title: string,
    body: string,
    headBranch: string,
    baseBranch: string = 'main',
  ): Promise<{ number: number; url: string }> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    const response = await octokit.pulls.create({
      owner,
      repo,
      title,
      body,
      head: headBranch,
      base: baseBranch,
    });

    return {
      number: response.data.number,
      url: response.data.html_url,
    };
  }

  /**
   * Get pull request status
   */
  async getPullRequest(
    repoUrl: string,
    prNumber: number,
  ): Promise<{
    number: number;
    title: string;
    url: string;
    state: 'open' | 'closed' | 'merged';
    branch: string;
    createdAt: string;
    updatedAt: string;
  } | null> {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    try {
      const response = await octokit.pulls.get({
        owner,
        repo,
        pull_number: prNumber,
      });

      let state: 'open' | 'closed' | 'merged' = 'open';
      if (response.data.merged) {
        state = 'merged';
      } else if (response.data.state === 'closed') {
        state = 'closed';
      }

      return {
        number: response.data.number,
        title: response.data.title,
        url: response.data.html_url,
        state,
        branch: response.data.head.ref,
        createdAt: response.data.created_at,
        updatedAt: response.data.updated_at,
      };
    } catch (error: any) {
      if (error.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * List open pull requests
   */
  async listPullRequests(
    repoUrl: string,
  ): Promise<
    Array<{
      number: number;
      title: string;
      url: string;
      state: 'open' | 'closed' | 'merged';
      branch: string;
      createdAt: string;
      updatedAt: string;
    }>
  > {
    const { owner, repo } = this.parseGitHubUrl(repoUrl);
    const octokit = await this.getOctokit(repoUrl);

    const response = await octokit.pulls.list({
      owner,
      repo,
      state: 'open',
    });

    return response.data.map(pr => ({
      number: pr.number,
      title: pr.title,
      url: pr.html_url,
      state: 'open' as const,
      branch: pr.head.ref,
      createdAt: pr.created_at,
      updatedAt: pr.updated_at,
    }));
  }
}

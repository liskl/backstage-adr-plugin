/**
 * ADR Backend Plugin for Backstage
 *
 * @packageDocumentation
 */

export { adrPlugin as default } from './plugin';
export { createRouter, type RouterOptions } from './router';
export { AdrService, type AdrServiceOptions } from './service/AdrService';
export { GitHubService, type GitHubServiceOptions } from './service/GitHubService';

/**
 * ADR Plugin for Backstage
 *
 * @packageDocumentation
 */

export { adrPlugin, AdrPage } from './plugin';
export { adrApiRef, AdrClient, type AdrApi, type AdrClientOptions } from './api';
export {
  rootRouteRef,
  adrDetailRouteRef,
  adrCreateRouteRef,
  adrEditRouteRef,
} from './routes';
export {
  AdrRouter,
  AdrDashboardPage,
  AdrDetailPage,
  AdrList,
  AdrStatusBadge,
  AdrStatsCards,
} from './components';

// Re-export common types for convenience
export type {
  Adr,
  AdrSummary,
  AdrStatus,
  AdrFormat,
  AdrFilters,
  AdrStats,
  AdrTemplate,
  CreateAdrRequest,
  UpdateAdrRequest,
  AdrPullRequest,
  EntityRef,
  PaginatedResponse,
  PaginationOptions,
} from '@backstage-community/plugin-adr-common';

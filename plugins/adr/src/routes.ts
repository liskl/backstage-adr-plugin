import { createRouteRef, createSubRouteRef } from '@backstage/core-plugin-api';

/**
 * Root route for the ADR plugin
 */
export const rootRouteRef = createRouteRef({
  id: 'adr',
});

/**
 * Route for viewing a single ADR
 */
export const adrDetailRouteRef = createSubRouteRef({
  id: 'adr-detail',
  parent: rootRouteRef,
  path: '/:id',
});

/**
 * Route for creating a new ADR
 */
export const adrCreateRouteRef = createSubRouteRef({
  id: 'adr-create',
  parent: rootRouteRef,
  path: '/create',
});

/**
 * Route for editing an ADR
 */
export const adrEditRouteRef = createSubRouteRef({
  id: 'adr-edit',
  parent: rootRouteRef,
  path: '/:id/edit',
});

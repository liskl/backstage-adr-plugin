import {
  createApiFactory,
  createPlugin,
  createRoutableExtension,
  discoveryApiRef,
  fetchApiRef,
} from '@backstage/core-plugin-api';
import { rootRouteRef, adrDetailRouteRef, adrCreateRouteRef, adrEditRouteRef } from './routes';
import { adrApiRef, AdrClient } from './api';

/**
 * ADR Plugin for Backstage
 *
 * @public
 */
export const adrPlugin = createPlugin({
  id: 'adr',
  routes: {
    root: rootRouteRef,
    detail: adrDetailRouteRef,
    create: adrCreateRouteRef,
    edit: adrEditRouteRef,
  },
  apis: [
    createApiFactory({
      api: adrApiRef,
      deps: { discoveryApi: discoveryApiRef, fetchApi: fetchApiRef },
      factory: ({ discoveryApi, fetchApi }) =>
        new AdrClient({ discoveryApi, fetchApi }),
    }),
  ],
});

/**
 * Main ADR page component
 *
 * @public
 */
export const AdrPage = adrPlugin.provide(
  createRoutableExtension({
    name: 'AdrPage',
    component: () => import('./components/AdrRouter').then(m => m.AdrRouter),
    mountPoint: rootRouteRef,
  }),
);

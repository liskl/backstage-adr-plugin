import {
  coreServices,
  createBackendPlugin,
} from '@backstage/backend-plugin-api';
import { createRouter } from './router';

/**
 * ADR backend plugin for Backstage
 *
 * @public
 */
export const adrPlugin = createBackendPlugin({
  pluginId: 'adr',
  register(env) {
    env.registerInit({
      deps: {
        httpRouter: coreServices.httpRouter,
        logger: coreServices.logger,
        config: coreServices.rootConfig,
        discovery: coreServices.discovery,
        auth: coreServices.auth,
        httpAuth: coreServices.httpAuth,
      },
      async init({ httpRouter, logger, config, discovery, auth, httpAuth }) {
        const router = await createRouter({
          logger,
          config,
          discovery,
          auth,
          httpAuth,
        });

        httpRouter.use(router);
        httpRouter.addAuthPolicy({
          path: '/health',
          allow: 'unauthenticated',
        });
      },
    });
  },
});

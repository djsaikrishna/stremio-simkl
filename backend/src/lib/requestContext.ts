import { AsyncLocalStorage } from 'node:async_hooks';

import { RequestHandler } from 'express';
import { Logger } from 'pino';

import { logger } from './logger';

const storage = new AsyncLocalStorage<Logger>();

export const getLogger = (module: string): Logger =>
	(storage.getStore() ?? logger).child({ module });

export const requestContextMiddleware: RequestHandler = (req, _res, next) => {
	storage.run(req.log, next);
};

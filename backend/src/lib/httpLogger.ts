import { IncomingMessage, ServerResponse } from 'node:http';

import { pinoHttp } from 'pino-http';

import { logger } from './logger';

const SILENT_PATHS = ['/health', '/metrics'];

// Remove encrypted config
const scrubUrl = (url = '') => url.replace(/^\/[^/?]{32,}/, '/[config]');

const requestSummary = (req: IncomingMessage, res: ServerResponse) =>
	`${req.method} ${scrubUrl(req.url)} ${res.statusCode}`;

export const httpLogger = pinoHttp({
	logger,
	quietReqLogger: true,
	autoLogging: {
		ignore: (req) => SILENT_PATHS.includes((req.url || '').split('?')[0]),
	},
	customLogLevel: (_req, res, err) => {
		if (err || res.statusCode >= 500) return 'error';
		if (res.statusCode >= 400) return 'warn';
		return 'info';
	},
	customSuccessMessage: requestSummary,
	customErrorMessage: requestSummary,
	serializers: {
		req: (req) => ({
			method: req.method,
			url: scrubUrl(req.url),
			userAgent: req.headers['user-agent'],
		}),
		res: (res) => ({ statusCode: res.statusCode }),
	},
});

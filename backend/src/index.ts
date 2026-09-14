import cors from 'cors';
import express, { ErrorRequestHandler } from 'express';

import { connectToRedis } from '@/cache';
import { initEncryption } from '@/encryption';
import registerCatalogRoute from '@/routes/catalog';
import registerGenerateLinkRoute from '@/routes/generateLink';
import registerManifestRoute from '@/routes/manifest';

import registerConfigureRoute from './routes/configure';
import { initMetrics, metricsEndpoint, metricsMiddleware } from './metrics';

// import { publishToCentral } from "stremio-addon-sdk";
import { getConfig } from './lib/config';
import { httpLogger } from './lib/httpLogger';
import { logger } from './lib/logger';
import { requestContextMiddleware } from './lib/requestContext';

const config = getConfig();

initEncryption();

const app = express();

app.use(httpLogger);
app.use(requestContextMiddleware);
app.use(cors());
app.use(express.json());

if (config.enableMetrics) {
	initMetrics();
	app.use(metricsMiddleware);
	app.get('/metrics', metricsEndpoint);
}

app.get('/', (_req, res) => {
	res.redirect(config.frontendUrl);
});

app.get('/health', (_req, res) => {
	res.send('OK');
});

registerManifestRoute(app);
registerConfigureRoute(app);
registerGenerateLinkRoute(app);
registerCatalogRoute(app);

const errorHandler: ErrorRequestHandler = (error, req, res, _next) => {
	const status = error.status || 500;

	if (status >= 500) {
		req.log.error({ err: error }, 'Request failed');
		res.status(500).send({ error: 'Internal Server Error' });
		return;
	}

	req.log.warn({ err: error }, 'Request rejected');
	res.status(status).send({ error: error.message });
};

app.use(errorHandler);

if (config.redis.enabled) {
	connectToRedis().catch((error) =>
		logger.error({ err: error }, 'Failed to connect to Redis'),
	);
}

const server = app.listen(config.port, () => {
	logger.info({ port: config.port }, `Server listening on port ${config.port}`);

	// if (process.env.NODE_ENV == "production") {
	// console.log("Publishing to central...");
	// try {
	// 	publishToCentral(
	// 		`https://${process.env.BACKEND_HOST}/manifest.json`
	// 	);
	// } catch (error) {
	// 	console.error("Failed to publish to central", error);
	// }
	// }
});

process.on('SIGTERM', () => {
	logger.info('Shutting down');

	server.closeIdleConnections();
	server.close(() => process.exit(0));
});

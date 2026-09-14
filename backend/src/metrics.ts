import { RequestHandler } from 'express';
import client from 'prom-client';

import { countActiveUsers } from './lib/activeUsers';
import { logger } from './lib/logger';

let register: client.Registry;

export const getRegister = () => register;

const httpRequestDurationMicroseconds = new client.Histogram({
	name: 'http_request_duration_ms',
	help: 'Duration of HTTP requests in ms',
	labelNames: ['method', 'route', 'code'],
	buckets: [0.1, 5, 15, 50, 100, 300, 500, 1000, 3000, 5000, 10000],
});

const httpRequestCounter = new client.Counter({
	name: 'http_requests_total',
	help: 'Total number of HTTP requests',
	labelNames: ['method', 'route', 'code'],
});

const activeUserWindow = 30 * 24 * 60 * 60;

const activeUsers = new client.Gauge({
	name: 'active_users',
	help: 'Unique users seen in the last 30 days',
	async collect() {
		try {
			const count = await countActiveUsers(activeUserWindow);

			if (count === undefined) {
				this.remove();
				return;
			}

			this.set(count);
		} catch (error) {
			logger.error({ err: error }, 'Failed to collect active users');
		}
	},
});

export const initMetrics = () => {
	register = new client.Registry();

	register.registerMetric(httpRequestDurationMicroseconds);
	register.registerMetric(httpRequestCounter);
	register.registerMetric(activeUsers);
};

export const metricsEndpoint: RequestHandler = async (_req, res) => {
	res.setHeader('Content-Type', getRegister().contentType);
	res.send(await getRegister().metrics());
};

export const metricsMiddleware: RequestHandler = (req, res, next) => {
	const end = httpRequestDurationMicroseconds.startTimer();
	res.on('finish', () => {
		if (!req.route) {
			return;
		}

		end({
			route: req.route.path,
			code: res.statusCode,
			method: req.method,
		});

		httpRequestCounter.inc({
			method: req.method,
			route: req.route.path,
			code: res.statusCode,
		});
	});
	next();
};

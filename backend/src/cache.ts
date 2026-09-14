import { createClient, RedisClientType } from 'redis';
import { getConfig } from './lib/config';
import { logger } from './lib/logger';

const log = logger.child({ module: 'redis' });

let client: RedisClientType;

export async function connectToRedis() {
	log.info('Connecting to Redis...');

	const config = getConfig();

	client = createClient({
		username: config.redis.username,
		password: config.redis.password,
		socket: {
			port: config.redis.port,
			host: config.redis.host,
			reconnectStrategy: function (retries) {
				if (retries > 20) {
					log.error(
						'Too many attempts to reconnect. Redis connection was terminated',
					);
					return new Error('Too many retries.');
				} else {
					return retries * 500;
				}
			},
		},
	});

	client.on('error', (error) => log.error({ err: error }, 'REDIS ERROR'));
	client.on('connect', () => log.info('Connected to Redis!'));

	await client.connect();
}

export default function getClient() {
	return client?.isReady ? client : undefined;
}

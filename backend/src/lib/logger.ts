import { pino, stdSerializers } from 'pino';

import { getConfig } from './config';

const config = getConfig();

export const logger = pino({
	level: config.log.level,
	base: { service: 'stremio-simkl-backend', env: config.env },
	timestamp: pino.stdTimeFunctions.isoTime,
	formatters: {
		level: (label) => ({ level: label }),
	},
	redact: [
		'req.headers.authorization',
		'req.headers.cookie',
		'simklToken',
		'*.simklToken',
		'token',
		'*.token',
	],
	serializers: {
		err: (error) => {
			const { type, name, message, code, stack } = stdSerializers.err(error);
			return { type, name, message, code, stack };
		},
	},
	transport:
		config.env !== 'production'
			? {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: 'HH:MM:ss.l',
						ignore: 'pid,hostname,service,env',
					},
				}
			: undefined,
});

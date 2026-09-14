import { createHash } from 'node:crypto';

import getClient from '@/cache';

import { getLogger } from './requestContext';

const KEY = 'users:active';

const nowSeconds = () => Math.floor(Date.now() / 1000);

export const hashToken = (simklToken: string) =>
	createHash('sha256').update(simklToken).digest('hex').slice(0, 12);

export const markUserActive = (userId: string) => {
	getClient()
		?.zAdd(KEY, { score: nowSeconds(), value: userId })
		.catch((error) =>
			getLogger('activeUsers').debug(
				{ err: error },
				'Failed to mark user active',
			),
		);
};

export const countActiveUsers = (windowSeconds: number) =>
	getClient()?.zCount(KEY, nowSeconds() - windowSeconds, '+inf');

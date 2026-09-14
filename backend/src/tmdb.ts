import axios from 'axios';

import getClient from '@/cache';
import { CleanedTMDBMovie, CleanedTMDBShow } from '@/types';
import { cleanTMDBMovieMeta, cleanTMDBShowMeta } from '@/utils';
import { getConfig } from './lib/config';
import { getLogger } from './lib/requestContext';
import { StremioMediaType } from './lib/mediaTypes';

const TMDB_API = 'https://api.themoviedb.org/3';

const tmdbAxios = axios.create({
	baseURL: TMDB_API,
	timeout: 5000,
	headers: {
		Authorization: `Bearer ${getConfig().tmdbApiKey}`,
	},
});

const cacheTTL = 60 * 60 * 24 * 30;
const missCacheTTL = 60 * 60 * 24;

type CleanedTMDBMeta = CleanedTMDBMovie | CleanedTMDBShow;

const endpoints: Record<
	StremioMediaType,
	{
		path: string;
		cacheKey: (tmdbId: string) => string;
		clean: (data: any) => CleanedTMDBMeta;
	}
> = {
	[StremioMediaType.Movie]: {
		path: 'movie',
		cacheKey: (tmdbId) => `tmdb:movie:${tmdbId}`,
		clean: cleanTMDBMovieMeta,
	},
	[StremioMediaType.Series]: {
		path: 'tv',
		cacheKey: (tmdbId) => `tmdb:tv:${tmdbId}`,
		clean: cleanTMDBShowMeta,
	},
	[StremioMediaType.Anime]: {
		path: 'tv',
		cacheKey: (tmdbId) => `tmdb:tv:${tmdbId}`,
		clean: cleanTMDBShowMeta,
	},
};

export async function getTMDBMeta(
	tmdbId: string,
	type: StremioMediaType,
): Promise<CleanedTMDBMeta | null> {
	const endpoint = endpoints[type];
	if (!tmdbId || !endpoint) return null;

	const key = endpoint.cacheKey(tmdbId);

	const cached = await getCachedMeta(key);
	if (cached !== undefined) return cached;

	try {
		const result = await tmdbAxios.get(`/${endpoint.path}/${tmdbId}`);

		const cleanedMeta = endpoint.clean(result.data);

		await cacheMeta(key, cleanedMeta, cacheTTL);

		return cleanedMeta;
	} catch (error: any) {
		const details = {
			err: error,
			tmdbId,
			type,
			status: error.response?.status,
		};

		if (isMissing(error)) {
			getLogger('tmdb').debug(details, 'TMDB item not found');
			await cacheMeta(key, null, missCacheTTL);
		} else {
			getLogger('tmdb').error(details, 'TMDB API ERROR');
		}

		return null;
	}
}

const isMissing = (error: any) => error.response?.status === 404;

// undefined = nothing cached, null = cache miss
async function getCachedMeta(
	key: string,
): Promise<CleanedTMDBMeta | null | undefined> {
	try {
		const redisClient = getClient();
		if (!redisClient) return undefined;

		const dataStr = await redisClient.get(key);
		if (dataStr === null) return undefined;

		return JSON.parse(dataStr);
	} catch (error) {
		getLogger('tmdb').error({ err: error, key }, 'Failed to read cached meta');
		return undefined;
	}
}

async function cacheMeta(
	key: string,
	meta: CleanedTMDBMeta | null,
	ttl: number,
): Promise<void> {
	try {
		const redisClient = getClient();
		if (!redisClient) return;

		await redisClient.set(key, JSON.stringify(meta), {
			EX: ttl,
		});
	} catch (error) {
		getLogger('tmdb').error({ err: error, key }, 'Failed to cache meta');
	}
}

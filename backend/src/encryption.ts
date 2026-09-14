import crypto from 'crypto';
import {
	SelectedCatalog,
	allCatalogs,
	allSortOptions,
	catalogToInt,
	resolveSort,
	sortToInt,
	toSelectedCatalogs,
} from '@shared/catalogs';
import { getConfig } from './lib/config';
import { getLogger } from './lib/requestContext';

const algorithm = 'aes-192-cbc';
let key: Buffer;

type ConfigData = {
	simklToken: string;
	selectedCatalogs: SelectedCatalog[];
};

type EncryptedConfig = {
	simklToken: string;
	selectedCatalogs: string;
	// Missing on configs generated before sorting was configurable
	sortOptions?: string;
};

export function initEncryption() {
	const envKey = getConfig().encryption.key;
	const envSalt = getConfig().encryption.salt;

	if (!envKey || !envSalt) {
		throw new Error('Encryption key or salt not found!');
	}

	key = crypto.scryptSync(envKey, envSalt, 24);
}

export function encrypt(data: EncryptedConfig): string {
	try {
		const dataStr = JSON.stringify(data);
		const iv = crypto.randomBytes(16);
		const cipher = crypto.createCipheriv(algorithm, key, iv);
		const encrypted = Buffer.concat([cipher.update(dataStr), cipher.final()]);
		return `${iv.toString('hex')}:${encrypted.toString('hex')}`;
	} catch (error) {
		getLogger('encryption').error({ err: error }, 'Error encrypting data');
		return '';
	}
}

export function decrypt(data: string): EncryptedConfig | string {
	try {
		const [iv, encrypted] = data.split(':');
		const decipher = crypto.createDecipheriv(
			algorithm,
			key,
			Buffer.from(iv, 'hex'),
		);
		const decrypted = Buffer.concat([
			decipher.update(Buffer.from(encrypted, 'hex')),
			decipher.final(),
		]);

		// For backwards compatibility
		try {
			const parsed = JSON.parse(decrypted.toString());
			if (
				typeof parsed === 'object' &&
				parsed !== null &&
				'simklToken' in parsed &&
				'selectedCatalogs' in parsed
			) {
				return parsed;
			}
		} catch {
			// Do nothing
		}

		return decrypted.toString();
	} catch (error) {
		getLogger('encryption').warn({ err: error }, 'Error decrypting data');
		return { simklToken: '', selectedCatalogs: '' };
	}
}

export function generateEncryptedConfig(
	simklToken: string,
	selectedCatalogs: SelectedCatalog[],
): string {
	return encrypt({
		simklToken,
		selectedCatalogs: selectedCatalogs
			.map(({ catalog }) => catalogToInt(catalog))
			.join(''),
		sortOptions: selectedCatalogs.map(({ sort }) => sortToInt(sort)).join(''),
	});
}

const decodeCatalog = (
	catalogDigit: string,
	sortDigit: string | undefined,
): SelectedCatalog | null => {
	const catalog = allCatalogs[Number(catalogDigit)];
	if (!catalog) return null;

	return {
		catalog,
		sort: resolveSort(catalog, allSortOptions[Number(sortDigit)]),
	};
};

export function decryptConfig(encryptedData: string): ConfigData {
	const data = decrypt(encryptedData);

	if (typeof data === 'string') {
		return {
			simklToken: data,
			selectedCatalogs: toSelectedCatalogs(allCatalogs),
		};
	}

	const selectedCatalogs = data.selectedCatalogs
		.split('')
		.map((digit, index) => decodeCatalog(digit, data.sortOptions?.[index]))
		.filter((entry) => entry !== null);

	return {
		simklToken: data.simklToken,
		selectedCatalogs,
	};
}

// function generateEncKey() {
// 	return generateKeySync("aes", { length: 256 }).export().toString("hex");
// }

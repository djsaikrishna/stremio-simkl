import { SelectedCatalog } from '@shared/catalogs';

export interface AppStoreState {
	code: string | undefined;
	installLink: string | undefined;
	selectedCatalogs: SelectedCatalog[];
}

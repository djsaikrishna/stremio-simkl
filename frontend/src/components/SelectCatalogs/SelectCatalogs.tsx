import { useState } from 'react';
import styles from './SelectCatalogs.module.scss';
import {
	CatalogType,
	SortOption,
	allCatalogs,
	defaultCatalogSort,
	defaultCatalogs,
} from '@shared/catalogs';
import { CatalogItem } from './CatalogItem';
import { setSelectedCatalogs } from '@/lib/appStore';

import { DndProvider } from 'react-dnd-multi-backend';
import { HTML5toTouch } from 'rdndmb-html5-to-touch';

export const SelectCatalogs = () => {
	const [orderedCatalogs, setOrderedCatalogs] = useState(
		allCatalogs.map((c) => ({
			name: c,
			selected: defaultCatalogs.includes(c),
			sort: defaultCatalogSort(c),
		})),
	);

	const updateCatalogs = (catalogs: typeof orderedCatalogs) => {
		setOrderedCatalogs(catalogs);
		setSelectedCatalogs(
			catalogs
				.filter((c) => c.selected)
				.map(({ name, sort }) => ({ catalog: name, sort })),
		);
	};

	const toggleSelect = (catalog: CatalogType) => {
		updateCatalogs(
			orderedCatalogs.map((c) =>
				c.name === catalog ? { ...c, selected: !c.selected } : c,
			),
		);
	};

	const setSort = (catalog: CatalogType, sort: SortOption) => {
		updateCatalogs(
			orderedCatalogs.map((c) => (c.name === catalog ? { ...c, sort } : c)),
		);
	};

	const moveCatalog = (fromIndex: number, toIndex: number) => {
		const updatedCatalogs = [...orderedCatalogs];
		const [movedItem] = updatedCatalogs.splice(fromIndex, 1);
		updatedCatalogs.splice(toIndex, 0, movedItem);

		updateCatalogs(updatedCatalogs);
	};

	return (
		<div className={styles['catalog-container']}>
			<h2>Catalogs:</h2>

			<div className={styles['catalog-list']}>
				<DndProvider options={HTML5toTouch}>
					{orderedCatalogs.map(({ name, selected, sort }, index) => (
						<CatalogItem
							key={name}
							catalog={name}
							index={index}
							moveCatalog={moveCatalog}
							toggleSelect={toggleSelect}
							setSort={setSort}
							isSelected={selected}
							sort={sort}
						/>
					))}
				</DndProvider>
			</div>
		</div>
	);
};

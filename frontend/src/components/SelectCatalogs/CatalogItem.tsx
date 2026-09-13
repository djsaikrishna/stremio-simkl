import { useDrag, useDrop } from "react-dnd";
import styles from "./CatalogItem.module.scss";
import {
  CatalogType,
  SortOption,
  catalogSortOptions,
  frontendCatalogNames,
} from "@shared/catalogs";
import { useRef } from "react";
import type { Identifier, XYCoord } from "dnd-core";
import { isMobileDevice } from "@/lib/utils";

type CatalogItemProps = {
  catalog: CatalogType;
  index: number;
  moveCatalog: (dragIndex: number, hoverIndex: number) => void;
  toggleSelect: (catalog: CatalogType) => void;
  setSort: (catalog: CatalogType, sort: SortOption) => void;
  isSelected: boolean;
  sort: SortOption;
};

type DragItem = {
  index: number;
  type: "CATALOG";
  catalog: CatalogType;
};

const isMobile = isMobileDevice();

export const CatalogItem = ({
  catalog,
  index,
  moveCatalog,
  toggleSelect,
  setSort,
  isSelected,
  sort,
}: CatalogItemProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const dragHandleRef = useRef<HTMLSpanElement>(null);

  const [{ handlerId }, drop] = useDrop<
    DragItem,
    void,
    { handlerId: Identifier | null }
  >({
    accept: "CATALOG",
    collect(monitor) {
      return {
        handlerId: monitor.getHandlerId(),
      };
    },
    hover(item: DragItem, monitor) {
      if (!ref.current) {
        return;
      }
      const dragIndex = item.index;
      const hoverIndex = index;

      if (dragIndex === hoverIndex) {
        return;
      }

      const hoverBoundingRect = ref.current?.getBoundingClientRect();

      const hoverMiddleY =
        (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2;

      const clientOffset = monitor.getClientOffset();

      const hoverClientY = (clientOffset as XYCoord).y - hoverBoundingRect.top;

      if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
        return;
      }

      if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
        return;
      }

      moveCatalog(dragIndex, hoverIndex);

      item.index = hoverIndex;
    },
  });

  const [{ isDragging }, drag, preview] = useDrag({
    type: "CATALOG",
    item: () => {
      return { index, catalog, type: "CATALOG" };
    },
    collect: (monitor: any) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const draggingOpacity = isMobile ? 1 : 0.3;
  const opacity = isDragging ? draggingOpacity : isSelected ? 1 : 0.3;

  drop(preview(ref));
  drag(dragHandleRef);

  return (
    <div
      ref={ref}
      style={{
        opacity,
        backgroundColor: isMobile && isDragging ? "rgba(0, 0, 0, 0.15)" : "",
      }}
      className={styles["catalog-item"]}
      data-handler-id={handlerId}
    >
      <div
        className={styles["catalog-checkbox-container"]}
        onClick={() => toggleSelect(catalog)}
      >
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleSelect(catalog)}
          className={styles["catalog-checkbox"]}
        />
      </div>
      <span ref={dragHandleRef} className={styles["drag-handle"]}>
        ☰
      </span>
      {frontendCatalogNames[catalog]}
      <select
        className={styles["catalog-sort"]}
        value={sort}
        disabled={!isSelected}
        onChange={(e) => setSort(catalog, e.target.value as SortOption)}
      >
        {catalogSortOptions(catalog).map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
};

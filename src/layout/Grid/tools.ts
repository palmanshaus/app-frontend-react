import { isNodeRef } from 'src/utils/layout/nodeRef';
import type { GridRow, GridRows } from 'src/layout/common.generated';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export function nodesFromGrid(grid: LayoutNode<'Grid'>): LayoutNode[] {
  return nodesFromGridRows(grid.item.rows);
}

export function nodesFromGridRows(rows: GridRows): LayoutNode[] {
  const out: LayoutNode[] = [];
  for (const row of rows) {
    if (isGridRowHidden(row)) {
      continue;
    }

    out.push(...nodesFromGridRow(row));
  }

  return out;
}

export function nodesFromGridRow(row: GridRow): LayoutNode[] {
  const out: LayoutNode[] = [];
  for (const cell of row.cells) {
    if (isNodeRef(cell)) {
      out.push(cell.node);
    }
  }

  return out;
}

export function isGridRowHidden(row: GridRow) {
  let atLeastNoneNodeExists = false;
  const allCellsAreHidden = row.cells.every((cell) => {
    if (isNodeRef(cell)) {
      atLeastNoneNodeExists = true;
      return node.isHidden();
    }

    // Non-component cells always collapse and hide if components in other cells are hidden
    return true;
  });

  return atLeastNoneNodeExists && allCellsAreHidden;
}

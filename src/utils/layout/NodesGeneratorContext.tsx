import React, { useMemo } from 'react';
import type { PropsWithChildren } from 'react';

import { createContext } from 'src/core/contexts/context';
import type { CompExternal, CompInternal, CompTypes } from 'src/layout/layout';
import type { BaseRow } from 'src/utils/layout/itemState';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutPage } from 'src/utils/layout/LayoutPage';
import type { HiddenState, HiddenStateNode, HiddenStatePage } from 'src/utils/layout/NodesContext';

type ChildMutator<T extends CompTypes = CompTypes> = (item: CompExternal<T>) => void;

export interface ChildrenMap {
  [parentId: string]: string[];
}

interface ProviderProps {
  directMutators?: ChildMutator[];
  recursiveMutators?: ChildMutator[];
  row?: BaseRow;
}

interface PageProviderProps extends ProviderProps {
  layoutMap: Record<string, CompExternal>;
  childrenMap: ChildrenMap;
  hidden: HiddenStatePage;
}

interface NodesGeneratorContext extends Omit<PageProviderProps, 'hidden'> {
  hidden: HiddenState;
  parent: LayoutNode | LayoutPage;
  item: CompInternal | undefined;
  claimedChildren: Set<string>;
  page: LayoutPage;
  depth: number; // Depth is 1 for top level nodes, 2 for children of top level nodes, etc.
}

const { Provider, useCtx } = createContext<NodesGeneratorContext>({
  name: 'NodesGenerator',
  required: true,
});

type RealNodeGeneratorProps = PropsWithChildren<ProviderProps> & {
  hidden: Omit<HiddenStateNode, 'parent'>;
  parent: LayoutNode;
  item: CompInternal;
};

const emptyArray: never[] = [];

/**
 * This provider will use upper contexts to set the hidden and depth values, as well as inherit recursive
 * mutators from the parent. This way we can have a single recursive mutator that is applied to all children, no
 * matter how many levels of context providers we have.
 */
function _NodesGeneratorProvider({ children, ...rest }: RealNodeGeneratorProps) {
  const parent = useCtx();
  const value: NodesGeneratorContext = useMemo(
    () => ({
      // Inherit all values from the parent, overwrite with our own if they are passed
      ...parent,
      ...rest,

      // Direct mutators and rows are not meant to be inherited, if none are passed to us directly we'll reset
      directMutators: rest.directMutators ?? emptyArray,
      row: rest.row ?? undefined,

      // If the parent is hidden, we are also hidden. The default is false, and every component inside a hidden one
      // will be marked as hidden as well.
      hidden: {
        parent: parent.hidden,
        ...rest.hidden,
      },

      depth: parent.depth + 1,
    }),
    [parent, rest],
  );

  return <Provider value={value}>{children}</Provider>;
}

export const NodesGeneratorProvider = React.memo(_NodesGeneratorProvider);
NodesGeneratorProvider.displayName = 'NodesGeneratorProvider';

type RealNodeGeneratorPageProps = PropsWithChildren<PageProviderProps> & { parent: LayoutPage };
function _NodesGeneratorPageProvider({ children, ...rest }: RealNodeGeneratorPageProps) {
  const value: NodesGeneratorContext = useMemo(
    () => ({
      page: rest.parent,
      claimedChildren: new Set(Object.values(rest.childrenMap).flat()),
      item: undefined,

      // For a page, the depth starts at 1 because in principle the page is the top level node, at depth 0, so
      // when a page provides a depth indicator to its children (the top level components on that page), it should be 1.
      depth: 1,

      ...rest,
    }),
    [rest],
  );

  return <Provider value={value}>{children}</Provider>;
}

export const NodesGeneratorPageProvider = React.memo(_NodesGeneratorPageProvider);
NodesGeneratorPageProvider.displayName = 'NodesGeneratorPageProvider';

export const NodeGeneratorInternal = {
  useDirectMutators: () => useCtx().directMutators ?? emptyArray,
  useRecursiveMutators: () => useCtx().recursiveMutators ?? emptyArray,
  useHiddenState: () => useCtx().hidden,
  useDepth: () => useCtx().depth,
  useLayoutMap: () => useCtx().layoutMap,
  useChildrenMap: () => useCtx().childrenMap,
  useClaimedChildren: () => useCtx().claimedChildren,
  useParent: () => useCtx().parent,
  usePage: () => useCtx().page,
  useRow: () => useCtx().row,
  useItem: () => useCtx().item,
};

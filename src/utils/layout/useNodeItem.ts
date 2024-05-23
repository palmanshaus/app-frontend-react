import { useCallback, useMemo } from 'react';
import type { MutableRefObject } from 'react';

import { FD } from 'src/features/formData/FormDataWrite';
import { NodesInternal } from 'src/utils/layout/NodesContext';
import type { WaitForState } from 'src/hooks/useWaitForState';
import type { FormDataSelector, NodeRef } from 'src/layout';
import type { CompTypes, IDataModelBindings, NodeItem, TypeFromNode } from 'src/layout/layout';
import type { IComponentFormData } from 'src/utils/formComponentUtils';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { NodeData, NodeItemFromNode } from 'src/utils/layout/types';
import type { TraversalRestriction } from 'src/utils/layout/useNodeTraversal';

/**
 * Use the item of a node. This re-renders when the item changes (or when the part of the item you select changes),
 * which doesn't happen if you use node.item directly.
 */
export function useNodeItem<N extends LayoutNode | undefined, Out>(
  node: N,
  selector: (item: NodeItemFromNode<N>) => Out,
): Out;
export function useNodeItem<N extends LayoutNode | undefined>(node: N, selector?: undefined): NodeItemFromNode<N>;
export function useNodeItem(node: never, selector: never): never {
  return NodesInternal.useNodeDataMemo(node, (node: NodeData) => (selector ? (selector as any)(node.item) : node.item));
}

export function useNodeItemRef<N extends LayoutNode | undefined, Out>(
  node: N,
  selector: (item: NodeItemFromNode<N>) => Out,
): MutableRefObject<Out>;
export function useNodeItemRef<N extends LayoutNode | undefined>(
  node: N,
  selector?: undefined,
): MutableRefObject<NodeItemFromNode<N>>;
export function useNodeItemRef(node: never, selector: never): never {
  return NodesInternal.useNodeDataRef(node, (node: NodeData) =>
    selector ? (selector as any)(node.item) : node.item,
  ) as never;
}

const selectNodeItem = <T extends CompTypes>(data: NodeData<T>): NodeItem<T> | undefined => data.item as NodeItem<T>;
export function useWaitForNodeItem<RetVal, N extends LayoutNode | undefined>(
  node: N,
): WaitForState<NodeItemFromNode<N> | undefined, RetVal> {
  return NodesInternal.useWaitForNodeData(node, selectNodeItem) as WaitForState<
    NodeItemFromNode<N> | undefined,
    RetVal
  >;
}

export function useNodeDirectChildren(parent: LayoutNode, restriction?: TraversalRestriction): NodeRef[] | undefined {
  return NodesInternal.useNodeData(parent, (store) => parent.def.pickDirectChildren(store as any, restriction));
}

type NodeFormData<N extends LayoutNode | undefined> = N extends undefined
  ? IComponentFormData<TypeFromNode<Exclude<N, undefined>>> | undefined
  : IComponentFormData<TypeFromNode<Exclude<N, undefined>>>;

const emptyObject = {};
export function useNodeFormData<N extends LayoutNode | undefined>(node: N): NodeFormData<N> {
  const nodeItem = useNodeItem(node);
  const formDataSelector = FD.useDebouncedSelector();
  const dataModelBindings = nodeItem?.dataModelBindings;

  return useMemo(
    () => (dataModelBindings ? getNodeFormData(dataModelBindings, formDataSelector) : emptyObject) as NodeFormData<N>,
    [dataModelBindings, formDataSelector],
  );
}

export type NodeFormDataSelector = ReturnType<typeof useNodeFormDataSelector>;
export function useNodeFormDataSelector() {
  const nodeSelector = NodesInternal.useNodeDataMemoSelector();
  const formDataSelector = FD.useDebouncedSelector();

  return useCallback(
    <N extends LayoutNode | undefined>(node: N): NodeFormData<N> => {
      const dataModelBindings = nodeSelector({ node, path: 'item.dataModelBindings' }) as
        | IDataModelBindings
        | undefined;
      return dataModelBindings
        ? (getNodeFormData(dataModelBindings, formDataSelector) as NodeFormData<N>)
        : (emptyObject as NodeFormData<N>);
    },
    [nodeSelector, formDataSelector],
  );
}

function getNodeFormData<N extends LayoutNode>(
  dataModelBindings: IDataModelBindings<TypeFromNode<N>>,
  formDataSelector: FormDataSelector,
): NodeFormData<N> {
  if (!dataModelBindings) {
    return emptyObject as NodeFormData<N>;
  }

  const formDataObj: { [key: string]: any } = {};
  for (const key of Object.keys(dataModelBindings)) {
    const binding = dataModelBindings[key];
    const data = formDataSelector(binding);

    if (key === 'list') {
      formDataObj[key] = data ?? [];
    } else if (key === 'simpleBinding') {
      formDataObj[key] = data != null ? String(data) : '';
    } else {
      formDataObj[key] = data;
    }
  }

  return formDataObj as NodeFormData<N>;
}

import { useMemo } from 'react';

import { useApplicationSettings } from 'src/features/applicationSettings/ApplicationSettingsProvider';
import { useAttachmentsSelector } from 'src/features/attachments/hooks';
import { useDevToolsStore } from 'src/features/devtools/data/DevToolsStore';
import { useLayoutSettings } from 'src/features/form/layoutSettings/LayoutSettingsContext';
import { FD } from 'src/features/formData/FormDataWrite';
import { useLaxInstanceDataSources } from 'src/features/instance/InstanceContext';
import { useLaxProcessData } from 'src/features/instance/ProcessContext';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { useLanguageWithForcedNodeSelector } from 'src/features/language/useLanguage';
import { useNodeOptionsSelector } from 'src/features/options/useNodeOptions';
import { getComponentDef } from 'src/layout';
import { buildAuthContext } from 'src/utils/authContext';
import { generateEntireHierarchy } from 'src/utils/layout/HierarchyGenerator';
import { Hidden, NodesInternal } from 'src/utils/layout/NodesContext';
import { useDataModelBindingTranspose } from 'src/utils/layout/useDataModelBindingTranspose';
import { useNodeFormDataSelector } from 'src/utils/layout/useNodeItem';
import { useNodeTraversalSelectorLax } from 'src/utils/layout/useNodeTraversal';
import type { ExpressionDataSources } from 'src/features/expressions/ExprContext';
import type { ILayouts } from 'src/layout/layout';
import type { LayoutPages } from 'src/utils/layout/LayoutPages';

/**
 * This will generate an entire layout hierarchy, iterate each
 * component/group in the layout and resolve all expressions for them.
 * TODO: Remove this when no longer in use
 */
function resolvedNodesInLayouts(
  layouts: ILayouts | null,
  currentView: string | undefined,
  dataSources: ExpressionDataSources,
) {
  // A full copy is needed here because formLayout comes from the redux store, and in production code (not the
  // development server!) the properties are not mutable (but we have to mutate them below).
  const layoutsCopy: ILayouts = layouts ? structuredClone(layouts) : {};
  const unresolved = generateEntireHierarchy(layoutsCopy, currentView, dataSources, getComponentDef);
  return unresolved as unknown as LayoutPages;
}

export function useExpressionDataSources(): ExpressionDataSources {
  const instanceDataSources = useLaxInstanceDataSources();
  const formDataSelector = FD.useDebouncedSelector();
  const layoutSettings = useLayoutSettings();
  const attachmentsSelector = useAttachmentsSelector();
  const optionsSelector = useNodeOptionsSelector();
  const process = useLaxProcessData();
  const applicationSettings = useApplicationSettings();
  const devToolsIsOpen = useDevToolsStore((state) => state.isOpen);
  const devToolsHiddenComponents = useDevToolsStore((state) => state.hiddenComponents);
  const langToolsSelector = useLanguageWithForcedNodeSelector();
  const currentLanguage = useCurrentLanguage();
  const authContext = useMemo(() => buildAuthContext(process?.currentTask), [process?.currentTask]);
  const isHiddenSelector = Hidden.useIsHiddenSelector();
  const nodeFormDataSelector = useNodeFormDataSelector();
  const nodeDataSelector = NodesInternal.useNodeDataSelector();
  const nodeTraversal = useNodeTraversalSelectorLax();
  const transposeSelector = useDataModelBindingTranspose();

  return useMemo(
    () => ({
      formDataSelector,
      attachmentsSelector,
      layoutSettings,
      process,
      optionsSelector,
      applicationSettings,
      instanceDataSources,
      authContext,
      devToolsIsOpen,
      devToolsHiddenComponents,
      langToolsSelector,
      currentLanguage,
      isHiddenSelector,
      nodeFormDataSelector,
      nodeDataSelector,
      nodeTraversal,
      transposeSelector,
    }),
    [
      formDataSelector,
      attachmentsSelector,
      layoutSettings,
      optionsSelector,
      process,
      applicationSettings,
      instanceDataSources,
      authContext,
      devToolsIsOpen,
      devToolsHiddenComponents,
      langToolsSelector,
      currentLanguage,
      isHiddenSelector,
      nodeFormDataSelector,
      nodeDataSelector,
      nodeTraversal,
      transposeSelector,
    ],
  );
}

/**
 * Exported only for testing. Please do not use!
 */
export const _private = {
  resolvedNodesInLayouts,
};

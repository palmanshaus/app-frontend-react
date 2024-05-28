import React, { useCallback, useEffect } from 'react';
import type { PropsWithChildren } from 'react';

import { createStore } from 'zustand';
import { immer } from 'zustand/middleware/immer';

import { createZustandContext } from 'src/core/contexts/zustandContext';
import { Loader } from 'src/core/loading/Loader';
import { useHasPendingAttachments } from 'src/features/attachments/hooks';
import { FD } from 'src/features/formData/FormDataWrite';
import { useProcessTaskId } from 'src/features/instance/useProcessTaskId';
import { useBackendValidation } from 'src/features/validation/backendValidation/useBackendValidation';
import { useExpressionValidation } from 'src/features/validation/expressionValidation/useExpressionValidation';
import { useInvalidDataValidation } from 'src/features/validation/invalidDataValidation/useInvalidDataValidation';
import { useSchemaValidation } from 'src/features/validation/schemaValidation/useSchemaValidation';
import {
  getVisibilityMask,
  hasValidationErrors,
  mergeFieldValidations,
  selectValidations,
} from 'src/features/validation/utils';
import { useAsRef } from 'src/hooks/useAsRef';
import { useIsPdf } from 'src/hooks/useIsPdf';
import { TaskKeys } from 'src/hooks/useNavigatePage';
import { useWaitForState } from 'src/hooks/useWaitForState';
import type {
  BackendValidationIssueGroups,
  BaseValidation,
  FieldValidations,
  ValidationContext,
  WaitForValidation,
} from 'src/features/validation';
import type { DelayedSecondaryFunc } from 'src/hooks/delayedSelectors';

interface Internals {
  isLoading: boolean;
  individualValidations: {
    backend: FieldValidations;
    expression: FieldValidations;
    schema: FieldValidations;
    invalidData: FieldValidations;
  };
  issueGroupsProcessedLast: BackendValidationIssueGroups | undefined;
  updateValidations: <K extends keyof Internals['individualValidations']>(
    key: K,
    value: Internals['individualValidations'][K],
    issueGroups?: BackendValidationIssueGroups,
  ) => void;
  updateTaskValidations: (validations: BaseValidation[]) => void;
  updateValidating: (validating: WaitForValidation) => void;
}

function initialCreateStore() {
  return createStore<ValidationContext & Internals>()(
    immer((set) => ({
      // =======
      // Publicly exposed state
      state: {
        task: [],
        fields: {},
      },
      setShowAllErrors: (newValue) =>
        set((state) => {
          state.showAllErrors = newValue;
        }),
      showAllErrors: false,
      validating: async () => {
        throw new Error('Validating function not set yet');
      },

      // =======
      // Internal state
      isLoading: true,
      individualValidations: {
        backend: {},
        expression: {},
        schema: {},
        invalidData: {},
      },
      issueGroupsProcessedLast: undefined,
      updateValidations: (key, validations, issueGroups) =>
        set((state) => {
          if (key === 'backend') {
            state.isLoading = false;
            state.issueGroupsProcessedLast = issueGroups;
          }
          state.individualValidations[key] = validations;
          state.state.fields = mergeFieldValidations(
            state.individualValidations.backend,
            state.individualValidations.invalidData,
            state.individualValidations.schema,
            state.individualValidations.expression,
          );
        }),
      updateTaskValidations: (validations) =>
        set((state) => {
          state.state.task = validations;
        }),
      updateValidating: (newValidating) =>
        set((state) => {
          state.validating = newValidating;
        }),
    })),
  );
}

const {
  Provider,
  useSelector,
  useLaxSelector,
  useSelectorAsRef,
  useStore,
  useLaxSelectorAsRef,
  useDelayedMemoSelectorFactory,
} = createZustandContext({
  name: 'Validation',
  required: true,
  initialCreateStore,
});

interface InternalProps {
  shouldLoadValidations: boolean;
}

export function ValidationProvider({ children }: PropsWithChildren) {
  const isCustomReceipt = useProcessTaskId() === TaskKeys.CustomReceipt;
  const isPDF = useIsPdf();
  const shouldLoadValidations = !isCustomReceipt && !isPDF;

  return (
    <Provider>
      <UpdateValidations shouldLoadValidations={shouldLoadValidations} />
      <ManageShowAllErrors />
      <LoadingBlocker shouldLoadValidations={shouldLoadValidations}>{children}</LoadingBlocker>
    </Provider>
  );
}

function useWaitForValidation(): WaitForValidation {
  const waitForSave = FD.useWaitForSave();
  const waitForState = useWaitForState<never, ValidationContext & Internals>(useStore());
  const hasPendingAttachments = useHasPendingAttachments();

  // Provide a promise that resolves when all pending validations have been completed
  const pendingAttachmentsRef = useAsRef(hasPendingAttachments);
  const waitForAttachments = useWaitForState(pendingAttachmentsRef);

  return useCallback(
    async (forceSave = true) => {
      await waitForAttachments((state) => !state);

      // Wait until we've saved changed to backend, and we've processed the backend validations we got from that save
      const validationsFromSave = await waitForSave(forceSave);
      await waitForState((state) => state.issueGroupsProcessedLast === validationsFromSave);
    },
    [waitForAttachments, waitForSave, waitForState],
  );
}

export function ProvideWaitForValidation() {
  const validate = useWaitForValidation();
  const updateValidating = useSelector((state) => state.updateValidating);

  useEffect(() => {
    updateValidating(validate);
  }, [updateValidating, validate]);

  return null;
}

function LoadingBlocker({ children, shouldLoadValidations }: PropsWithChildren<InternalProps>) {
  const isLoading = useSelector((state) => state.isLoading);
  if (isLoading && shouldLoadValidations) {
    return <Loader reason='validation' />;
  }

  return <>{children}</>;
}

function UpdateValidations({ shouldLoadValidations }: InternalProps) {
  const updateValidations = useSelector((state) => state.updateValidations);
  const backendValidation = useBackendValidation({ enabled: shouldLoadValidations });

  useEffect(() => {
    const { validations: backendValidations, processedLast, initialValidationDone } = backendValidation;
    if (initialValidationDone) {
      updateValidations('backend', backendValidations, processedLast);
    }
  }, [backendValidation, updateValidations]);

  const schemaValidations = useSchemaValidation();
  const invalidDataValidations = useInvalidDataValidation();

  useEffect(() => {
    updateValidations('schema', schemaValidations);
  }, [schemaValidations, updateValidations]);

  useEffect(() => {
    updateValidations('invalidData', invalidDataValidations);
  }, [invalidDataValidations, updateValidations]);

  return null;
}

export function UpdateExpressionValidation() {
  const updateValidations = useSelector((state) => state.updateValidations);
  const expressionValidations = useExpressionValidation();

  useEffect(() => {
    updateValidations('expression', expressionValidations);
  }, [expressionValidations, updateValidations]);

  return null;
}

function ManageShowAllErrors() {
  const taskValidations = useSelector((state) => state.state.task);
  const fieldValidations = useSelector((state) => state.state.fields);
  const showAllErrors = useSelector((state) => state.showAllErrors);
  const setShowAllErrors = useSelector((state) => state.setShowAllErrors);

  /**
   * Hide unbound errors as soon as possible.
   */
  useEffect(() => {
    if (showAllErrors) {
      const backendMask = getVisibilityMask(['Backend', 'CustomBackend']);
      const hasFieldErrors =
        Object.values(fieldValidations).flatMap((field) => selectValidations(field, backendMask, 'error')).length > 0;

      if (!hasFieldErrors && !hasValidationErrors(taskValidations)) {
        setShowAllErrors(false);
      }
    }
  }, [fieldValidations, setShowAllErrors, showAllErrors, taskValidations]);

  return null;
}

/**
 * This hook returns a function that lets you select one or more fields from the validation state. The hook will
 * only force a re-render if the selected fields have changed.
 */
function useDelayedSelector<U>(outerSelector: (state: ValidationContext) => U) {
  return useDelayedMemoSelectorFactory(
    (innerSelector: <U2>(state: U) => U2) => (state: ValidationContext) => innerSelector(outerSelector(state)),
  ) as DelayedSecondaryFunc<U>;
}

export type ValidationSelector = DelayedSecondaryFunc<ValidationContext>;
export type ValidationFieldSelector = DelayedSecondaryFunc<FieldValidations>;

export const Validation = {
  useFullStateRef: () => useSelectorAsRef((state) => state.state),

  // Selectors. These are memoized, so they won't cause a re-render unless the selected fields change.
  useSelector: (): ValidationSelector => useDelayedSelector((state) => state),
  useFieldSelector: (): ValidationFieldSelector => useDelayedSelector((state) => state.state.fields),

  useSetShowAllErrors: () => useSelector((state) => state.setShowAllErrors),
  useValidating: () => useSelector((state) => state.validating),
  useUpdateTaskValidations: () => useLaxSelector((state) => state.updateTaskValidations),

  useRef: () => useSelectorAsRef((state) => state),
  useLaxRef: () => useLaxSelectorAsRef((state) => state),
};

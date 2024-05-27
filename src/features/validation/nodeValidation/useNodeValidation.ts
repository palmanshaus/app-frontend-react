import { useMemo } from 'react';

import { useAttachmentsSelector } from 'src/features/attachments/hooks';
import { FD } from 'src/features/formData/FormDataWrite';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { Validation } from 'src/features/validation/validationContext';
import { implementsValidateComponent, implementsValidateEmptyField } from 'src/layout';
import { useNodeItem } from 'src/utils/layout/useNodeItem';
import type { ComponentValidation, ValidationDataSources } from 'src/features/validation';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

/**
 * Runs validations defined in the component classes. This runs from the node generator, and will collect all
 * validations for a node and return them.
 */
export function useNodeValidation(node: LayoutNode, shouldValidate: boolean): ComponentValidation[] {
  const selector = Validation.useFieldSelector();
  const validationDataSources = useValidationDataSources();
  const item = useNodeItem(node);

  return useMemo(() => {
    const validations: ComponentValidation[] = [];
    if (!item || !shouldValidate) {
      return validations;
    }

    if (implementsValidateEmptyField(node.def)) {
      validations.push(...node.def.runEmptyFieldValidation(node as any, item as any, validationDataSources));
    }

    if (implementsValidateComponent(node.def)) {
      validations.push(...node.def.runComponentValidation(node as any, item as any, validationDataSources));
    }

    if (item.dataModelBindings) {
      for (const [bindingKey, field] of Object.entries(item.dataModelBindings)) {
        const fieldValidations = selector((fields) => fields[field], [field]);
        if (fieldValidations) {
          validations.push(...fieldValidations.map((v) => ({ ...v, node, bindingKey })));
        }
      }
    }

    return validations;
  }, [item, node, selector, shouldValidate, validationDataSources]);
}

/**
 * Hook providing validation data sources
 */
function useValidationDataSources(): ValidationDataSources {
  const formDataSelector = FD.useDebouncedSelector();
  const invalidDataSelector = FD.useInvalidDebouncedSelector();
  const attachmentsSelector = useAttachmentsSelector();
  const currentLanguage = useCurrentLanguage();

  return useMemo(
    () => ({
      formDataSelector,
      invalidDataSelector,
      attachmentsSelector,
      currentLanguage,
    }),
    [attachmentsSelector, currentLanguage, formDataSelector, invalidDataSelector],
  );
}

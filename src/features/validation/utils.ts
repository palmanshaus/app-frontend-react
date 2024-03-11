import { ValidationMask } from 'src/features/validation';
import { implementsValidationFilter } from 'src/layout';
import type { IAttachments, UploadedAttachment } from 'src/features/attachments';
import type {
  BaseValidation,
  ComponentValidation,
  FieldValidation,
  FieldValidations,
  NodeValidation,
  ValidationContext,
  ValidationMaskKeys,
  ValidationSeverity,
  ValidationState,
} from 'src/features/validation';
import type { ValidationSelector } from 'src/features/validation/validationContext';
import type { ValidationFilterFunction } from 'src/layout';
import type { CompInternal } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';
import type { LayoutPage } from 'src/utils/layout/LayoutPage';

export function mergeFieldValidations(...X: FieldValidations[]): FieldValidations {
  if (X.length === 0) {
    return {};
  }

  if (X.length === 1) {
    return X[0];
  }

  const [X1, ...XRest] = X;
  const out = structuredClone(X1);
  for (const Xn of XRest) {
    for (const [field, validations] of Object.entries(structuredClone(Xn))) {
      if (!out[field]) {
        out[field] = [];
      }
      out[field].push(...validations);
    }
  }
  return out;
}

function isOfSeverity<V extends BaseValidation, S extends ValidationSeverity>(severity: S) {
  return (validation: V): validation is V & { severity: S } => validation.severity === severity;
}
export function validationsOfSeverity<I extends BaseValidation, S extends ValidationSeverity>(
  validations: I[] | undefined,
  severity: S,
) {
  return validations?.filter(isOfSeverity(severity)) ?? [];
}

export function hasValidationErrors<V extends BaseValidation>(validations: V[] | undefined): boolean {
  return validations?.some((validation: any) => validation.severity === 'error') ?? false;
}

function __default_filter__() {
  return true;
}
export function validationNodeFilter(node: LayoutNode): ValidationFilterFunction {
  if (implementsValidationFilter(node.def)) {
    return node.def.getValidationFilter(node as any) ?? __default_filter__;
  }
  return __default_filter__;
}

/**
 * Converts a field or component validation to a node validation
 * NodeValidation contains additional information useful for navigating using the error report
 */
export function buildNodeValidation<Severity extends ValidationSeverity = ValidationSeverity>(
  node: LayoutNode,
  validation: FieldValidation<Severity> | ComponentValidation<Severity>,
  bindingKey?: string,
): NodeValidation<Severity> {
  return {
    ...validation,
    bindingKey,
    componentId: node.getId(),
    pageKey: node.pageKey(),
  };
}

/**
 * This can be used in a filter to remove hidden nodes from consideration when checking for validation errors
 */
export function shouldValidateNode(node: LayoutNode): boolean {
  return !node.isHidden({ respectTracks: true }) && !('renderAsSummary' in node.item && node.item.renderAsSummary);
}

function isValidationVisible<T extends BaseValidation>(validation: T, mask: number): boolean {
  if (validation.category === 0) {
    return true;
  }
  return (mask & validation.category) > 0;
}

export function selectValidations<T extends BaseValidation>(
  validations: T[],
  mask: number,
  severity?: ValidationSeverity,
) {
  const filteredValidations = severity ? validationsOfSeverity(validations, severity) : validations;
  return filteredValidations.filter((validation) => isValidationVisible(validation, mask));
}

/*
 * Gets all validations for a node in a single list, optionally filtered by severity
 * Looks at data model bindings to get field validations
 */
export function getValidationsForNode(
  node: LayoutNode,
  findIn: ValidationSelector | ValidationState,
  mask: number,
): NodeValidation[];
export function getValidationsForNode<Severity extends ValidationSeverity>(
  node: LayoutNode,
  findIn: ValidationSelector | ValidationState,
  mask: number,
  severity: Severity,
): NodeValidation<Severity>[];
export function getValidationsForNode(
  node: LayoutNode,
  findIn: ValidationSelector | ValidationState,
  mask: number,
  severity?: ValidationSeverity,
): NodeValidation[] {
  const validationMessages: NodeValidation[] = [];
  if (!shouldValidateNode(node)) {
    return validationMessages;
  }

  const selector: ValidationSelector = (cacheKey, selector) => {
    if (typeof findIn === 'function') {
      return findIn(cacheKey, selector);
    }
    return selector({ state: findIn } as ValidationContext);
  };

  if (node.item.dataModelBindings) {
    for (const [bindingKey, field] of Object.entries(node.item.dataModelBindings)) {
      const fieldValidations = selector(`field-${field}`, (state) => state.state.fields[field]);
      if (fieldValidations) {
        const validations = selectValidations(fieldValidations, mask, severity);
        validationMessages.push(
          ...validations
            .filter(validationNodeFilter(node))
            .map((validation) => buildNodeValidation(node, validation, bindingKey)),
        );
      }

      const cacheKey = ['binding', node.getId(), bindingKey].join('-');
      const bindingValidations = selector(
        cacheKey,
        (state) => state.state.components[node.getId()]?.bindingKeys?.[bindingKey],
      );
      if (bindingValidations) {
        const validations = selectValidations(bindingValidations, mask, severity);
        validationMessages.push(
          ...validations
            .filter(validationNodeFilter(node))
            .map((validation) => buildNodeValidation(node, validation, bindingKey)),
        );
      }
    }
  }

  const componentValidations = selector(node.getId(), (state) => state.state.components[node.getId()]?.component);
  if (componentValidations) {
    const validations = selectValidations(componentValidations, mask, severity);
    validationMessages.push(
      ...validations.filter(validationNodeFilter(node)).map((validation) => buildNodeValidation(node, validation)),
    );
  }
  return validationMessages;
}

/**
 * Gets the initial validation mask for a component using its showValidations property
 * If the value is not set, it will default to all validations except required
 */
export function getInitialMaskFromNode(node: LayoutNode | LayoutPage): number {
  // If not set, null, or undefined, default to all validations except required
  if (!('showValidations' in node.item) || node.item.showValidations == null) {
    return ValidationMask.AllExceptRequired;
  }
  return getVisibilityMask(node.item.showValidations);
}

export function getVisibilityMask(maskKeys?: ValidationMaskKeys[]): number {
  let mask = 0;
  if (!maskKeys) {
    return mask;
  }
  for (const maskKey of maskKeys) {
    mask |= ValidationMask[maskKey];
  }
  return mask;
}

export function attachmentsValid(
  attachments: IAttachments,
  component: CompInternal<'FileUpload' | 'FileUploadWithTag'>,
): boolean {
  if (component.minNumberOfAttachments === 0) {
    return true;
  }

  const attachmentsForComponent = attachments[component.id];
  if (!attachmentsForComponent) {
    return false;
  }

  return attachmentsForComponent.length >= component.minNumberOfAttachments;
}

export function attachmentIsMissingTag(attachment: UploadedAttachment): boolean {
  return attachment.data.tags === undefined || attachment.data.tags.length === 0;
}

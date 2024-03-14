import React, { forwardRef } from 'react';
import type { JSX } from 'react';

import { SummaryItemSimple } from 'src/layout/Summary/SummaryItemSimple';
import { TextAreaDef } from 'src/layout/TextArea/config.def.generated';
import { TextAreaComponent } from 'src/layout/TextArea/TextAreaComponent';
import type { LayoutValidationCtx } from 'src/features/devtools/layoutValidation/types';
import type { DisplayDataProps } from 'src/features/displayData';
import type { PropsFromGenericComponent } from 'src/layout';
import type { CompInternal } from 'src/layout/layout';
import type { ExprResolver, SummaryRendererProps } from 'src/layout/LayoutComponent';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export class TextArea extends TextAreaDef {
  render = forwardRef<HTMLElement, PropsFromGenericComponent<'TextArea'>>(
    function LayoutComponentTextAreaRender(props, _): JSX.Element | null {
      return <TextAreaComponent {...props} />;
    },
  );

  evalExpressions({ item, evalTrb, evalCommon }: ExprResolver<'TextArea'>): CompInternal<'TextArea'> {
    return {
      ...item,
      ...evalCommon(item),
      ...evalTrb(item),
    };
  }

  getDisplayData(node: LayoutNode<'TextArea'>, { formDataSelector }: DisplayDataProps): string {
    if (!node.item.dataModelBindings?.simpleBinding) {
      return '';
    }

    return node.getFormData(formDataSelector).simpleBinding ?? '';
  }

  renderSummary({ targetNode }: SummaryRendererProps<'TextArea'>): JSX.Element | null {
    const displayData = this.useDisplayData(targetNode);
    return <SummaryItemSimple formDataAsString={displayData} />;
  }

  validateDataModelBindings(ctx: LayoutValidationCtx<'TextArea'>): string[] {
    return this.validateDataModelBindingsSimple(ctx);
  }
}

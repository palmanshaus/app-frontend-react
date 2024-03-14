import React, { forwardRef } from 'react';
import type { JSX } from 'react';

import { AccordionGroup as AccordionGroupComponent } from 'src/layout/AccordionGroup/AccordionGroup';
import { AccordionGroupDef } from 'src/layout/AccordionGroup/config.def.generated';
import { AccordionGroupHierarchyGenerator } from 'src/layout/AccordionGroup/hierarchy';
import { SummaryAccordionGroupComponent } from 'src/layout/AccordionGroup/SummaryAccordionGroupComponent';
import type { PropsFromGenericComponent } from 'src/layout';
import type { CompExternal } from 'src/layout/layout';
import type { SummaryRendererProps } from 'src/layout/LayoutComponent';
import type { ComponentHierarchyGenerator } from 'src/utils/layout/HierarchyGenerator';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

export class AccordionGroup extends AccordionGroupDef {
  private _hierarchyGenerator = new AccordionGroupHierarchyGenerator();

  render = forwardRef<HTMLElement, PropsFromGenericComponent<'AccordionGroup'>>(
    function LayoutComponentAccordionGroupRender(props, _): JSX.Element | null {
      return <AccordionGroupComponent {...props} />;
    },
  );

  claimChildren(_item: CompExternal<'AccordionGroup'>, _claimChild: (id: string) => void) {
    // for (const childId of item.children) {
    //   if (!this.canRenderInAccordionGroup(generator, childId)) {
    //     continue;
    //   }
    //   claimChild(childId);
    // }
  }

  hierarchyGenerator(): ComponentHierarchyGenerator<'AccordionGroup'> {
    return this._hierarchyGenerator;
  }

  renderSummary(props: SummaryRendererProps<'AccordionGroup'>): JSX.Element | null {
    return <SummaryAccordionGroupComponent {...props} />;
  }

  renderSummaryBoilerplate(): boolean {
    return false;
  }

  shouldRenderInAutomaticPDF(node: LayoutNode<'AccordionGroup'>): boolean {
    return !node.item.renderAsSummary;
  }

  getDisplayData(): string {
    return '';
  }

  validateDataModelBindings(): string[] {
    return [];
  }
}

import { CG } from 'src/codegen/CG';
import { LabelRendering } from 'src/codegen/Config';
import { AlertOnChangePlugin } from 'src/features/alertOnChange/AlertOnChangePlugin';
import { OptionsPlugin } from 'src/features/options/OptionsPlugin';
import { CompCategory } from 'src/layout/common';

export const RADIO_SUMMARY_OVERRIDE_PROPS = new CG.obj()
  .extends(CG.common('ISummaryOverridesCommon'))
  .optional()
  .setTitle('Summary properties')
  .setDescription('Properties for how to display the summary of the component')
  .exportAs('RadioSummaryOverrideProps');

export const Config = new CG.component({
  category: CompCategory.Form,
  rendersWithLabel: LabelRendering.InSelf,
  capabilities: {
    renderInTable: true,
    renderInButtonGroup: false,
    renderInAccordion: false,
    renderInAccordionGroup: false,
    renderInTabs: true,
    renderInCards: true,
    renderInCardsMedia: false,
  },
  functionality: {
    customExpressions: false,
  },
})
  .addDataModelBinding(CG.common('IDataModelBindingsOptionsSimple'))
  .addProperty(new CG.prop('layout', CG.common('LayoutStyle').optional()))
  .addPlugin(new OptionsPlugin({ supportsPreselection: true, type: 'single' }))
  .addPlugin(
    new AlertOnChangePlugin({
      propName: 'alertOnChange',
      title: 'Alert on change',
      description: 'Boolean value indicating if the component should alert on change',
    }),
  )
  .addProperty(
    new CG.prop(
      'showAsCard',
      new CG.bool()
        .optional()
        .setTitle('Show as card')
        .setDescription('Boolean value indicating if the options should be displayed as cards. Defaults to false.'),
    ),
  );

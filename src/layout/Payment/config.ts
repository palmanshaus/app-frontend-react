import { CG } from 'src/codegen/CG';
import { CompCategory } from 'src/layout/common';

export const Config = new CG.component({
  category: CompCategory.Presentation,
  rendersWithLabel: false,
  capabilities: {
    renderInTable: false,
    renderInButtonGroup: false,
    renderInAccordion: false,
    renderInAccordionGroup: false,
  },
})

  .addTextResource(
    new CG.trb({
      name: 'title',
      title: 'Title',
      description: 'The title of the paragraph',
    }),
  )
  .addTextResource(
    new CG.trb({
      name: 'description',
      title: 'Description',
      description: 'Description, optionally shown below the title',
    }),
  );
Config.inner.extends(CG.common('SummarizableComponentProps'));

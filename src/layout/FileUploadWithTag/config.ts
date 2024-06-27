import { CG } from 'src/codegen/CG';
import { LabelRendering } from 'src/codegen/Config';
import { OptionsPlugin } from 'src/features/options/OptionsPlugin';
import { CompCategory } from 'src/layout/common';
import { asUploaderComponent } from 'src/layout/FileUpload/config';

export const Config = asUploaderComponent(
  new CG.component({
    category: CompCategory.Form,
    rendersWithLabel: LabelRendering.FromGenericComponent,
    capabilities: {
      renderInTable: false,
      renderInButtonGroup: false,
      renderInAccordion: false,
      renderInAccordionGroup: false,
      renderInCards: false,
      renderInCardsMedia: false,
      renderInTabs: true,
    },
    functionality: {
      customExpressions: false,
    },
  }),
)
  .addTextResource(
    new CG.trb({
      name: 'tagTitle',
      title: 'Tag title',
      description: 'The title to show when selecting a tag for each uploaded file',
    }),
  )
  .addPlugin(new OptionsPlugin({ supportsPreselection: false, type: 'single' }));

import type { ExprResolved } from 'src/features/expressions/types';
import type { CompExternal } from 'src/layout/layout';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type Comp = CompExternal<'RepeatingGroup'>;
type RepGroupTrb = Exclude<Comp['textResourceBindings'], undefined>;
type RepGroupEdit = Exclude<Comp['edit'], undefined>;

// These types define the properties in a repeating group config that will have their expressions resolved
// per row instead of for the entire repeating group component at once.
type PerRowProps = 'hiddenRow';
type PerRowTrb = 'save_and_next_button' | 'save_button' | 'edit_button_close' | 'edit_button_open';
type PerRowEdit = 'deleteButton' | 'saveButton' | 'editButton' | 'alertOnDelete' | 'saveAndNextButton';
export type HGroupExpressions = ExprResolved<
  Pick<Comp, PerRowProps> & {
    textResourceBindings?: Pick<RepGroupTrb, PerRowTrb>;
    edit?: Pick<RepGroupEdit, PerRowEdit>;
  }
>;

// This then, by its definition, is the opposite of the above types. It's the properties that are resolved for the
// entire repeating group component at once, including the 'rows' property.
export type RepGroupInternal = ExprResolved<
  Omit<Comp, PerRowProps | 'textResourceBindings' | 'edit'> & {
    textResourceBindings?: Omit<RepGroupTrb, PerRowTrb>;
    edit?: Omit<RepGroupEdit, PerRowEdit>;
    rows: HRepGroupRows;
  }
>;

export interface HRepGroupRow {
  uuid: string;
  index: number;
  items: LayoutNode[];
  groupExpressions?: HGroupExpressions;
}

export type HRepGroupRows = HRepGroupRow[];

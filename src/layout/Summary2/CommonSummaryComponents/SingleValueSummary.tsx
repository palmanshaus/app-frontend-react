import React from 'react';

import { ErrorMessage, Label, Paragraph } from '@digdir/designsystemet-react';
import cn from 'classnames';

import { Lang } from 'src/features/language/Lang';
import { EditButton } from 'src/layout/Summary2/CommonSummaryComponents/EditButton';
import classes from 'src/layout/Summary2/CommonSummaryComponents/SingleValueSummary.module.css';
import type { BaseValidation } from 'src/features/validation';
import type { LayoutNode } from 'src/utils/layout/LayoutNode';

type SingleValueSummaryProps = {
  title: React.ReactNode;
  errors: BaseValidation[];
  componentNode: LayoutNode;
  displayData?: string;
  hideEditButton?: boolean;
};

export const SingleValueSummary = ({
  title,
  errors,
  componentNode,
  displayData,
  hideEditButton,
}: SingleValueSummaryProps) => (
  <div className={classes.inputSummaryItem}>
    <div className={classes.labelValueWrapper}>
      <Label weight={'regular'}>{title}</Label>
      <Paragraph
        asChild
        className={cn({
          [classes.error]: errors.length > 0,
          [classes.emptyValue]: !displayData,
          [classes.formValue]: displayData,
        })}
      >
        <span>
          {!displayData && <Lang id={'general.empty_summary'} />}
          {displayData}
        </span>
      </Paragraph>
    </div>
    {!hideEditButton && (
      <EditButton
        className={classes.editButton}
        componentNode={componentNode}
        summaryComponentId={componentNode.item.id}
      />
    )}

    {errors.length > 0 &&
      errors.map(({ message }) => (
        <ErrorMessage key={message.key}>
          <Lang
            id={message.key}
            params={message.params}
            node={componentNode}
          ></Lang>
        </ErrorMessage>
      ))}
  </div>
);

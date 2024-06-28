import React from 'react';

import { formatNumericText } from '@digdir/design-system-react';
import cn from 'classnames';

import { Lang } from 'src/features/language/Lang';
import { useCurrentLanguage } from 'src/features/language/LanguageProvider';
import { getMapToReactNumberConfig } from 'src/hooks/useMapToReactNumberConfig';
import classes from 'src/layout/Number/NumberComponent.module.css';
import type { PropsFromGenericComponent } from 'src/layout';

export const NumberComponent = ({ node }: PropsFromGenericComponent<'Number'>) => {
  const { textResourceBindings, value, icon, direction } = node.item;
  const currentLanguage = useCurrentLanguage();

  const getDisplaydata = (text) => {
    const numberFormatting = getMapToReactNumberConfig(node.item.formatting, text, currentLanguage);
    if (numberFormatting?.number) {
      return formatNumericText(text.toString(), numberFormatting.number);
    }
    return text;
  };

  if (icon) {
    const imgType = icon.split('.').at(-1);

    if (!imgType) {
      throw new Error('Image source is missing file type. Are you sure the image source is correct?');
    }
    if (!['svg', 'png', 'jpg', 'jpeg', 'gif', 'bmp', 'tiff'].includes(imgType.toLowerCase())) {
      throw new Error('Only images of the types: .svg, .png, .jpg, .jpeg, .gif, .bmp, .tiff, are supported');
    }
  }

  if (!textResourceBindings?.title) {
    return <span>{getDisplaydata(value)}</span>;
  }

  return (
    <dl className={cn(classes.descriptionList, direction === 'vertical' ? classes.vertical : classes.horizontal)}>
      <dt>
        {!!icon && (
          <img
            src={icon}
            className={classes.icon}
            alt={textResourceBindings.title}
          />
        )}
        <Lang id={textResourceBindings.title} />
      </dt>
      <dd>{getDisplaydata(value)}</dd>
    </dl>
  );
};

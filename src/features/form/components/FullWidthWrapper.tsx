import React from 'react';
import type { HTMLProps } from 'react';

import cn from 'classnames';

import classes from 'src/features/form/components/FullWidthWrapper.module.css';

export interface IFullWidthWrapperProps extends HTMLProps<HTMLDivElement> {
  children?: React.ReactNode;
  isOnBottom?: boolean;
  className?: string;
}

export const FullWidthWrapper = ({
  children,
  isOnBottom = false,
  className,
  ...containerProps
}: IFullWidthWrapperProps) => (
  <div
    {...containerProps}
    className={cn(classes.fullWidth, { [classes.consumeBottomPadding]: isOnBottom }, className)}
    data-testid='fullWidthWrapper'
  >
    {children}
  </div>
);

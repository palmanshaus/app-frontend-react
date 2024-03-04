import React, { useMemo } from 'react';
import type { ReactNode } from 'react';

import { SelectOptionItem } from 'src/components/form/SelectOptionItem';
import { useLanguage } from 'src/features/language/useLanguage';
import type { IOptionInternal } from 'src/features/options/castOptionsToStrings';

type SingleSelectOption = {
  keywords?: string[];
  label: string;
  value: string;
  formattedLabel?: ReactNode;
};

type MultiSelectOption = SingleSelectOption & {
  deleteButtonLabel?: string;
};

export function useFormattedOptions(
  options: IOptionInternal[] | undefined,
  includeDeleteLabel?: false,
): SingleSelectOption[];
export function useFormattedOptions(
  options: IOptionInternal[] | undefined,
  includeDeleteLabel: true,
): MultiSelectOption[];
export function useFormattedOptions(options: IOptionInternal[] | undefined, includeDeleteLabel?: boolean) {
  const { langAsString } = useLanguage();
  const listHasDescription = options?.some((option) => option.description) || false;
  return useMemo(
    () =>
      options?.map((option) => {
        const label = langAsString(option.label ?? option.value);

        const formattedOption = {
          label,
          formattedLabel: (
            <SelectOptionItem
              option={option}
              listHasDescription={listHasDescription}
            />
          ),
          value: option.value,
        } as any;

        if (includeDeleteLabel) {
          formattedOption.deleteButtonLabel = `${langAsString('general.delete')} ${label}`;
        }

        return formattedOption;
      }) ?? [],
    [options, listHasDescription, includeDeleteLabel, langAsString],
  );
}

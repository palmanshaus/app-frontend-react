import type { layoutExpressionFunctions } from 'src/features/form/layout/expressions/functions';

export type LayoutExpressionFunction = keyof typeof layoutExpressionFunctions;

export interface ILayoutExpressionAlias {
  [key: string]: RegExp;
}

export type ILayoutExpressionAliases = {
  [key in LayoutExpressionFunction]: ILayoutExpressionAlias[];
};

export interface ILayoutExpressionDataModelArg {
  dataModel: string;
}

export interface ILayoutExpressionInstanceContextArg {
  instanceContext: string;
}

export interface ILayoutExpressionApplicationSettingsArg {
  applicationSettings: string;
}

export interface ILayoutExpressionComponentArg {
  component: string;
}

export type ILayoutExpressionArg =
  | string
  | boolean
  | number
  | undefined
  | null
  | ILayoutExpressionDataModelArg
  | ILayoutExpressionComponentArg
  | ILayoutExpressionInstanceContextArg
  | ILayoutExpressionApplicationSettingsArg;

export interface ILayoutExpressionDSL {
  expr: string;
}

export interface ILayoutExpressionStructured {
  function: keyof typeof layoutExpressionFunctions;
  args: [ILayoutExpressionArg, ILayoutExpressionArg];
}

export type ILayoutExpression =
  | ILayoutExpressionDSL
  | ILayoutExpressionStructured;

export interface ILayoutExpressionRunnerLookups {
  dataModel: (path: string) => string;
  component: (baseComponentId: string) => string;
  instanceContext: (prop: string) => string;
  applicationSettings: (prop: string) => string;
}

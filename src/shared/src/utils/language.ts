import * as DOMPurify from 'dompurify';
import ReactHtmlParser, { convertNodeToElement } from 'react-html-parser';
import * as React from 'react';
import { ITextResource, IDataSources } from '../types';

const marked = require('marked');

DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName === 'A') {
    node.setAttribute('rel', 'noopener noreferrer');
    node.setAttribute('target', '_blank');
  }
});

export function getLanguageFromKey(key: string, language: any) {
  if (!key) {
    return key;
  }
  const name = getNestedObject(language, key.split('.'));
  if (!name) {
    return key;
  }
  return name;
}

export function getNestedObject(nestedObj: any, pathArr: string[]) {
  return pathArr.reduce((obj, key) => ((obj && obj[key] !== 'undefined') ? obj[key] : undefined), nestedObj);
}

// Example: {getParsedLanguageFromKey('marked.markdown', language, ['hei', 'sann'])}
export const getParsedLanguageFromKey = (key: string, language: any, params?: any[], stringOutput?: boolean) => {
  const name = getLanguageFromKey(key, language);
  const paramParsed = params ? replaceParameters(name, params) : name;

  if (stringOutput) {
    return paramParsed;
  }
  return getParsedLanguageFromText(paramParsed);
};

export const getParsedLanguageFromText = (text: string, allowedTags?: string[], allowedAttr?: string[]) => {
  const dirty = marked(text);
  const options: DOMPurify.Config = {};
  if (allowedTags) {
    options.ALLOWED_TAGS = allowedTags;
  }

  if (allowedAttr) {
    options.ALLOWED_ATTR = allowedAttr;
  }
  const clean = DOMPurify.sanitize(dirty, options);
  const parsedText = ReactHtmlParser(clean.toString(), { transform: removeStyling });
  return parsedText;
};

// eslint-disable-next-line consistent-return
const removeStyling = (node: any): React.ReactElement | void | null => {
  // all this does is remove the default styling of the <p> element, which is causing styling issues
  if (node.name === 'p') {
    return React.createElement(
      'p',
      { style: { marginBottom: '0px', display: 'inline' } },
      node.children?.map((child: any, index: number) => convertNodeToElement(child, index, removeStyling)),
    );
  }
};

const replaceParameters = (nameString: any, params: any[]) => {
  let index = 0;
  // eslint-disable-next-line no-restricted-syntax
  for (const param of params) {
    // eslint-disable-next-line no-param-reassign
    nameString = nameString.replace(`{${index}}`, param);
    index += 1;
  }
  return nameString;
};

export function getTextResourceByKey(key: string, textResources: ITextResource[]) {
  if (!textResources) {
    return key;
  }
  const textResource = textResources.find((resource: ITextResource) => resource.id === key);
  return textResource ? textResource.value : key;
}

export function replaceTextResourceParams(
  textResources: ITextResource[],
  dataSources: IDataSources,
  repeatingGroups?: any,
): ITextResource[] {
  let replaceValues: string[];
  const resourcesWithVariables = textResources?.filter((resource) => resource.variables);
  resourcesWithVariables?.forEach((resource) => {
    const variableForRepeatingGroup = resource.variables.find((variable) => variable.key.indexOf('[{0}]') > -1);
    if (repeatingGroups && variableForRepeatingGroup) {
      const repeatingGroupId = Object.keys(repeatingGroups).find((groupId) => {
        const id = variableForRepeatingGroup.key.split('[{0}]')[0];
        return repeatingGroups[groupId].dataModelBinding === id;
      });
      const repeatingGroupCount = repeatingGroups[repeatingGroupId]?.count;

      for (let i = 0; i <= repeatingGroupCount; ++i) {
        replaceValues = [];
        // eslint-disable-next-line no-loop-func
        resource.variables.forEach((variable) => {
          if (variable.dataSource.startsWith('dataModel')) {
            if (variable.key.indexOf('[{0}]') > -1) {
              const keyWithIndex = variable.key.replace('{0}', `${i}`);
              replaceValues.push(dataSources.dataModel[keyWithIndex] || variable.key);
            } else {
              replaceValues.push(dataSources.dataModel[variable.key] || variable.key);
            }
          }
        });
        const newValue = replaceParameters(resource.unparsedValue, replaceValues);

        if (resource.repeating && resource.id.endsWith(`-${i}`)) {
          // eslint-disable-next-line no-param-reassign
          resource.value = newValue;
        } else if (!resource.repeating && textResources.findIndex((r) => r.id === `${resource.id}-${i}`) === -1) {
          const newId = `${resource.id}-${i}`;
          textResources.push({
            ...resource,
            id: newId,
            value: newValue,
            repeating: true,
          });
        }
      }
    } else {
      replaceValues = [];
      resource.variables.forEach((variable) => {
        if (variable.dataSource.startsWith('dataModel')) {
          replaceValues.push(dataSources.dataModel[variable.key] || variable.key);
        }
      });

      const newValue = replaceParameters(resource.unparsedValue, replaceValues);
      if (resource.value !== newValue) {
        // eslint-disable-next-line no-param-reassign
        resource.value = newValue;
      }
    }
  });
  return textResources;
}

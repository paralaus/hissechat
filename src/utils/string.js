import {result} from 'lodash';

export function trim(s, c) {
  if (!s) return '';
  if (c === ']') c = '\\]';
  if (c === '^') c = '\\^';
  if (c === '\\') c = '\\\\';
  return s.replace(new RegExp('^[' + c + ']+|[' + c + ']+$', 'g'), '');
}

export const getErrorMessage = (error, defaultMessage = '') => {
  return result(error, 'response.data.message', defaultMessage);
};

export function unescapeHtml(htmlStr) {
  if (!htmlStr) return '';
  htmlStr = htmlStr.replace(/&lt;/g, '<');
  htmlStr = htmlStr.replace(/&gt;/g, '>');
  htmlStr = htmlStr.replace(/&quot;/g, '"');
  htmlStr = htmlStr.replace(/&#39;/g, "'");
  htmlStr = htmlStr.replace(/&amp;/g, '&');
  return htmlStr;
}

export const isValue = value =>
  typeof value === 'number' || typeof value === 'string';

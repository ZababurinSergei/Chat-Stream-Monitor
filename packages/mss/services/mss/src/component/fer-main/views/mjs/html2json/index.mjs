import lexer from './lexer.mjs'
import parser from './parser.mjs'
import {format} from './format.mjs'
import {toHTML} from './stringify.mjs'
import {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers
} from './tags.mjs'
import beautify from '../json-beautify/index.mjs'

export const parseDefaults = {
  voidTags,
  closingTags,
  childlessTags,
  closingTagAncestorBreakers,
  includePositions: false
}

export function parse (str, options = parseDefaults) {
  const tokens = lexer(str, options)
  const nodes = parser(tokens, options)
  return format(nodes, options)
}

export function stringify (ast, options = parseDefaults) {
  return toHTML(ast, options)
}

export const json = (obj) => {
  return  beautify(obj, null, 2, 80)
}

export default {
  stringify: stringify,
  parse: parse,
  json: json
}
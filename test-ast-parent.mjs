import { parseFile } from './packages/ast-analyzer/src/core/ast-parser.js';

const parsed = parseFile('./packages/ast-analyzer/src/core/data-sources.ts');
if (!parsed) {
  console.log('parsed === null');
  process.exit(1);
}

console.log('=== parsed.ast есть ===');
console.log('ast.body.length:', parsed.ast.body.length);

let found = false;
const seen = new WeakSet();

function walk(n, depth) {
  if (!n || typeof n !== 'object' || seen.has(n) || depth > 30) return;
  seen.add(n);

  if (n.type === 'ArrowFunctionExpression') {
    console.log('--- ArrowFunctionExpression ---');
    console.log('  line:', n.loc?.start?.line);
    console.log('  has parent prop?', Object.prototype.hasOwnProperty.call(n, 'parent'));
    console.log('  node.parent:', n.parent);
    console.log('  node.parent?.type:', n.parent?.type);
    console.log('  node.parent?.id?.name:', n.parent?.id?.name);
    found = true;
    return;
  }

  for (const k of Object.keys(n)) {
    if (k === 'parent') continue;
    const c = n[k];
    if (Array.isArray(c)) c.forEach(x => walk(x, depth + 1));
    else if (c && typeof c === 'object') walk(c, depth + 1);
  }
}

walk(parsed.ast, 0);
if (!found) console.log('No ArrowFunctionExpression found!');

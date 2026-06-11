// ast-analyzer/src/modes/vue-analyzer.ts

import fs from 'fs';
import path from 'path';
import { parse, compileScript } from '@vue/compiler-sfc';
import { parse as parseTS } from '@typescript-eslint/parser';
import type { Program } from 'estree';
import type { SFCDescriptor, SFCScriptBlock } from '@vue/compiler-sfc';

export interface VueComponentAnalysis {
  // Базовая информация
  componentName: string;
  filePath: string;

  // Из скрипта
  script: {
    content: string;
    ast: Program | null;
    isSetup: boolean;
    isTS: boolean;
    size: number;
  };

  // Из шаблона
  template: {
    content: string | null;
    ast: any | null; // AST шаблона от Vue
    complexity: number; // количество элементов
    rootElements: string[];
    slots: string[];
    directives: string[];
    events: string[];
  };

  // Анализ API компонента
  props: {
    names: string[];
    types: Record<string, string>;
    required: Record<string, boolean>;
    defaults: Record<string, any>;
  };

  emits: {
    names: string[];
    types: Record<string, string>;
  };

  expose: string[];
  slots: string[];

  // Импорты и зависимости
  imports: {
    source: string;
    specifiers: string[];
    isTypeOnly: boolean;
  }[];

  composables: {
    name: string;
    source: string;
    args: string[];
  }[];

  // Статистика
  stats: {
    scriptLines: number;
    templateLines: number;
    styleCount: number;
    totalSize: number;
  };
}

export interface AnalysisOptions {
  includeTemplateAST?: boolean;
  includeScriptAST?: boolean;
  extractComposableCalls?: boolean;
  maxDepth?: number;
}

/**
 * Парсит Vue файл с использованием @vue/compiler-sfc
 */
export function parseVueFile(filePath: string): {
  descriptor: SFCDescriptor;
  errors: Error[];
} | null {
  try {
    const source = fs.readFileSync(filePath, 'utf-8');
    const { descriptor, errors } = parse(source, {
      filename: filePath,
      sourceMap: false,
    });

    if (errors.length > 0) {
      console.warn(`⚠️ Ошибки при парсинге ${filePath}:`, errors);
    }

    return { descriptor, errors };
  } catch (error) {
    console.error(`❌ Ошибка парсинга Vue файла ${filePath}:`, error);
    return null;
  }
}

/**
 * Компилирует script блок в AST
 */
function compileScriptBlock(descriptor: SFCDescriptor, filePath: string): SFCScriptBlock | null {
  try {
    const script = compileScript(descriptor, {
      id: filePath,
      isProd: false,
      babelParserPlugins: ['typescript', 'jsx'],
    });

    return script;
  } catch (error) {
    console.error(`❌ Ошибка компиляции script в ${filePath}:`, error);
    return null;
  }
}

/**
 * Анализирует props из скомпилированного script блока
 */
function analyzeProps(script: any): VueComponentAnalysis['props'] {
  const result: VueComponentAnalysis['props'] = {
    names: [],
    types: {},
    required: {},
    defaults: {},
  };

  if (!script?.props) return result;

  const propsObj = script.props;
  for (const [name, prop] of Object.entries(propsObj)) {
    result.names.push(name);

    const propData = prop as any;

    if (propData?.type) {
      if (typeof propData.type === 'string') {
        result.types[name] = propData.type;
      } else if (propData.type?.name) {
        result.types[name] = propData.type.name;
      } else {
        result.types[name] = 'unknown';
      }
    }

    result.required[name] = propData?.required === true;

    if (propData?.default !== undefined) {
      result.defaults[name] = propData.default;
    }
  }

  return result;
}

/**
 * Анализирует emits из скомпилированного script блока
 */
function analyzeEmits(script: any): VueComponentAnalysis['emits'] {
  const result: VueComponentAnalysis['emits'] = {
    names: [],
    types: {},
  };

  if (!script?.emits) return result;

  const emitsObj = script.emits;
  for (const [name, emit] of Object.entries(emitsObj)) {
    result.names.push(name);

    const emitData = emit as any;
    if (emitData && typeof emitData === 'object' && emitData?.type) {
      result.types[name] = emitData.type.name || 'unknown';
    }
  }

  return result;
}

/**
 * Анализирует template и извлекает информацию
 */
function analyzeTemplate(
  descriptor: SFCDescriptor,
  options: AnalysisOptions
): VueComponentAnalysis['template'] {
  const result: VueComponentAnalysis['template'] = {
    content: null,
    ast: null,
    complexity: 0,
    rootElements: [],
    slots: [],
    directives: [],
    events: [],
  };

  if (!descriptor.template) return result;

  result.content = descriptor.template.content;

  if (options.includeTemplateAST && descriptor.template.ast) {
    result.ast = descriptor.template.ast;

    // Анализируем структуру
    const analyzeNode = (node: any) => {
      if (!node) return;

      result.complexity++;

      // Корневые элементы
      if (node.type === 1) {
        // NodeTypes.ELEMENT
        if (node.tag) {
          result.rootElements.push(node.tag);
        }

        // Поиск слотов
        if (node.tag === 'slot' && node.props) {
          const nameProp = node.props.find((p: any) => p.name === 'name');
          if (nameProp && nameProp.value) {
            result.slots.push(nameProp.value.content);
          } else {
            result.slots.push('default');
          }
        }

        // Поиск директив
        if (node.props) {
          for (const prop of node.props) {
            if (prop.name?.startsWith('v-')) {
              result.directives.push(prop.name);
            }
            if (prop.name?.startsWith('@')) {
              result.events.push(prop.name.slice(1));
            }
          }
        }
      }

      // Рекурсивный обход детей
      if (node.children) {
        node.children.forEach(analyzeNode);
      }
    };

    analyzeNode(descriptor.template.ast);

    // Убираем дубликаты
    result.rootElements = [...new Set(result.rootElements)];
    result.slots = [...new Set(result.slots)];
    result.directives = [...new Set(result.directives)];
    result.events = [...new Set(result.events)];
  }

  return result;
}

/**
 * Находит все импорты в коде
 */
function extractImports(content: string): VueComponentAnalysis['imports'] {
  const imports: VueComponentAnalysis['imports'] = [];

  // Простой парсинг импортов (можно улучшить через AST)
  const importRegex =
    /import\s+(?:type\s+)?(?:\{([^}]+)\}|\*\s+as\s+(\w+)|(\w+))\s+from\s+['"]([^'"]+)['"]/g;
  let match;

  while ((match = importRegex.exec(content)) !== null) {
    const specifiers: string[] = [];

    if (match[1]) {
      // Named imports: import { a, b } from 'x'
      const names = match[1].split(',').map(s => s.trim());
      specifiers.push(...names);
    } else if (match[2]) {
      // Namespace import: import * as X from 'x'
      specifiers.push(`* as ${match[2]}`);
    } else if (match[3]) {
      // Default import: import X from 'x'
      specifiers.push(`default as ${match[3]}`);
    }

    const source = match[4];
    if (source) {
      imports.push({
        source,
        specifiers,
        isTypeOnly: content.includes(`import type {`) && (match[0]?.includes('type') ?? false),
      });
    }
  }

  return imports;
}

/**
 * Находит вызовы composables
 */
function extractComposables(content: string): VueComponentAnalysis['composables'] {
  const composables: VueComponentAnalysis['composables'] = [];

  // Поиск вызовов use*()
  const composableRegex = /(\w+)\s*=\s*(use\w+)\(([^)]*)\)/g;
  let match;

  while ((match = composableRegex.exec(content)) !== null) {
    const source = match[1];
    const name = match[2];
    const argsStr = match[3];

    if (name && source) {
      composables.push({
        name,
        source,
        args: argsStr
          ? argsStr
              .split(',')
              .map(a => a.trim())
              .filter(Boolean)
          : [],
      });
    }
  }

  return composables;
}

/**
 * Главная функция анализа Vue компонента
 */
export function analyzeVueComponent(
  filePath: string,
  options: AnalysisOptions = {}
): VueComponentAnalysis | null {
  if (!filePath.endsWith('.vue')) {
    console.error('❌ Файл не является Vue компонентом');
    return null;
  }

  // 1. Парсим SFC
  const parsed = parseVueFile(filePath);
  if (!parsed) return null;

  const { descriptor } = parsed;

  // 2. Компилируем script
  const compiledScript = compileScriptBlock(descriptor, filePath);

  // 3. Анализируем template
  const templateAnalysis = analyzeTemplate(descriptor, options);

  // 4. Извлекаем скрипт контент
  const scriptContent = compiledScript?.content || '';
  const isSetup = !!descriptor.scriptSetup;
  const isTS = !!(descriptor.scriptSetup?.lang === 'ts' || descriptor.script?.lang === 'ts');

  // 5. Парсим скрипт через TypeScript ESLint парсер (если нужно)
  let scriptAst: Program | null = null;
  if (options.includeScriptAST && scriptContent) {
    try {
      scriptAst = parseTS(scriptContent, {
        ecmaVersion: 2022,
        sourceType: 'module',
        loc: true,
        range: true,
      }) as Program;
    } catch (error) {
      console.warn(`⚠️ Не удалось распарсить скрипт ${filePath}:`, error);
    }
  }

  // 6. Анализируем все компоненты
  const analysis: VueComponentAnalysis = {
    componentName: path.basename(filePath, '.vue'),
    filePath,

    script: {
      content: scriptContent,
      ast: scriptAst,
      isSetup,
      isTS,
      size: scriptContent.length,
    },

    template: templateAnalysis,

    props: analyzeProps(compiledScript),
    emits: analyzeEmits(compiledScript),
    expose: (compiledScript as any)?.expose || [],
    slots: templateAnalysis.slots,

    imports: extractImports(scriptContent),
    composables: extractComposables(scriptContent),

    stats: {
      scriptLines: scriptContent.split('\n').length,
      templateLines: descriptor.template?.content.split('\n').length || 0,
      styleCount: descriptor.styles.length,
      totalSize: fs.statSync(filePath).size,
    },
  };

  return analysis;
}

/**
 * Генерирует Markdown отчет для Vue компонента
 */
export function generateVueComponentReport(analysis: VueComponentAnalysis): string {
  let report = `# 🎯 Анализ Vue компонента: ${analysis.componentName}\n\n`;

  report += `## 📊 Статистика\n`;
  report += `- **Размер файла:** ${(analysis.stats.totalSize / 1024).toFixed(2)} KB\n`;
  report += `- **Скрипт:** ${analysis.stats.scriptLines} строк (${analysis.script.isSetup ? 'setup' : 'options API'})\n`;
  report += `- **Шаблон:** ${analysis.stats.templateLines} строк\n`;
  report += `- **Стили:** ${analysis.stats.styleCount} блоков\n`;
  report += `- **TypeScript:** ${analysis.script.isTS ? '✅' : '❌'}\n\n`;

  if (analysis.props.names.length > 0) {
    report += `## 📥 Props (${analysis.props.names.length})\n\n`;
    report += `| Имя | Тип | Обязательный | По умолчанию |\n`;
    report += `|-----|-----|--------------|--------------|\n`;
    for (const name of analysis.props.names) {
      const type = analysis.props.types[name] || 'any';
      const required = analysis.props.required[name] ? '✅' : '❌';
      const defaultValue =
        analysis.props.defaults[name] !== undefined ? String(analysis.props.defaults[name]) : '-';
      report += `| \`${name}\` | \`${type}\` | ${required} | ${defaultValue} |\n`;
    }
    report += `\n`;
  }

  if (analysis.emits.names.length > 0) {
    report += `## 📤 Events (${analysis.emits.names.length})\n\n`;
    for (const name of analysis.emits.names) {
      const typeInfo = analysis.emits.types[name] ? `: \`${analysis.emits.types[name]}\`` : '';
      report += `- **${name}**${typeInfo}\n`;
    }
    report += `\n`;
  }

  if (analysis.expose.length > 0) {
    report += `## 🔓 Exposed API\n\n`;
    for (const name of analysis.expose) {
      report += `- \`${name}\`\n`;
    }
    report += `\n`;
  }

  if (analysis.slots.length > 0) {
    report += `## 🎭 Slots (${analysis.slots.length})\n\n`;
    for (const slot of analysis.slots) {
      report += `- \`${slot}\`\n`;
    }
    report += `\n`;
  }

  if (analysis.composables.length > 0) {
    report += `## 🧩 Composables (${analysis.composables.length})\n\n`;
    for (const comp of analysis.composables) {
      report += `- \`${comp.name}\` → переменная \`${comp.source}\`\n`;
      if (comp.args.length > 0) {
        report += `  - Аргументы: ${comp.args.join(', ')}\n`;
      }
    }
    report += `\n`;
  }

  if (analysis.imports.length > 0) {
    report += `## 📦 Импорты (${analysis.imports.length})\n\n`;
    const externalImports = analysis.imports.filter(i => !i.source.startsWith('.'));
    const internalImports = analysis.imports.filter(i => i.source.startsWith('.'));

    if (externalImports.length > 0) {
      report += `### Внешние зависимости\n`;
      for (const imp of externalImports) {
        report += `- \`${imp.source}\` → ${imp.specifiers.join(', ')}\n`;
      }
      report += `\n`;
    }

    if (internalImports.length > 0) {
      report += `### Локальные модули\n`;
      for (const imp of internalImports) {
        report += `- \`${imp.source}\` → ${imp.specifiers.join(', ')}\n`;
      }
      report += `\n`;
    }
  }

  if (analysis.template.complexity > 0) {
    report += `## 🏗️ Шаблон\n\n`;
    report += `- **Сложность:** ${analysis.template.complexity} элементов\n`;
    if (analysis.template.rootElements.length > 0) {
      report += `- **Корневые элементы:** ${analysis.template.rootElements.join(', ')}\n`;
    }
    if (analysis.template.directives.length > 0) {
      report += `- **Директивы:** ${analysis.template.directives.join(', ')}\n`;
    }
    if (analysis.template.events.length > 0) {
      report += `- **События:** ${analysis.template.events.join(', ')}\n`;
    }
    report += `\n`;
  }

  report += `---\n`;
  report += `## 💡 Рекомендации по разбиению\n\n`;

  if (analysis.template.complexity > 50) {
    report += `⚠️ **Шаблон слишком большой** (${analysis.template.complexity} элементов). Рекомендуется вынести части в отдельные компоненты.\n\n`;
  }

  if (analysis.props.names.length > 10) {
    report += `⚠️ **Много props** (${analysis.props.names.length}). Возможно, компонент пытается делать слишком много.\n\n`;
  }

  if (analysis.composables.length > 5) {
    report += `⚠️ **Много composables** (${analysis.composables.length}). Рассмотрите группировку связанной логики.\n\n`;
  }

  if (analysis.stats.scriptLines > 300) {
    report += `⚠️ **Скрипт слишком большой** (${analysis.stats.scriptLines} строк). Разбейте на несколько composables.\n\n`;
  }

  return report;
}

/**
 * Интеграция с существующим split-module режимом
 */
export function enhanceWithVueAnalysis(targetFile: string, existingAnalysis: any) {
  if (!targetFile.endsWith('.vue')) {
    return existingAnalysis;
  }

  const vueAnalysis = analyzeVueComponent(targetFile);
  if (!vueAnalysis) {
    return existingAnalysis;
  }

  return {
    ...existingAnalysis,
    vue: vueAnalysis,
    enhancedInfo: {
      isVueComponent: true,
      hasProps: vueAnalysis.props.names.length > 0,
      hasEvents: vueAnalysis.emits.names.length > 0,
      hasSlots: vueAnalysis.slots.length > 0,
      usesComposables: vueAnalysis.composables.length > 0,
      templateComplexity: vueAnalysis.template.complexity,
      scriptSize: vueAnalysis.stats.scriptLines,
    },
  };
}

/**
 * Быстрый анализ Vue компонента для CLI
 */
export async function analyzeVueComponentCli(
  filePath: string,
  options: AnalysisOptions = {}
): Promise<void> {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`🎯 АНАЛИЗ VUE КОМПОНЕНТА`);
  console.log(`${'='.repeat(60)}\n`);

  const analysis = analyzeVueComponent(filePath, options);

  if (!analysis) {
    console.error('❌ Не удалось проанализировать Vue компонент');
    return;
  }

  const report = generateVueComponentReport(analysis);
  console.log(report);

  // Сохраняем отчет
  const outputFile = `${analysis.componentName}-analysis.md`;
  fs.writeFileSync(outputFile, report);
  console.log(`\n✅ Отчет сохранен: ${outputFile}`);

  // Сохраняем JSON для дальнейшей обработки
  const jsonOutput = {
    analysis,
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  };
  const jsonFile = `${analysis.componentName}-analysis.json`;
  fs.writeFileSync(jsonFile, JSON.stringify(jsonOutput, null, 2));
  console.log(`✅ JSON сохранен: ${jsonFile}`);
}

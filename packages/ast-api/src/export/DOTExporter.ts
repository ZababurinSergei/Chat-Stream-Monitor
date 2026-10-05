// src/export/DOTExporter.ts

/**
 * DOT экспортер для визуализации графов
 *
 * @module export/DOTExporter
 * @description Экспортирует графы и пути в формат DOT (Graphviz)
 *
 * @example
 * ```typescript
 * import { DOTExporter } from './DOTExporter.js';
 *
 * const exporter = new DOTExporter(functionMap);
 *
 * // Экспорт путей
 * const dot = exporter.exportPaths(paths);
 *
 * // Экспорт графа вызовов
 * const graphDot = exporter.exportCallGraph(callGraph);
 *
 * // Экспорт с кастомизацией
 * const customDot = exporter.exportPaths(paths, {
 *   rankdir: 'TB',
 *   showFile: true,
 *   showModule: true
 * });
 * ```
 */

import type {
  FunctionId,
  FunctionEntity,
  ModuleId,
  FileId,
  CallGraph,
  ImportGraph,
  PathResult,
  CallType,
  ImportType,
} from '../types/index.js';

// Импортируем классы для тестов
import { CallGraph as CallGraphClass } from '../graph/CallGraph.js';
import { ImportGraph as ImportGraphClass } from '../graph/ImportGraph.js';
import { IdNormalizer } from '../core/IdNormalizer.js';

/**
 * Опции экспорта DOT
 */
export interface DOTExporterOptions {
  /**
   * Направление графа
   * @default 'LR' (Left to Right)
   */
  rankdir?: 'TB' | 'LR' | 'RL' | 'BT';

  /**
   * Форма узлов
   * @default 'box'
   */
  nodeShape?: 'box' | 'ellipse' | 'circle' | 'diamond' | 'hexagon' | 'octagon';

  /**
   * Стиль узлов
   * @default 'filled'
   */
  nodeStyle?: 'filled' | 'solid' | 'dashed' | 'dotted' | 'bold';

  /**
   * Цвет узлов по умолчанию
   * @default 'lightblue'
   */
  defaultNodeColor?: string;

  /**
   * Цвет ребер по умолчанию
   * @default 'black'
   */
  defaultEdgeColor?: string;

  /**
   * Показывать имена функций
   * @default true
   */
  showFunctionName?: boolean;

  /**
   * Показывать ID функций
   * @default false
   */
  showFunctionId?: boolean;

  /**
   * Показывать файлы
   * @default false
   */
  showFile?: boolean;

  /**
   * Показывать модули
   * @default false
   */
  showModule?: boolean;

  /**
   * Показывать строки кода
   * @default false
   */
  showLine?: boolean;

  /**
   * Показывать типы вызовов
   * @default false
   */
  showCallType?: boolean;

  /**
   * Группировать узлы по модулям (subgraph)
   * @default false
   */
  groupByModule?: boolean;

  /**
   * Цвет фона графа
   * @default 'transparent'
   */
  bgColor?: string;

  /**
   * Шрифт
   * @default 'Arial'
   */
  fontName?: string;

  /**
   * Размер шрифта
   * @default '12'
   */
  fontSize?: string;

  /**
   * Максимальная длина имени функции
   * @default 30
   */
  maxNameLength?: number;

  /**
   * Показывать легенду
   * @default false
   */
  showLegend?: boolean;

  /**
   * Сжатие графа
   * @default false
   */
  compress?: boolean;

  /**
   * Цветовая схема для типов вызовов
   */
  callTypeColors?: Record<string, string>;

  /**
   * Показывать только указанные модули
   */
  includeModules?: ModuleId[];

  /**
   * Исключить указанные модули
   */
  excludeModules?: ModuleId[];
}

/**
 * Конфигурация узла
 */
export interface NodeConfig {
  id: string;
  label: string;
  color?: string;
  shape?: string;
  style?: string;
  group?: string;
  tooltip?: string;
  url?: string;
}

/**
 * Конфигурация ребра
 */
export interface EdgeConfig {
  from: string;
  to: string;
  label?: string;
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted' | 'bold';
  arrowhead?: 'normal' | 'inv' | 'dot' | 'diamond' | 'none';
  tooltip?: string;
}

/**
 * Конфигурация подграфа
 */
export interface SubgraphConfig {
  id: string;
  label: string;
  nodes: string[];
  color?: string;
  style?: 'solid' | 'dashed' | 'dotted';
}

/**
 * Результат экспорта
 */
export interface DOTExportResult {
  dot: string;
  stats: {
    nodes: number;
    edges: number;
    subgraphs: number;
    warnings: string[];
  };
}

/**
 * Цветовая схема для типов вызовов по умолчанию
 */
const DEFAULT_CALL_TYPE_COLORS: Record<string, string> = {
  d: 'black', // direct
  a: 'blue', // async
  m: 'green', // method
  c: 'orange', // callback
  di: 'red', // dynamic import
};

/**
 * Цветовая схема для статусов
 */
const STATUS_COLORS = {
  reachable: 'green',
  unreachable: 'red',
  dead: 'gray',
  isolated: 'lightgray',
  entry: 'lightgreen',
  exit: 'lightcoral',
} as const;

export class DOTExporter {
  private functionMap: Map<FunctionId, FunctionEntity>;
  private options: Required<DOTExporterOptions>;
  private warnings: string[] = [];

  constructor(functionMap: Map<FunctionId, FunctionEntity>, options: DOTExporterOptions = {}) {
    this.functionMap = functionMap;
    this.options = this.mergeOptions(options);
  }

  /**
   * Слить опции с дефолтными
   */
  private mergeOptions(options: DOTExporterOptions): Required<DOTExporterOptions> {
    return {
      rankdir: options.rankdir ?? 'LR',
      nodeShape: options.nodeShape ?? 'box',
      nodeStyle: options.nodeStyle ?? 'filled',
      defaultNodeColor: options.defaultNodeColor ?? 'lightblue',
      defaultEdgeColor: options.defaultEdgeColor ?? 'black',
      showFunctionName: options.showFunctionName ?? true,
      showFunctionId: options.showFunctionId ?? false,
      showFile: options.showFile ?? false,
      showModule: options.showModule ?? false,
      showLine: options.showLine ?? false,
      showCallType: options.showCallType ?? false,
      groupByModule: options.groupByModule ?? false,
      bgColor: options.bgColor ?? 'transparent',
      fontName: options.fontName ?? 'Arial',
      fontSize: options.fontSize ?? '12',
      maxNameLength: options.maxNameLength ?? 30,
      showLegend: options.showLegend ?? false,
      compress: options.compress ?? false,
      callTypeColors: options.callTypeColors ?? DEFAULT_CALL_TYPE_COLORS,
      includeModules: options.includeModules ?? [],
      excludeModules: options.excludeModules ?? [],
    };
  }

  /**
   * Экспортировать пути в DOT
   */
  exportPaths(paths: FunctionId[][]): string {
    if (!paths || paths.length === 0) return '';

    this.warnings = [];
    const nodes = new Set<FunctionId>();
    const edges = new Set<string>();

    // Собираем все узлы и ребра из путей
    for (const path of paths) {
      for (const node of path) {
        nodes.add(node);
      }
      for (let i = 0; i < path.length - 1; i++) {
        const from = path[i];
        const to = path[i + 1];
        if (from && to) {
          edges.add(`${this.escapeId(from)} -> ${this.escapeId(to)}`);
        }
      }
    }

    // Фильтруем по модулям
    const filteredNodes = this.filterNodes(nodes);

    return this.buildDOT({
      nodes: filteredNodes,
      edges,
      title: 'Paths',
      nodeConfig: id => this.getNodeConfig(id, { isPathNode: true }),
      edgeConfig: () => ({ color: 'blue', style: 'solid' }),
    });
  }

  /**
   * Экспортировать граф вызовов в DOT
   */
  exportCallGraph(
    callGraph: CallGraph,
    options: { maxDepth?: number; fromNode?: FunctionId } = {}
  ): string {
    const { maxDepth = 20, fromNode } = options;
    this.warnings = [];

    // Используем публичные свойства
    const adjacency = callGraph.adjacency;
    const nodes = new Set<FunctionId>();
    const edges = new Set<string>();

    if (fromNode) {
      // BFS для сбора узлов на глубину maxDepth
      const queue: [FunctionId, number][] = [[fromNode, 0]];
      const visited = new Set<FunctionId>([fromNode]);

      while (queue.length > 0) {
        const [current, depth] = queue.shift()!;
        if (depth >= maxDepth) continue;

        nodes.add(current);
        const neighbors = adjacency.get(current) || new Set();
        for (const next of neighbors) {
          edges.add(`${this.escapeId(current)} -> ${this.escapeId(next)}`);
          if (!visited.has(next)) {
            visited.add(next);
            queue.push([next, depth + 1]);
          }
        }
      }
    } else {
      // Все узлы и ребра
      for (const [from, neighbors] of adjacency) {
        nodes.add(from);
        for (const to of neighbors) {
          nodes.add(to);
          edges.add(`${this.escapeId(from)} -> ${this.escapeId(to)}`);
        }
      }
    }

    // Фильтруем по модулям
    const filteredNodes = this.filterNodes(nodes);

    return this.buildDOT({
      nodes: filteredNodes,
      edges,
      title: 'Call Graph',
      nodeConfig: id => this.getNodeConfig(id, { isCallGraphNode: true }),
      edgeConfig: () => ({ color: this.options.defaultEdgeColor, style: 'solid' }),
    });
  }

  /**
   * Экспортировать граф импортов в DOT
   */
  exportImportGraph(importGraph: ImportGraph): string {
    this.warnings = [];
    const nodes = new Set<FunctionId>();
    const edges = new Set<string>();

    // Используем публичные свойства
    const byImporter = importGraph.byImporter;
    for (const [from, imports] of byImporter) {
      nodes.add(from);
      for (const imp of imports) {
        const to = imp.to;
        nodes.add(to);
        edges.add(`${this.escapeId(from)} -> ${this.escapeId(to)} [label="${imp.type}"]`);
      }
    }

    // Фильтруем по модулям
    const filteredNodes = this.filterNodes(nodes);

    return this.buildDOT({
      nodes: filteredNodes,
      edges,
      title: 'Import Graph',
      nodeConfig: id => this.getNodeConfig(id, { isImportNode: true }),
      edgeConfig: () => ({ color: 'green', style: 'dashed' }),
    });
  }

  /**
   * Экспортировать полный граф (вызовы + импорты)
   */
  exportFullGraph(callGraph: CallGraph, importGraph: ImportGraph): string {
    this.warnings = [];
    const nodes = new Set<FunctionId>();
    const edges = new Set<string>();

    // Вызовы - используем adjacency
    const adjacency = callGraph.adjacency;
    for (const [from, neighbors] of adjacency) {
      nodes.add(from);
      for (const to of neighbors) {
        nodes.add(to);
        edges.add(`${this.escapeId(from)} -> ${this.escapeId(to)} [color=blue]`);
      }
    }

    // Импорты - используем byImporter
    const byImporter = importGraph.byImporter;
    for (const [from, imports] of byImporter) {
      nodes.add(from);
      for (const imp of imports) {
        const to = imp.to;
        nodes.add(to);
        edges.add(`${this.escapeId(from)} -> ${this.escapeId(to)} [color=green,style=dashed]`);
      }
    }

    // Фильтруем по модулям
    const filteredNodes = this.filterNodes(nodes);

    return this.buildDOT({
      nodes: filteredNodes,
      edges,
      title: 'Full Graph',
      nodeConfig: id => this.getNodeConfig(id, { isFullGraph: true }),
      edgeConfig: () => ({ color: this.options.defaultEdgeColor, style: 'solid' }),
    });
  }

  /**
   * Экспортировать отчет о модулях
   */
  exportModuleGraph(modules: Map<ModuleId, { functions: FunctionId[]; name: string }>): string {
    this.warnings = [];
    const nodes = new Set<FunctionId>();
    const edges = new Set<string>();
    const subgraphs: SubgraphConfig[] = [];

    for (const [moduleId, module] of modules) {
      const moduleNodes = module.functions;
      for (const fnId of moduleNodes) {
        nodes.add(fnId);
      }

      // Создаем подграф для модуля
      if (this.options.groupByModule && moduleNodes.length > 0) {
        subgraphs.push({
          id: `cluster_${moduleId}`,
          label: module.name,
          nodes: moduleNodes.map(id => this.escapeId(id)),
          color: this.getModuleColor(moduleId),
        });
      }
    }

    // Добавляем ребра между модулями (если функция из одного модуля вызывает функцию из другого)
    // Это нужно для полного графа

    return this.buildDOT({
      nodes,
      edges,
      subgraphs,
      title: 'Module Graph',
      nodeConfig: id => this.getNodeConfig(id, { isModuleNode: true }),
      edgeConfig: () => ({ color: this.options.defaultEdgeColor, style: 'solid' }),
    });
  }

  /**
   * Экспортировать пути с метаданными
   */
  exportPathsWithMetadata(paths: PathResult[]): string {
    if (!paths || paths.length === 0) return '';

    this.warnings = [];
    const nodes = new Set<FunctionId>();
    const edges = new Set<string>();

    for (const path of paths) {
      for (const node of path.path) {
        nodes.add(node);
      }
      for (let i = 0; i < path.path.length - 1; i++) {
        const from = path.path[i];
        const to = path.path[i + 1];
        if (from && to) {
          const fromFn = this.functionMap.get(from);
          const toFn = this.functionMap.get(to);
          const label = fromFn && toFn ? `[${fromFn.line}->${toFn.line}]` : '';
          edges.add(`${this.escapeId(from)} -> ${this.escapeId(to)} [label="${label}"]`);
        }
      }
    }

    // Фильтруем по модулям
    const filteredNodes = this.filterNodes(nodes);

    return this.buildDOT({
      nodes: filteredNodes,
      edges,
      title: 'Paths with Metadata',
      nodeConfig: id => this.getNodeConfig(id, { isPathNode: true, showMetadata: true }),
      edgeConfig: () => ({ color: 'purple', style: 'solid' }),
    });
  }

  /**
   * Фильтровать узлы по модулям
   */
  private filterNodes(nodes: Set<FunctionId>): Set<FunctionId> {
    const { includeModules, excludeModules } = this.options;

    if (includeModules.length === 0 && excludeModules.length === 0) {
      return nodes;
    }

    const filtered = new Set<FunctionId>();
    for (const id of nodes) {
      const fn = this.functionMap.get(id);
      if (!fn) continue;

      const moduleId = fn.moduleId;
      if (includeModules.length > 0 && !includeModules.includes(moduleId)) {
        continue;
      }
      if (excludeModules.length > 0 && excludeModules.includes(moduleId)) {
        continue;
      }
      filtered.add(id);
    }

    return filtered;
  }

  /**
   * Получить конфигурацию узла
   */
  private getNodeConfig(
    id: FunctionId,
    context: {
      isPathNode?: boolean;
      isCallGraphNode?: boolean;
      isImportNode?: boolean;
      isFullGraph?: boolean;
      isModuleNode?: boolean;
      showMetadata?: boolean;
    } = {}
  ): NodeConfig {
    const fn = this.functionMap.get(id);
    if (!fn) {
      return {
        id: this.escapeId(id),
        label: id,
        color: 'red',
        shape: 'box',
        style: 'filled',
      };
    }

    // Строим метку
    let label = '';
    if (this.options.showFunctionName) {
      const name =
        fn.name.length > this.options.maxNameLength
          ? fn.name.slice(0, this.options.maxNameLength) + '...'
          : fn.name;
      label += name;
    }
    if (this.options.showFunctionId) {
      if (label) label += '\\n';
      label += `ID: ${id}`;
    }
    if (this.options.showFile && fn.file) {
      if (label) label += '\\n';
      label += `File: ${fn.file}`;
    }
    if (this.options.showModule && fn.module) {
      if (label) label += '\\n';
      label += `Module: ${fn.module}`;
    }
    if (this.options.showLine && fn.line) {
      if (label) label += '\\n';
      label += `Line: ${fn.line}`;
    }

    // Определяем цвет
    let color = this.options.defaultNodeColor;
    if (context.isPathNode) {
      color = STATUS_COLORS.reachable;
    }
    if (context.isCallGraphNode) {
      color = this.isEntryPoint(id) ? STATUS_COLORS.entry : STATUS_COLORS.exit;
    }
    if (context.isImportNode) {
      color = 'lightgreen';
    }
    if (context.isFullGraph) {
      color = this.isEntryPoint(id) ? STATUS_COLORS.entry : 'lightblue';
    }

    return {
      id: this.escapeId(id),
      label: label || id,
      color,
      shape: this.options.nodeShape,
      style: this.options.nodeStyle,
      group: fn.moduleId,
      tooltip: `${fn.name} (${id})\\nFile: ${fn.file}\\nModule: ${fn.module}\\nLine: ${fn.line}`,
    };
  }

  /**
   * Проверить, является ли функция точкой входа
   */
  private isEntryPoint(id: FunctionId): boolean {
    const fn = this.functionMap.get(id);
    if (!fn) return false;
    // Функции с именем main, run, start считаем точками входа
    const entryNames = ['main', 'run', 'start', 'init', 'bootstrap'];
    return entryNames.some(name => fn.name.toLowerCase().includes(name));
  }

  /**
   * Получить цвет для модуля
   */
  private getModuleColor(moduleId: ModuleId): string {
    const colors = [
      'lightblue',
      'lightgreen',
      'lightcoral',
      'lightgoldenrodyellow',
      'lightpink',
      'lightsalmon',
      'lightseagreen',
      'lightskyblue',
      'lightslategray',
      'lightsteelblue',
      'lightyellow',
    ];
    const hash = moduleId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const color = colors[hash % colors.length];
    return color || 'lightgray';
  }

  /**
   * Экранировать ID для DOT
   */
  private escapeId(id: string): string {
    // DOT требует экранирования специальных символов
    if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(id)) {
      return id;
    }
    return `"${id.replace(/"/g, '\\"')}"`;
  }

  /**
   * Экранировать строку для DOT
   */
  private escapeLabel(label: string): string {
    return label.replace(/"/g, '\\"').replace(/\\n/g, '\\\\n').replace(/\\t/g, '\\\\t');
  }

  /**
   * Построить DOT граф
   */
  private buildDOT(params: {
    nodes: Set<FunctionId>;
    edges: Set<string>;
    subgraphs?: SubgraphConfig[];
    title?: string;
    nodeConfig: (id: FunctionId) => NodeConfig;
    edgeConfig: (edge: string) => { color: string; style: string; label?: string };
  }): string {
    const { nodes, edges, subgraphs = [], title = 'Graph' } = params;

    if (nodes.size === 0) {
      this.warnings.push('Нет узлов для экспорта');
      return '';
    }

    let dot = `digraph "${this.escapeLabel(title)}" {\n`;

    // Настройки графа
    dot += `  rankdir=${this.options.rankdir};\n`;
    dot += `  bgcolor="${this.options.bgColor}";\n`;
    dot += `  fontname="${this.options.fontName}";\n`;
    dot += `  fontsize=${this.options.fontSize};\n`;
    dot += `  node [fontname="${this.options.fontName}", fontsize=${this.options.fontSize}];\n`;
    dot += `  edge [fontname="${this.options.fontName}", fontsize=${this.options.fontSize}];\n`;

    // Настройки узлов по умолчанию
    dot += `  node [shape=${this.options.nodeShape}, style=${this.options.nodeStyle}, fillcolor=${this.options.defaultNodeColor}];\n`;

    // Подграфы (модули)
    for (const subgraph of subgraphs) {
      dot += `\n  subgraph ${subgraph.id} {\n`;
      dot += `    label="${this.escapeLabel(subgraph.label)}";\n`;
      if (subgraph.color) {
        dot += `    color="${subgraph.color}";\n`;
      }
      if (subgraph.style) {
        dot += `    style="${subgraph.style}";\n`;
      }
      for (const node of subgraph.nodes) {
        dot += `    ${node};\n`;
      }
      dot += '  }\n';
    }

    // Узлы
    for (const id of nodes) {
      const config = params.nodeConfig(id);
      const nodeDef = this.buildNodeDefinition(config);
      dot += `  ${nodeDef}\n`;
    }

    // Ребра
    for (const edge of edges) {
      const config = params.edgeConfig(edge);
      const edgeDef = this.buildEdgeDefinition(edge, config);
      dot += `  ${edgeDef}\n`;
    }

    // Легенда
    if (this.options.showLegend) {
      dot += this.buildLegend();
    }

    dot += '}\n';
    return dot;
  }

  /**
   * Построить определение узла
   */
  private buildNodeDefinition(config: NodeConfig): string {
    const parts: string[] = [config.id];
    const attrs: string[] = [];

    if (config.label) {
      attrs.push(`label="${this.escapeLabel(config.label)}"`);
    }
    if (config.color) {
      attrs.push(`fillcolor="${config.color}"`);
    }
    if (config.shape) {
      attrs.push(`shape="${config.shape}"`);
    }
    if (config.style) {
      attrs.push(`style="${config.style}"`);
    }
    if (config.tooltip) {
      attrs.push(`tooltip="${this.escapeLabel(config.tooltip)}"`);
    }
    if (config.url) {
      attrs.push(`URL="${config.url}"`);
    }

    if (attrs.length > 0) {
      parts.push(`[${attrs.join(', ')}]`);
    }

    return parts.join(' ');
  }

  /**
   * Построить определение ребра
   */
  private buildEdgeDefinition(
    edge: string,
    config: { color: string; style: string; label?: string }
  ): string {
    const attrs: string[] = [];

    if (config.color && config.color !== 'black') {
      attrs.push(`color="${config.color}"`);
    }
    if (config.style && config.style !== 'solid') {
      attrs.push(`style="${config.style}"`);
    }
    if (config.label) {
      attrs.push(`label="${this.escapeLabel(config.label)}"`);
    }

    if (attrs.length > 0) {
      return `${edge} [${attrs.join(', ')}];`;
    }
    return `${edge};`;
  }

  /**
   * Построить легенду
   */
  private buildLegend(): string {
    let legend = '\n  // ===== LEGEND =====\n';
    legend += '  subgraph cluster_legend {\n';
    legend += '    label="Legend";\n';
    legend += '    style=filled;\n';
    legend += '    color=lightgrey;\n';
    legend += '    node [style=filled];\n';

    // Типы вызовов
    const callTypes = [
      ['d', 'Direct Call', 'black'],
      ['a', 'Async Call', 'blue'],
      ['m', 'Method Call', 'green'],
      ['c', 'Callback', 'orange'],
      ['di', 'Dynamic Import', 'red'],
    ];

    for (const [type, name, color] of callTypes) {
      legend += `    legend_${type} [label="${type}: ${name}", fillcolor="${color}", fontcolor=white];\n`;
    }

    legend += '    legend_sep [label="---", shape=plaintext];\n';

    // Статусы
    const statuses = [
      ['entry', 'Entry Point', STATUS_COLORS.entry],
      ['exit', 'Exit Point', STATUS_COLORS.exit],
      ['reachable', 'Reachable', STATUS_COLORS.reachable],
      ['dead', 'Dead Code', STATUS_COLORS.dead],
      ['isolated', 'Isolated', STATUS_COLORS.isolated],
    ];

    for (const [type, name, color] of statuses) {
      legend += `    legend_${type} [label="${name}", fillcolor="${color}"];\n`;
    }

    legend += '  }\n';
    return legend;
  }

  /**
   * Получить предупреждения
   */
  getWarnings(): string[] {
    return [...this.warnings];
  }

  /**
   * Получить статистику последнего экспорта
   */
  getStats(dot: string): { nodes: number; edges: number; subgraphs: number; warnings: string[] } {
    const nodeMatches = dot.match(/\s+[a-zA-Z_][a-zA-Z0-9_]*\s*\[/g);
    const edgeMatches = dot.match(/\s+[a-zA-Z_][a-zA-Z0-9_]*\s*->\s*[a-zA-Z_][a-zA-Z0-9_]*/g);
    const subgraphMatches = dot.match(/subgraph\s+cluster_\w+/g);

    return {
      nodes: nodeMatches ? nodeMatches.length : 0,
      edges: edgeMatches ? edgeMatches.length : 0,
      subgraphs: subgraphMatches ? subgraphMatches.length : 0,
      warnings: this.getWarnings(),
    };
  }

  /**
   * Сохранить DOT в файл
   */
  saveToFile(dot: string, filePath: string): void {
    const fs = require('fs');
    fs.writeFileSync(filePath, dot, 'utf-8');
  }

  /**
   * Обновить опции
   */
  updateOptions(options: Partial<DOTExporterOptions>): this {
    this.options = this.mergeOptions({ ...this.options, ...options });
    return this;
  }

  /**
   * Сбросить опции к дефолтным
   */
  resetOptions(): this {
    this.options = this.mergeOptions({});
    return this;
  }
}

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================

/**
 * Создать экспортер по умолчанию
 */
export function createDefaultDOTExporter(
  functionMap: Map<FunctionId, FunctionEntity>
): DOTExporter {
  return new DOTExporter(functionMap);
}

/**
 * Создать экспортер для визуализации путей
 */
export function createPathDOTExporter(functionMap: Map<FunctionId, FunctionEntity>): DOTExporter {
  return new DOTExporter(functionMap, {
    rankdir: 'TB',
    showFunctionName: true,
    showLine: true,
    nodeShape: 'ellipse',
    defaultNodeColor: 'lightyellow',
    showLegend: true,
  });
}

/**
 * Создать экспортер для графа вызовов
 */
export function createCallGraphDOTExporter(
  functionMap: Map<FunctionId, FunctionEntity>
): DOTExporter {
  return new DOTExporter(functionMap, {
    rankdir: 'LR',
    showFunctionName: true,
    showModule: true,
    nodeShape: 'box',
    defaultNodeColor: 'lightblue',
    showCallType: true,
    groupByModule: true,
    showLegend: true,
  });
}

/**
 * Создать экспортер для графа импортов
 */
export function createImportGraphDOTExporter(
  functionMap: Map<FunctionId, FunctionEntity>
): DOTExporter {
  return new DOTExporter(functionMap, {
    rankdir: 'TB',
    showFunctionName: true,
    showFile: true,
    nodeShape: 'hexagon',
    defaultNodeColor: 'lightgreen',
    showLegend: true,
  });
}

// ==================== ТИПЫ ДЛЯ ТЕСТИРОВАНИЯ ====================

/**
 * Тестовые данные для DOT экспортера
 */
export interface TestDOTData {
  functionMap: Map<FunctionId, FunctionEntity>;
  paths: FunctionId[][];
  callGraph: CallGraph;
  importGraph: ImportGraph;
}

/**
 * Создать тестовые данные
 */
export function createTestDOTData(): TestDOTData {
  const functionMap = new Map<FunctionId, FunctionEntity>();

  // Создаем тестовые функции
  for (let i = 1; i <= 10; i++) {
    functionMap.set(`fn${i}` as FunctionId, {
      id: `fn${i}` as FunctionId,
      name: `function_${i}`,
      moduleId: `m${Math.ceil(i / 3)}` as ModuleId,
      fileId: `f${i}` as FileId,
      line: i * 10,
      flags: '',
      module: `Module ${Math.ceil(i / 3)}`,
      file: `file_${i}.ts`,
      filePath: `src/file_${i}.ts`,
    });
  }

  // Создаем тестовые пути
  const paths = [
    ['fn1', 'fn2', 'fn3'],
    ['fn1', 'fn4', 'fn5'],
    ['fn2', 'fn6', 'fn7'],
  ] as FunctionId[][];

  // Создаем IdNormalizer и реальные экземпляры графов
  const idNormalizer = new IdNormalizer(functionMap);

  // Создаем CallGraph с тестовыми ребрами
  const callGraph = new CallGraphClass(idNormalizer, functionMap);
  const callEdges: [FunctionId, FunctionId, number, CallType][] = [
    ['fn1' as FunctionId, 'fn2' as FunctionId, 10, 'd'],
    ['fn1' as FunctionId, 'fn3' as FunctionId, 20, 'a'],
    ['fn2' as FunctionId, 'fn4' as FunctionId, 30, 'd'],
    ['fn3' as FunctionId, 'fn4' as FunctionId, 40, 'm'],
    ['fn5' as FunctionId, 'fn1' as FunctionId, 50, 'c'],
  ];
  callGraph.build(callEdges);

  // Создаем ImportGraph с тестовыми ребрами
  const importGraph = new ImportGraphClass(idNormalizer, functionMap);
  const importEdges: [FunctionId, FunctionId, string, ImportType, FileId][] = [
    ['fn1' as FunctionId, 'fn2' as FunctionId, 'testFunction', 'n', 'f1' as FileId],
    ['fn1' as FunctionId, 'fn3' as FunctionId, 'anotherTest', 'df', 'f1' as FileId],
    ['fn2' as FunctionId, 'fn4' as FunctionId, 'someFunction', 'ns', 'f2' as FileId],
    ['fn3' as FunctionId, 'fn4' as FunctionId, 'someFunction', 'ri', 'f2' as FileId],
    ['fn5' as FunctionId, 'fn1' as FunctionId, 'testFunction', 'to', 'f3' as FileId],
  ];
  importGraph.build(importEdges);

  return { functionMap, paths, callGraph, importGraph };
}

// ==================== ДЕФОЛТНЫЙ ЭКСПОРТ ====================

export default DOTExporter;

import { describe, it, expect } from 'vitest';
import { findCyclicEdges, convertToDOT } from '../core/graph-utils.js';

describe('Графовые утилиты', () => {
  describe('findCyclicEdges - поиск циклических зависимостей', () => {
    it('должен находить простой цикл из 3 узлов', () => {
      const graph = {
        a: ['b'],
        b: ['c'],
        c: ['a'], // цикл a → b → c → a
      };

      const cycles = findCyclicEdges(graph);

      // Должно быть 3 ребра в цикле
      expect(cycles.size).toBe(3);
      expect(cycles.has('a->b')).toBe(true);
      expect(cycles.has('b->c')).toBe(true);
      expect(cycles.has('c->a')).toBe(true);
    });

    it('должен находить простой цикл из 2 узлов', () => {
      const graph = {
        x: ['y'],
        y: ['x'], // цикл x ↔ y
      };

      const cycles = findCyclicEdges(graph);

      expect(cycles.size).toBe(2);
      expect(cycles.has('x->y')).toBe(true);
      expect(cycles.has('y->x')).toBe(true);
    });

    it('не должен находить циклы в ациклическом графе', () => {
      const graph = {
        a: ['b', 'c'],
        b: ['d'],
        c: ['d'],
        d: [],
      };

      const cycles = findCyclicEdges(graph);
      expect(cycles.size).toBe(0);
    });

    it('должен находить цикл с самоссылкой', () => {
      const graph = {
        self: ['self'], // цикл сам на себя
      };

      const cycles = findCyclicEdges(graph);

      expect(cycles.size).toBe(1);
      expect(cycles.has('self->self')).toBe(true);
    });

    it('должен находить множественные циклы', () => {
      const graph = {
        a: ['b'],
        b: ['a'], // цикл 1: a-b
        c: ['d'],
        d: ['c'], // цикл 2: c-d
        e: ['f'],
        f: ['g'],
        g: ['e'], // цикл 3: e-f-g-e
      };

      const cycles = findCyclicEdges(graph);

      expect(cycles.size).toBe(7); // 2 + 2 + 3 = 7 ребер
      expect(cycles.has('a->b')).toBe(true);
      expect(cycles.has('b->a')).toBe(true);
      expect(cycles.has('c->d')).toBe(true);
      expect(cycles.has('d->c')).toBe(true);
      expect(cycles.has('e->f')).toBe(true);
      expect(cycles.has('f->g')).toBe(true);
      expect(cycles.has('g->e')).toBe(true);
    });

    it('должен находить сложный вложенный цикл', () => {
      const graph = {
        service1: ['service2', 'service3'],
        service2: ['service1'],
        service3: ['service1', 'service4'],
        service4: ['service3'],
      };

      const cycles = findCyclicEdges(graph);

      expect(cycles.has('service1->service2')).toBe(true);
      expect(cycles.has('service2->service1')).toBe(true);
      expect(cycles.has('service1->service3')).toBe(true);
      expect(cycles.has('service3->service1')).toBe(true);
      expect(cycles.has('service3->service4')).toBe(true);
      expect(cycles.has('service4->service3')).toBe(true);
      expect(cycles.size).toBe(6);
    });
  });

  describe('convertToDOT - конвертация в формат DOT', () => {
    it('должен генерировать валидный DOT формат для простого графа', () => {
      const graphData = {
        rootKey: 'index.ts',
        graph: {
          'index.ts': ['utils.ts'],
          'utils.ts': [],
        },
      };

      const cycles = new Set();
      const dot = convertToDOT(graphData, cycles);

      expect(dot).toContain('digraph "Dependency Graph"');
      expect(dot).toContain('rankdir=LR');
      expect(dot).toContain('"index.ts" -> "utils.ts"');
      expect(dot).toContain('⭐ index.ts');
    });

    it('должен подсвечивать циклические зависимости красным', () => {
      const graphData = {
        rootKey: 'a.ts',
        graph: {
          'a.ts': ['b.ts'],
          'b.ts': ['a.ts'],
        },
      };

      const cycles = new Set(['a.ts->b.ts', 'b.ts->a.ts']);
      const dot = convertToDOT(graphData, cycles);

      expect(dot).toContain('color="#ef4444"');
      expect(dot).toContain('style="dashed"');
      expect(dot).toContain('label="цикл"');
    });

    it('должен правильно обрабатывать пустой граф', () => {
      const graphData = {
        rootKey: 'empty.ts',
        graph: {},
      };

      const cycles = new Set();
      const dot = convertToDOT(graphData, cycles);

      expect(dot).toContain('digraph "Dependency Graph"');
      expect(dot).toContain('⭐ empty.ts');
      expect(dot).toContain('}');
    });

    it('должен экранировать специальные символы в именах узлов', () => {
      const graphData = {
        rootKey: 'my-file.ts',
        graph: {
          'my-file.ts': ['@scope/package'],
          '@scope/package': [],
        },
      };

      const cycles = new Set();
      const dot = convertToDOT(graphData, cycles);

      expect(dot).toContain('"my-file.ts"');
      expect(dot).toContain('"@scope/package"');
    });
  });
});

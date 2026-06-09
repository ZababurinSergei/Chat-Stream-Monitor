import { describe, it, expect } from 'vitest';
import { parseFile, isExternalModule, resolveFilePath } from '../core/ast-parser.js';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('AST Парсер', () => {
  describe('isExternalModule - определение внешнего модуля', () => {
    it('должен определять внешние модули правильно', () => {
      expect(isExternalModule('fs')).toBe(true);
      expect(isExternalModule('@types/node')).toBe(true);
      expect(isExternalModule('./local-file')).toBe(false);
      expect(isExternalModule('../local-file')).toBe(false);
      expect(isExternalModule('/absolute/path')).toBe(false);
    });
  });

  describe('parseFile - парсинг файла', () => {
    it('должен возвращать null для несуществующего файла', () => {
      const result = parseFile('/non-existent-file.js');
      expect(result).toBe(null);
    });

    it('должен парсить валидный JavaScript файл', () => {
      const testFile = path.join(__dirname, 'test-sample.js');
      const testContent = 'export const test = "hello";\nfunction foo() { return "bar"; }';

      fs.writeFileSync(testFile, testContent);
      const result = parseFile(testFile);
      fs.unlinkSync(testFile);

      expect(result).not.toBe(null);
      expect(result.type).toBe('Program');
    });
  });
});

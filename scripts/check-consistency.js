import { execSync } from 'node:child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 Проверка подмодулей...');

try {
  // Получаем список всех подмодулей
  const submoduleOutput = execSync('git submodule status', {
    encoding: 'utf-8',
  }).trim();
  const submoduleLines = submoduleOutput.split('\n').filter(line => line.trim());

  if (submoduleLines.length === 0) {
    console.log('✅ Нет подмодулей для проверки');
    process.exit(0);
  }

  // Проверяем каждый подмодуль на наличие изменений
  const dirtyModules = [];

  for (const line of submoduleLines) {
    // Формат: " hash path" или "-hash path" или "+hash path"
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) {
      continue;
    }

    const statusChar = parts[0].charAt(0);
    const hash = parts[0].replace(/^[-+]/, '');
    const modulePath = parts[1];

    // Игнорируем неинициализированные подмодули (начинаются с -)
    if (statusChar === '-') {
      continue; // Пропускаем, не показываем
    }

    // Игнорируем .vite-cache и другие кэши
    if (
      modulePath.includes('.vite-cache') ||
      modulePath.includes('.cache') ||
      modulePath.includes('.turbo')
    ) {
      continue;
    }

    const fullPath = path.join(__dirname, modulePath);

    try {
      // Проверяем изменения в подмодуле
      const status = execSync(`git -C "${fullPath}" status --porcelain`, {
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      }).trim();

      if (status) {
        dirtyModules.push({
          path: modulePath,
          fullPath,
          status,
        });
      }
    } catch (error) {
      // Подмодуль не инициализирован - игнорируем
      continue;
    }
  }

  if (dirtyModules.length === 0) {
    console.log('✅ Все подмодули чисты, изменений нет');
    process.exit(0);
  }

  // Выводим информацию об измененных подмодулях
  console.log('\n' + '═'.repeat(60));
  console.log('📋 ИЗМЕНЕННЫЕ ПОДМОДУЛИ');
  console.log('═'.repeat(60));

  for (const module of dirtyModules) {
    console.log(`\n📦 ${module.path}`);
    console.log('─'.repeat(50));

    // Подсчитываем количество изменений
    const lines = module.status.split('\n').filter(l => l.trim());
    const added = lines.filter(l => l.startsWith('A') || l.includes('新增')).length;
    const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M')).length;
    const deleted = lines.filter(l => l.startsWith(' D') || l.startsWith('D')).length;
    const untracked = lines.filter(l => l.startsWith('??')).length;

    console.log(`   📊 Изменений: ${lines.length}`);
    if (added > 0) {
      console.log(`      ➕ Добавлено: ${added}`);
    }
    if (modified > 0) {
      console.log(`      📝 Изменено: ${modified}`);
    }
    if (deleted > 0) {
      console.log(`      ➖ Удалено: ${deleted}`);
    }
    if (untracked > 0) {
      console.log(`      📄 Неотслеживаемых: ${untracked}`);
    }

    console.log('\n   🔧 Что делать?');
    console.log('   ─────────────────────────────────────────────────');
    console.log('   ✅ ВАРИАНТ 1: Закоммитить изменения');
    console.log(`      cd ${module.path}`);
    console.log('      git status');
    console.log('      git add .');
    console.log(`      git commit -m "обновление ${module.path}"`);
    console.log('      cd ../..');
    console.log('');
    console.log('   ❌ ВАРИАНТ 2: Отменить изменения');
    console.log(`      cd ${module.path}`);
    console.log('      git reset --hard HEAD');
    console.log('      cd ../..');
    console.log('   ─────────────────────────────────────────────────');
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📌 Всего измененных подмодулей: ${dirtyModules.length}`);
  console.log('═'.repeat(60) + '\n');

  process.exit(1);
} catch (error) {
  console.error('❌ Ошибка проверки:', error.message);
  process.exit(1);
}

import { execSync } from 'node:child_process';

console.log('⏳ Turborepo: Проверка отправки коммитов подмодулей...');

try {
  // Проверяем, есть ли изменения в подмодулях
  const submoduleStatus = execSync('git submodule status', {
    encoding: 'utf-8',
  }).trim();
  const hasNewCommits = submoduleStatus.split('\n').some(line => line.startsWith('+'));

  if (hasNewCommits) {
    console.log('\n📦 Обнаружены новые коммиты в подмодулях!');
    console.log('   Автоматическое добавление изменений подмодулей...\n');

    // Добавляем все изменения подмодулей
    execSync('git add .', { stdio: 'inherit' });

    console.log('✅ Изменения подмодулей добавлены в индекс.');
    console.log('   Подмодули с новыми коммитами:');

    // Показываем какие подмодули были добавлены
    const modules = execSync('git diff --cached --name-only', {
      encoding: 'utf-8',
    })
      .split('\n')
      .filter(line => line.includes('/'));

    modules.forEach(module => {
      if (module) {
        console.log(`   📦 ${module}`);
      }
    });

    console.log('\n💡 Теперь можно выполнить коммит.');
    console.log("   Команда: git commit -m 'обновление подмодулей'");
    console.log('   или выполните повторный commit с вашим сообщением.\n');

    process.exit(0);
  }

  // Далее стандартная проверка push
  execSync('git push --recurse-submodules=check --dry-run', { stdio: 'pipe' });

  console.log('✅ Все коммиты подмодулей уже опубликованы на удаленном сервере.');
  console.log('   Можно безопасно выполнять git push.');
} catch (error) {
  console.error('\n❌ ОШИБКА pre-push консистентности!');
  console.error('   Вы пытаетесь запушить родительский репозиторий,');
  console.error('   но забыли отправить коммиты внутри подмодулей.');

  console.error('\n🔧 Решение:');
  console.error('   ────────────────────────────────────────────────────────────────');
  console.error('   1. Найдите измененные подмодули:');
  console.error('      git submodule status');
  console.error('   ');
  console.error('   2. Отправьте изменения в каждом подмодуле:');
  console.error("      git submodule foreach 'git push origin HEAD:main'");
  console.error('   ');
  console.error('   3. Или отправьте все подмодули одной командой:');
  console.error('      git submodule foreach git push');
  console.error('   ');
  console.error('   4. После этого повторите push родительского репозитория:');
  console.error('      git push origin main');
  console.error('   ────────────────────────────────────────────────────────────────');
  console.error('\n💡 Альтернативное решение (пропустить проверку):');
  console.error('   git push --no-verify');
  console.error('   ⚠️  Используйте только если уверены в своих действиях!');
  process.exit(1);
}

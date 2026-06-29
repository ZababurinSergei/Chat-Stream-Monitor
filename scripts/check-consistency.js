import { execSync } from "node:child_process";

console.log("📦 Turborepo: Проверка консистентности модулей...");

try {
  // 1. Проверяем, инициализированы ли все подмодули локально
  const submoduleStatus = execSync("git submodule status", {
    encoding: "utf-8",
  });
  const lines = submoduleStatus.split("\n").filter(line => line.trim());

  const uninitialized = lines.filter(line => line.startsWith("-"));
  const newCommits = lines.filter(line => line.startsWith("+"));
  const normal = lines.filter(line => line.startsWith(" "));

  if (uninitialized.length > 0) {
    console.error("\n❌ ОШИБКА: Обнаружены неинициализированные подмодули!");
    console.error(
      `📋 Найдено неинициализированных подмодулей: ${uninitialized.length}`,
    );
    console.error("\n🔧 Решение:");
    console.error("   Запустите инициализацию подмодулей:");
    console.error("   ─────────────────────────────────────────────");
    console.error("   pnpm install");
    console.error("   ─────────────────────────────────────────────");
    console.error("   Или вручную:");
    console.error("   git submodule update --init --recursive");
    process.exit(1);
  }

  // 2. Если есть новые коммиты в подмодулях
  if (newCommits.length > 0) {
    console.log("\n📦 Обнаружены новые коммиты в подмодулях!");
    console.log(
      `   Количество подмодулей с новыми коммитами: ${newCommits.length}`,
    );

    // Показываем какие подмодули изменились
    console.log("\n   Измененные подмодули:");
    newCommits.forEach(line => {
      const hash = line.substring(1, 41);
      const path = line.substring(42).trim();
      console.log(`   📦 ${path} (хеш: ${hash.substring(0, 7)}...)`);
    });

    console.log("\n🔧 Автоматическое добавление изменений...");

    // Добавляем все изменения подмодулей
    execSync("git add .", { stdio: "inherit" });

    console.log("✅ Изменения подмодулей добавлены в индекс.");
    console.log("   Теперь можно выполнить коммит.");
    console.log("   Команда: git commit -m 'обновление подмодулей'");
    console.log("   или выполните повторный commit с вашим сообщением.\n");

    process.exit(0);
  }

  // 3. Ищем незакоммиченный код (грязный рабочий каталог) внутри подмодулей
  const dirtySubmodules = execSync(
    'git submodule foreach --quiet "git status --porcelain"',
    { encoding: "utf-8" },
  ).trim();

  if (dirtySubmodules) {
    console.error(
      "\n❌ ОШИБКА: Внутри Git-подмодулей есть незакоммиченные файлы!",
    );
    console.error("\n🔧 Решение:");
    console.error(
      "   Перейдите в каждый измененный подмодуль и закоммитьте изменения:",
    );
    console.error(
      "   ────────────────────────────────────────────────────────────────",
    );
    console.error("   cd packages/имя_подмодуля");
    console.error("   git status                    # Посмотреть изменения");
    console.error("   git add .                     # Добавить изменения");
    console.error("   git commit -m 'описание'     # Создать коммит");
    console.error("   cd ../..                     # Вернуться в корень");
    console.error(
      "   ────────────────────────────────────────────────────────────────",
    );
    console.error("   Или отменить изменения:");
    console.error("   git submodule foreach --quiet 'git reset --hard HEAD'");
    process.exit(1);
  }

  // 4. Проверка на рассинхронизацию
  const diffStatus = execSync("git diff --submodule=short", {
    encoding: "utf-8",
  }).trim();

  if (diffStatus.includes("Submodule")) {
    console.error(
      "\n❌ ОШИБКА: Хеши коммитов в подмодулях рассинхронизированы с родительским репозиторием!",
    );
    console.error("\n🔧 Решение:");
    console.error(
      "   Обновите ссылки на подмодули в родительском репозитории:",
    );
    console.error(
      "   ────────────────────────────────────────────────────────────────",
    );
    console.error(
      "   git status                    # Посмотреть измененные подмодули",
    );
    console.error(
      "   git add packages/имя_подмодуля # Добавить изменения подмодуля",
    );
    console.error("   git commit -m 'обновление подмодулей'");
    console.error(
      "   ────────────────────────────────────────────────────────────────",
    );
    console.error("   Или обновить подмодули до актуального состояния:");
    console.error("   git submodule update --remote");
    process.exit(1);
  }

  console.log("✅ Все модули консистентны!");
  console.log(
    "   Подмодули инициализированы, изменений нет, хеши синхронизированы.",
  );
} catch (error) {
  console.error("\n❌ КРИТИЧЕСКАЯ ОШИБКА проверки Git:", error.message);
  console.error("\n🔧 Общие решения:");
  console.error(
    "   ────────────────────────────────────────────────────────────────",
  );
  console.error("   1. Проверить состояние Git:");
  console.error("      git status");
  console.error("   2. Проверить состояние подмодулей:");
  console.error("      git submodule status");
  console.error("   3. Обновить подмодули:");
  console.error("      git submodule update --init --recursive");
  console.error(
    "   ────────────────────────────────────────────────────────────────",
  );
  process.exit(1);
}

import { execSync } from "node:child_process";

console.log("📦 Turborepo: Проверка консистентности модулей...");

try {
  // 1. Проверяем, инициализированы ли все подмодули локально
  const uninitialized = execSync("git submodule status", { encoding: "utf-8" })
    .split("\n")
    .filter((line) => line.startsWith("-"));

  if (uninitialized.length > 0) {
    console.error(
      "❌ Ошибка: Обнаружены неинициализированные подмодули! Запустите: pnpm install",
    );
    process.exit(1);
  }

  // 2. Ищем незакоммиченный код (грязный рабочий каталог) внутри подмодулей
  const dirtySubmodules = execSync(
    'git submodule foreach --quiet "git status --porcelain"',
    { encoding: "utf-8" },
  ).trim();
  if (dirtySubmodules) {
    console.error(
      "❌ Ошибка: Внутри ваших Git-подмодулей есть незакоммиченные файлы!",
    );
    process.exit(1);
  }

  // 3. Проверка на рассинхронизацию (HEAD подмодуля не совпадает с тем, что ждет родительский репозиторий)
  const diffStatus = execSync("git diff --submodule=short", {
    encoding: "utf-8",
  }).trim();
  if (diffStatus.includes("Submodule")) {
    console.error(
      "❌ Ошибка: Хеши коммитов в подмодулях рассинхронизированы с родительским репозиторием!",
    );
    console.error("Сделайте git add для измененных подмодулей в корне.");
    process.exit(1);
  }

  console.log("✅ Все модули консистентны!");
} catch (error) {
  console.error("❌ Критическая ошибка проверки Git:", error.message);
  process.exit(1);
}

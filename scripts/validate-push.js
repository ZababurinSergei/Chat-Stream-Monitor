import { execSync } from "node:child_process";

console.log("⏳ Turborepo: Проверка отправки коммитов подмодулей...");

try {
  // Флаг --recurse-submodules=check проверяет, существуют ли локальные коммиты подмодулей
  // на удаленном сервере (remote). --dry-run предотвращает реальную отправку.
  execSync("git push --recurse-submodules=check --dry-run", { stdio: "pipe" });

  console.log(
    "✅ Все коммиты подмодулей уже опубликованы на удаленном сервере.",
  );
} catch (error) {
  console.error("\n❌ Ошибка pre-push консистентности!");
  console.error(
    "Вы пытаетесь запушить родительский репозиторий, но забыли отправить коммиты внутри ваших подмодулей.",
  );
  console.error(
    "Пожалуйста, сначала зайдите в измененные подмодули и сделайте git push.",
  );
  console.error(
    "Или воспользуйтесь встроенной командой: git submodule foreach git push\n",
  );
  process.exit(1);
}

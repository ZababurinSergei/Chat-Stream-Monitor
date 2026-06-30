// index.mjs
console.log("Запуск основного скрипта...");
console.log("Текущая директория:", process.cwd());
console.log("Аргументы командной строки:", process.argv);

// Имитация долгой задачи
for (let i = 0; i < 5; i++) {
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log(`Шаг ${i + 1} выполнен`);
}

console.log("Скрипт успеш`nodemonно завершён");

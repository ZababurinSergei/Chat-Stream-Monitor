// components/quest-definitions.js

export const QUEST_DEFINITIONS = [
  {
    id: 'q1',
    title: '🏰 Исследование замка',
    desc: 'Найди все функции и их зависимости',
    status: 'pending',
    action: async api => {
      const data = await api.getFunctions();
      const functions = data.functions;
      const calls = functions.reduce((sum, fn) => sum + (fn.calls?.length || 0), 0);
      return {
        success: true,
        message:
          `🔍 Найдено ${functions.length} функций и ${calls} вызовов.\n\n` +
          `📊 Топ-5 функций:\n${functions
            .slice(0, 5)
            .map((f, i) => `  ${i + 1}. ${f.name} (${f.id}) - ${f.module}`)
            .join('\n')}`,
        data: { functions, calls },
      };
    },
  },
  {
    id: 'q2',
    title: '🗺️ Карта сокровищ',
    desc: 'Найди путь между двумя функциями',
    status: 'pending',
    action: async api => {
      const data = await api.getFunctions();
      const functions = data.functions;
      if (functions.length < 2) {
        return { success: false, message: '❌ Недостаточно функций для поиска пути' };
      }
      const from = functions[0].id;
      const to = functions[Math.min(2, functions.length - 1)].id;
      const pathData = await api.getPaths(from, to, 10);
      if (pathData.paths && pathData.paths.length > 0) {
        const firstPath = pathData.paths[0];
        return {
          success: true,
          message:
            `🗺️ Путь найден!\n\n` +
            `От: ${firstPath.names[0]} → К: ${firstPath.names[firstPath.names.length - 1]}\n` +
            `Длина: ${firstPath.length} узлов\n\n` +
            `🛤️ Путь:\n${firstPath.names.join(' → ')}`,
          data: pathData,
        };
      } else {
        return {
          success: false,
          message: `❌ Путь не найден между ${from} и ${to}`,
        };
      }
    },
  },
  {
    id: 'q3',
    title: '💀 Охота на мертвый код',
    desc: 'Найди неиспользуемые функции',
    status: 'pending',
    action: async api => {
      const data = await api.getStats();
      const deadCode = data.deadCode;
      if (deadCode.total > 0) {
        const examples = deadCode.functions
          .slice(0, 5)
          .map(f => `  • ${f.name} (${f.id}) - ${f.file}`)
          .join('\n');
        return {
          success: true,
          message:
            `💀 Найдено ${deadCode.total} мёртвых функций (${deadCode.percentage}%)\n\n` +
            `🔴 Примеры:\n${examples}\n\n` +
            `💡 Совет: Удалите или используйте эти функции для улучшения кода.`,
          data: deadCode,
        };
      } else {
        return {
          success: true,
          message: `✨ Отлично! Мёртвый код не найден. Чистый код!`,
        };
      }
    },
  },
  {
    id: 'q4',
    title: '🏝️ Изолированные функции',
    desc: 'Найди функции, которые никто не вызывает',
    status: 'pending',
    action: async api => {
      const data = await api.getStats();
      const isolated = data.isolated;
      if (isolated.total > 0) {
        const examples = isolated.functions
          .slice(0, 5)
          .map(f => `  • ${f.name} (${f.id}) - ${f.file}`)
          .join('\n');
        return {
          success: true,
          message:
            `🏝️ Найдено ${isolated.total} изолированных функций (${isolated.percentage}%)\n\n` +
            `🔹 Примеры:\n${examples}\n\n` +
            `💡 Совет: Проверьте, нужны ли эти функции или их можно объединить.`,
          data: isolated,
        };
      } else {
        return {
          success: true,
          message: `✨ Все функции взаимодействуют друг с другом!`,
          data: isolated,
        };
      }
    },
  },
  {
    id: 'q5',
    title: '📚 Книга библиотек',
    desc: 'Найди все внешние библиотеки',
    status: 'pending',
    action: async api => {
      const data = await api.getLibraries();
      if (data.libraries && data.libraries.length > 0) {
        const libs = data.libraries
          .map((lib, i) => `  ${i + 1}. ${lib.name} (v${lib.version}) - ${lib.count} использований`)
          .join('\n');
        return {
          success: true,
          message:
            `📚 Найдено ${data.total} внешних библиотек:\n\n${libs}\n\n` +
            `💡 Совет: Проверьте, все ли библиотеки актуальны и нужны.`,
          data: data.libraries,
        };
      } else {
        return {
          success: true,
          message: `📚 Внешние библиотеки не найдены.`,
        };
      }
    },
  },
  {
    id: 'q6',
    title: '📊 Мастер статистики',
    desc: 'Получи полный отчет о проекте',
    status: 'pending',
    action: async api => {
      const data = await api.getStats();
      const summary = data.summary || {};
      const dead = data.deadCode || { total: 0, percentage: '0' };
      const isolated = data.isolated || { total: 0, percentage: '0' };
      const mostCalled = data.mostCalled || [];
      return {
        success: true,
        message:
          `📊 СТАТИСТИКА ПРОЕКТА\n\n` +
          `📌 Общая:\n` +
          `  • Функций: ${summary.tf || 0}\n` +
          `  • Модулей: ${summary.tm || 0}\n` +
          `  • Файлов: ${summary.tfils || 0}\n` +
          `  • Вызовов: ${summary.tc || 0}\n` +
          `  • Импортов: ${summary.ti || 0}\n` +
          `  • Констант: ${summary.tcn || 0}\n\n` +
          `📌 Анализ:\n` +
          `  • Мёртвый код: ${dead.total} (${dead.percentage}%)\n` +
          `  • Изолированных: ${isolated.total} (${isolated.percentage}%)\n\n` +
          `📌 Топ-5 вызываемых:\n${mostCalled
            .slice(0, 5)
            .map((f, i) => `  ${i + 1}. ${f.function?.name || f.id} - ${f.calls} вызовов`)
            .join('\n')}`,
        data: data,
      };
    },
  },
  {
    id: 'q7',
    title: '🔀 Достижимость',
    desc: 'Проверь достижимость между функциями',
    status: 'pending',
    action: async api => {
      const data = await api.getFunctions();
      const functions = data.functions;
      if (functions.length < 2) {
        return { success: false, message: '❌ Недостаточно функций' };
      }
      const from = functions[0].id;
      const to = functions[Math.floor(Math.random() * functions.length)].id;
      const reachData = await api.getReachable(from, to, 10);
      const fromName = functions.find(f => f.id === from)?.name || from;
      const toName = functions.find(f => f.id === to)?.name || to;
      if (reachData.reachable) {
        const path = reachData.shortestPathNames?.join(' → ') || 'путь найден';
        return {
          success: true,
          message: `✅ Достижимо!\n\n` + `От: ${fromName} → К: ${toName}\n` + `🛤️ Путь: ${path}`,
          data: reachData,
        };
      } else {
        return {
          success: true,
          message:
            `❌ Не достижимо\n\n` +
            `От: ${fromName} → К: ${toName}\n` +
            `Функции не связаны (глубина > 10)`,
          data: reachData,
        };
      }
    },
  },
  {
    id: 'q8',
    title: '🏆 Чемпионы вызовов',
    desc: 'Найди функции с наибольшим количеством вызовов',
    status: 'pending',
    action: async api => {
      const data = await api.getStats();
      const mostCalled = data.mostCalled || [];
      if (mostCalled.length > 0) {
        const top = mostCalled
          .map((f, i) => `  ${i + 1}. ${f.function?.name || f.id} - ${f.calls} вызовов`)
          .join('\n');
        return {
          success: true,
          message:
            `🏆 Топ-10 самых вызываемых функций:\n\n${top}\n\n` +
            `💡 Совет: Эти функции - ядро проекта. Следите за их изменениями.`,
          data: mostCalled,
        };
      } else {
        return {
          success: false,
          message: `❌ Вызовы не найдены`,
        };
      }
    },
  },
  {
    id: 'q9',
    title: '📁 Древо файлов',
    desc: 'Изучи структуру файлов проекта',
    status: 'pending',
    action: async api => {
      const data = await api.getFiles();
      if (data.files && data.files.length > 0) {
        const files = data.files
          .map((f, i) => `  ${i + 1}. ${f.path} (${f.extension || 'no ext'})`)
          .join('\n');
        const extStats = data.files.reduce((acc, f) => {
          const ext = f.extension || 'unknown';
          acc[ext] = (acc[ext] || 0) + 1;
          return acc;
        }, {});
        return {
          success: true,
          message:
            `📁 Найдено ${data.total} файлов:\n\n${files}\n\n` +
            `📊 Расширения:\n${Object.entries(extStats)
              .map(([ext, count]) => `  • ${ext}: ${count}`)
              .join('\n')}`,
          data: data.files,
        };
      } else {
        return {
          success: true,
          message: `📁 Файлы не найдены`,
        };
      }
    },
  },
  {
    id: 'q10',
    title: '🔮 Пророчество констант',
    desc: 'Найди все константы в проекте',
    status: 'pending',
    action: async api => {
      const data = await api.getConstants();
      if (data.constants && data.constants.length > 0) {
        const consts = data.constants
          .map((c, i) => `  ${i + 1}. ${c.name} = ${JSON.stringify(c.value)} (${c.module})`)
          .join('\n');
        return {
          success: true,
          message: `🔮 Найдено ${data.total} констант:\n\n${consts}`,
          data: data.constants,
        };
      } else {
        return {
          success: true,
          message: `🔮 Константы не найдены`,
        };
      }
    },
  },
];

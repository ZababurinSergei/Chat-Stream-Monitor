// interface-parser.js
import fs from 'fs';
import path from 'path';
import markdown from 'markdown-wasm';

// Инициализация markdown-wasm
await markdown.ready;

/**
 * Парсит INTERFACE.md и извлекает структурированную информацию
 * Полная тьюринг-модель для анализа Markdown документации
 */
export function parseInterfaceFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');

    // Парсим Markdown в HTML
    const html = markdown.parse(content);

    // Извлекаем все структуры из Markdown
    const commands = extractCommands(content);
    const sections = extractSections(content);
    const dependencies = extractDependencies(content);
    const buildInfo = extractBuildInfo(content);
    const metadata = extractMetadata(content);
    const httpEndpoints = extractHttpEndpoints(content);
    const codeBlocks = extractAllCodeBlocks(content);
    const tables = extractTables(content);
    const links = extractLinks(content);

    return {
        metadata,
        commands,
        sections,
        dependencies,
        buildInfo,
        httpEndpoints,
        codeBlocks,
        tables,
        links,
        raw: content,
        html,
        summary: {
            totalCommands: commands.length,
            totalSections: sections.length,
            totalCodeBlocks: codeBlocks.length,
            totalTables: tables.length,
            totalLinks: links.length,
            totalHttpEndpoints: httpEndpoints.length,
            hasDependencies: dependencies.required.length > 0 || dependencies.optional.length > 0,
            hasBuildInfo: buildInfo.commands.length > 0
        }
    };
}

// ============================================
// 1. ИЗВЛЕЧЕНИЕ МЕТАДАННЫХ
// ============================================
function extractMetadata(content) {
    const metadata = {
        title: '',
        description: '',
        version: '',
        author: '',
        license: '',
        createdAt: '',
        updatedAt: '',
        tags: []
    };

    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Заголовок (# Заголовок)
        const titleMatch = trimmed.match(/^#\s+(.+)/);
        if (titleMatch && !metadata.title) {
            metadata.title = titleMatch[1].trim();
        }

        // Версия
        const versionMatch = trimmed.match(/[Vv]ersion\s*[:.]?\s*([\d.]+)/);
        if (versionMatch) {
            metadata.version = versionMatch[1];
        }

        // Автор
        const authorMatch = trimmed.match(/[Aa]uthor\s*[:.]?\s*(.+)/);
        if (authorMatch) {
            metadata.author = authorMatch[1].trim();
        }

        // Лицензия
        const licenseMatch = trimmed.match(/[Ll]icense\s*[:.]?\s*(.+)/);
        if (licenseMatch) {
            metadata.license = licenseMatch[1].trim();
        }

        // Теги
        const tagsMatch = trimmed.match(/[Tt]ags?\s*[:.]?\s*(.+)/);
        if (tagsMatch) {
            metadata.tags = tagsMatch[1].split(',').map(t => t.trim());
        }

        // Дата создания
        const createdMatch = trimmed.match(/[Cc]reated\s*[:.]?\s*(.+)/);
        if (createdMatch) {
            metadata.createdAt = createdMatch[1].trim();
        }

        // Дата обновления
        const updatedMatch = trimmed.match(/[Uu]pdated\s*[:.]?\s*(.+)/);
        if (updatedMatch) {
            metadata.updatedAt = updatedMatch[1].trim();
        }

        // Описание (после заголовка)
        if (trimmed && !trimmed.startsWith('#') && !metadata.description) {
            const descMatch = trimmed.match(/^(.{50,})/);
            if (descMatch) {
                metadata.description = descMatch[1].trim();
            }
        }
    }

    return metadata;
}

// ============================================
// 2. ИЗВЛЕЧЕНИЕ КОМАНД (ПОЛНАЯ МОДЕЛЬ)
// ============================================
function extractCommands(content) {
    const commands = [];
    const lines = content.split('\n');

    let currentCommand = null;
    let inCommand = false;
    let descriptionBuffer = [];
    let currentSubcommand = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        // Ищем команды в формате:
        // ### Команда X: Название
        // ### X. Название
        // ## Команда X
        let cmdMatch = trimmed.match(/^###\s*Команда\s*(\d+)\s*[:.]\s*(.+)/);
        if (!cmdMatch) {
            cmdMatch = trimmed.match(/^###\s*(\d+)\.\s*(.+)/);
        }
        if (!cmdMatch) {
            cmdMatch = trimmed.match(/^##\s*Команда\s*(\d+)\s*[:.]\s*(.+)/);
        }

        if (cmdMatch) {
            // Сохраняем предыдущую команду
            if (currentCommand) {
                currentCommand.description = descriptionBuffer.join('\n').trim();
                currentCommand.subcommands = currentCommand.subcommands || [];
                commands.push(currentCommand);
            }

            // Создаем новую команду
            currentCommand = {
                id: parseInt(cmdMatch[1]),
                name: cmdMatch[2].trim(),
                description: '',
                fullDescription: [],
                examples: [],
                options: [],
                arguments: [],
                type: detectCommandType(cmdMatch[2]),
                httpRequests: [],
                subcommands: [],
                dependencies: [],
                relatedCommands: [],
                tags: [],
                complexity: 'medium',
                isRequired: false,
                isDeprecated: false,
                since: '',
                deprecatedSince: '',
                replacement: ''
            };
            descriptionBuffer = [];
            inCommand = true;
            currentSubcommand = null;
            continue;
        }

        // Ищем подкоманды (#### Название)
        if (inCommand && trimmed.match(/^####\s*(.+)/)) {
            const subMatch = trimmed.match(/^####\s*(.+)/);
            if (subMatch) {
                currentSubcommand = {
                    name: subMatch[1].trim(),
                    description: [],
                    examples: [],
                    options: [],
                    arguments: []
                };
                currentCommand.subcommands.push(currentSubcommand);
            }
            continue;
        }

        // Собираем содержимое команды
        if (inCommand && currentCommand) {
            // Блоки кода
            if (trimmed.startsWith('```')) {
                const codeBlock = extractCodeBlock(lines, i);
                if (codeBlock) {
                    const example = {
                        code: codeBlock.code,
                        language: codeBlock.language,
                        description: descriptionBuffer.join('\n').trim(),
                        type: detectCodeBlockType(codeBlock.code)
                    };
                    currentCommand.examples.push(example);

                    // Добавляем в подкоманду если есть
                    if (currentSubcommand) {
                        currentSubcommand.examples.push(example);
                    }

                    descriptionBuffer = [];
                    i = codeBlock.endIndex;
                    continue;
                }
            }

            // HTTP запросы
            const httpMatch = trimmed.match(/^(POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(http[^\s]+)/);
            if (httpMatch) {
                const httpReq = {
                    method: httpMatch[1],
                    url: httpMatch[2],
                    full: trimmed,
                    headers: extractHttpHeaders(content, i),
                    body: extractHttpBody(content, i)
                };
                currentCommand.httpRequests.push(httpReq);
                continue;
            }

            // Опции (-f, --flag)
            const optMatch = trimmed.match(/^-{1,2}([a-zA-Z0-9-]+)\s+(.+)/);
            if (optMatch) {
                const option = {
                    flag: optMatch[1],
                    description: optMatch[2].trim(),
                    type: detectOptionType(optMatch[1])
                };
                currentCommand.options.push(option);
                if (currentSubcommand) {
                    currentSubcommand.options.push(option);
                }
                continue;
            }

            // Аргументы (<arg>)
            const argMatch = trimmed.match(/<([^>]+)>\s+(.+)/);
            if (argMatch) {
                const arg = {
                    name: argMatch[1],
                    description: argMatch[2].trim(),
                    required: trimmed.includes('required') || trimmed.includes('обязателен'),
                    type: detectArgumentType(argMatch[1])
                };
                currentCommand.arguments.push(arg);
                if (currentSubcommand) {
                    currentSubcommand.arguments.push(arg);
                }
                continue;
            }

            // Зависимости
            const depMatch = trimmed.match(/[Dd]epends\s*[:.]?\s*(.+)/);
            if (depMatch) {
                currentCommand.dependencies = depMatch[1].split(',').map(d => d.trim());
                continue;
            }

            // Теги
            const tagMatch = trimmed.match(/[Tt]ags?\s*[:.]?\s*(.+)/);
            if (tagMatch) {
                currentCommand.tags = tagMatch[1].split(',').map(t => t.trim());
                continue;
            }

            // Сложность
            const complexityMatch = trimmed.match(/[Cc]omplexity\s*[:.]?\s*(low|medium|high|easy|hard)/i);
            if (complexityMatch) {
                currentCommand.complexity = complexityMatch[1].toLowerCase();
                continue;
            }

            // Deprecated
            if (trimmed.toLowerCase().includes('deprecated')) {
                currentCommand.isDeprecated = true;
                const sinceMatch = trimmed.match(/since\s+([\d.]+)/);
                if (sinceMatch) {
                    currentCommand.deprecatedSince = sinceMatch[1];
                }
                const replaceMatch = trimmed.match(/use\s+([^\s]+)/);
                if (replaceMatch) {
                    currentCommand.replacement = replaceMatch[1];
                }
                continue;
            }

            // Since
            const sinceMatch = trimmed.match(/[Ss]ince\s*[:.]?\s*([\d.]+)/);
            if (sinceMatch) {
                currentCommand.since = sinceMatch[1];
                continue;
            }

            // Required
            if (trimmed.toLowerCase().includes('required')) {
                currentCommand.isRequired = true;
                continue;
            }

            // Собираем описание
            if (trimmed && !trimmed.startsWith('#')) {
                descriptionBuffer.push(trimmed);
                if (currentSubcommand) {
                    currentSubcommand.description.push(trimmed);
                }
            }
        }
    }

    // Добавляем последнюю команду
    if (currentCommand) {
        currentCommand.description = descriptionBuffer.join('\n').trim();
        currentCommand.subcommands = currentCommand.subcommands || [];
        commands.push(currentCommand);
    }

    // Дополнительно ищем HTTP запросы в описаниях команд
    commands.forEach(cmd => {
        if (cmd.description) {
            const httpMatches = cmd.description.match(/(POST|GET|PUT|DELETE|PATCH)\s+(http[^\s]+)/g);
            if (httpMatches) {
                httpMatches.forEach(match => {
                    const parts = match.split(' ');
                    cmd.httpRequests.push({
                        method: parts[0],
                        url: parts[1] || '',
                        full: match
                    });
                });
            }
        }
    });

    console.log(`✅ Найдено ${commands.length} команд`);
    return commands;
}

// ============================================
// 3. ИЗВЛЕЧЕНИЕ СЕКЦИЙ (ПОЛНАЯ МОДЕЛЬ)
// ============================================
function extractSections(content) {
    const sections = [];
    const lines = content.split('\n');
    let currentSection = null;
    let sectionBuffer = [];
    let subsectionBuffer = [];
    let currentSubsection = null;

    for (const line of lines) {
        const trimmed = line.trim();

        // Ищем заголовки ##
        const sectionMatch = trimmed.match(/^##\s+(.+)/);
        if (sectionMatch) {
            if (currentSection) {
                currentSection.content = sectionBuffer.join('\n').trim();
                sections.push(currentSection);
            }
            currentSection = {
                title: sectionMatch[1].trim(),
                level: 2,
                content: '',
                subsections: [],
                id: generateId(sectionMatch[1]),
                type: detectSectionType(sectionMatch[1])
            };
            sectionBuffer = [];
            currentSubsection = null;
            continue;
        }

        // Ищем подсекции ###
        const subMatch = trimmed.match(/^###\s+(.+)/);
        if (subMatch && currentSection) {
            if (currentSubsection) {
                currentSubsection.content = subsectionBuffer.join('\n').trim();
                currentSection.subsections.push(currentSubsection);
            }
            currentSubsection = {
                title: subMatch[1].trim(),
                level: 3,
                content: '',
                id: generateId(subMatch[1])
            };
            subsectionBuffer = [];
            continue;
        }

        if (currentSection) {
            if (currentSubsection) {
                subsectionBuffer.push(trimmed);
            } else {
                sectionBuffer.push(trimmed);
            }
        }
    }

    if (currentSection) {
        currentSection.content = sectionBuffer.join('\n').trim();
        if (currentSubsection) {
            currentSubsection.content = subsectionBuffer.join('\n').trim();
            currentSection.subsections.push(currentSubsection);
        }
        sections.push(currentSection);
    }

    return sections;
}

// ============================================
// 4. ИЗВЛЕЧЕНИЕ ЗАВИСИМОСТЕЙ (ПОЛНАЯ МОДЕЛЬ)
// ============================================
function extractDependencies(content) {
    const dependencies = {
        required: [],
        optional: [],
        recommended: [],
        conflicts: [],
        commands: [],
        versions: {}
    };

    const lines = content.split('\n');
    let currentSection = null;
    let inDeps = false;

    for (const line of lines) {
        const trimmed = line.trim();

        if (trimmed.includes('Зависимости') || trimmed.includes('Dependencies')) {
            inDeps = true;
            continue;
        }

        if (inDeps) {
            // Обязательные
            if (trimmed.includes('Обязательные') || trimmed.includes('Required')) {
                currentSection = 'required';
                continue;
            }

            // Опциональные
            if (trimmed.includes('Опциональные') || trimmed.includes('Optional')) {
                currentSection = 'optional';
                continue;
            }

            // Рекомендуемые
            if (trimmed.includes('Рекомендуемые') || trimmed.includes('Recommended')) {
                currentSection = 'recommended';
                continue;
            }

            // Конфликты
            if (trimmed.includes('Конфликты') || trimmed.includes('Conflicts')) {
                currentSection = 'conflicts';
                continue;
            }

            // Команды для установки
            if (trimmed.includes('Команды') || trimmed.includes('Commands')) {
                currentSection = 'commands';
                continue;
            }

            // Извлекаем зависимости
            if (currentSection && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
                const depMatch = trimmed.match(/^[*-]\s*(.+)/);
                if (depMatch) {
                    const depName = depMatch[1].trim();
                    const versionMatch = depName.match(/(.+?)\s*[:=]\s*([\d.]+)/);
                    if (versionMatch) {
                        dependencies.versions[versionMatch[1]] = versionMatch[2];
                    }

                    switch (currentSection) {
                        case 'required':
                            dependencies.required.push(depName);
                            break;
                        case 'optional':
                            dependencies.optional.push(depName);
                            break;
                        case 'recommended':
                            dependencies.recommended.push(depName);
                            break;
                        case 'conflicts':
                            dependencies.conflicts.push(depName);
                            break;
                        case 'commands':
                            dependencies.commands.push(depName);
                            break;
                    }
                }
            }

            // Выход из секции зависимостей
            if (trimmed.match(/^##\s+/)) {
                inDeps = false;
                currentSection = null;
            }
        }
    }

    return dependencies;
}

// ============================================
// 5. ИЗВЛЕЧЕНИЕ ИНФОРМАЦИИ О СБОРКЕ (ПОЛНАЯ МОДЕЛЬ)
// ============================================
function extractBuildInfo(content) {
    const buildInfo = {
        commands: [],
        options: [],
        targets: [],
        dependencies: [],
        steps: [],
        configurations: {},
        requirements: [],
        tools: []
    };

    const lines = content.split('\n');
    let inBuild = false;
    let currentSection = null;
    let currentTarget = null;
    let currentStep = null;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.includes('Сборка проекта') || trimmed.includes('Build')) {
            inBuild = true;
            continue;
        }

        if (inBuild) {
            // Команды сборки
            if (trimmed.match(/^```bash/)) {
                const codeBlock = extractCodeBlock(lines, i);
                if (codeBlock) {
                    buildInfo.commands.push({
                        type: 'bash',
                        code: codeBlock.code,
                        description: currentStep ? currentStep.name : 'Команда сборки',
                        step: currentStep ? currentStep.name : null,
                        target: currentTarget ? currentTarget.name : null
                    });
                    i = codeBlock.endIndex;
                    continue;
                }
            }

            // Опции
            const optMatch = trimmed.match(/^-{1,2}([a-zA-Z0-9-]+)\s+(.+)/);
            if (optMatch) {
                buildInfo.options.push({
                    flag: optMatch[1],
                    description: optMatch[2].trim(),
                    type: detectOptionType(optMatch[1])
                });
                continue;
            }

            // Цели
            const targetMatch = trimmed.match(/^###\s+([\w-]+)/);
            if (targetMatch) {
                currentTarget = {
                    name: targetMatch[1].trim(),
                    description: [],
                    steps: [],
                    commands: []
                };
                buildInfo.targets.push(currentTarget);
                currentSection = 'target';
                continue;
            }

            // Шаги
            const stepMatch = trimmed.match(/^####\s+([\w-]+)/);
            if (stepMatch && currentTarget) {
                currentStep = {
                    name: stepMatch[1].trim(),
                    description: [],
                    commands: []
                };
                currentTarget.steps.push(currentStep);
                continue;
            }

            // Требования
            const reqMatch = trimmed.match(/^[Tt]ребования\s*[:.]?\s*(.+)/);
            if (reqMatch) {
                buildInfo.requirements = reqMatch[1].split(',').map(r => r.trim());
                continue;
            }

            // Инструменты
            const toolMatch = trimmed.match(/^[Ii]нструменты\s*[:.]?\s*(.+)/);
            if (toolMatch) {
                buildInfo.tools = toolMatch[1].split(',').map(t => t.trim());
                continue;
            }

            // Конфигурации
            const configMatch = trimmed.match(/^([\w-]+)\s*[:=]\s*(.+)/);
            if (configMatch) {
                buildInfo.configurations[configMatch[1]] = configMatch[2].trim();
                continue;
            }

            // Собираем описания
            if (currentSection === 'target' && currentTarget && trimmed && !trimmed.startsWith('#')) {
                if (currentStep) {
                    if (!trimmed.startsWith('```')) {
                        currentStep.description.push(trimmed);
                    }
                } else {
                    currentTarget.description.push(trimmed);
                }
            }
        }
    }

    return buildInfo;
}

// ============================================
// 6. ИЗВЛЕЧЕНИЕ HTTP ENDPOINTS
// ============================================
function extractHttpEndpoints(content) {
    const endpoints = [];
    const lines = content.split('\n');
    let currentEndpoint = null;

    for (const line of lines) {
        const trimmed = line.trim();

        // Ищем HTTP запросы
        const httpMatch = trimmed.match(/^(POST|GET|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+(http[^\s]+)/);
        if (httpMatch) {
            if (currentEndpoint) {
                endpoints.push(currentEndpoint);
            }
            currentEndpoint = {
                method: httpMatch[1],
                url: httpMatch[2],
                headers: [],
                body: null,
                description: '',
                response: null,
                auth: null
            };
            continue;
        }

        // Заголовки
        const headerMatch = trimmed.match(/^([^:]+)\s*:\s*(.+)/);
        if (headerMatch && currentEndpoint) {
            currentEndpoint.headers.push({
                key: headerMatch[1].trim(),
                value: headerMatch[2].trim()
            });
            continue;
        }

        // Тело запроса (JSON)
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            if (currentEndpoint) {
                try {
                    currentEndpoint.body = JSON.parse(trimmed);
                } catch (e) {
                    currentEndpoint.body = trimmed;
                }
            }
            continue;
        }

        // Описание
        if (currentEndpoint && trimmed && !trimmed.startsWith('#') && !trimmed.startsWith('```')) {
            if (!currentEndpoint.description) {
                currentEndpoint.description = trimmed;
            }
        }
    }

    if (currentEndpoint) {
        endpoints.push(currentEndpoint);
    }

    return endpoints;
}

// ============================================
// 7. ИЗВЛЕЧЕНИЕ ВСЕХ БЛОКОВ КОДА
// ============================================
function extractAllCodeBlocks(content) {
    const codeBlocks = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (trimmed.startsWith('```')) {
            const block = extractCodeBlock(lines, i);
            if (block) {
                codeBlocks.push({
                    ...block,
                    lineNumber: i,
                    type: detectCodeBlockType(block.code)
                });
                i = block.endIndex;
            }
        }
    }

    return codeBlocks;
}

// ============================================
// 8. ИЗВЛЕЧЕНИЕ ТАБЛИЦ
// ============================================
function extractTables(content) {
    const tables = [];
    const lines = content.split('\n');
    let inTable = false;
    let currentTable = null;
    let tableBuffer = [];

    for (const line of lines) {
        const trimmed = line.trim();

        // Проверяем начало таблицы (строки с |)
        if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
            if (!inTable) {
                inTable = true;
                currentTable = {
                    headers: [],
                    rows: [],
                    alignment: [],
                    raw: []
                };
                tableBuffer = [];
            }
            tableBuffer.push(trimmed);

            // Проверяем заголовок
            const cells = trimmed.split('|').filter(c => c.trim());
            if (cells.length > 0) {
                // Проверяем на разделитель (---)
                if (cells.every(c => c.trim().match(/^[-:]+$/))) {
                    currentTable.alignment = cells.map(c => {
                        if (c.trim().startsWith(':') && c.trim().endsWith(':')) return 'center';
                        if (c.trim().endsWith(':')) return 'right';
                        if (c.trim().startsWith(':')) return 'left';
                        return 'left';
                    });
                } else if (currentTable.headers.length === 0) {
                    currentTable.headers = cells.map(c => c.trim());
                } else {
                    currentTable.rows.push(cells.map(c => c.trim()));
                }
            }
            continue;
        }

        // Завершение таблицы
        if (inTable && trimmed !== '' && !trimmed.startsWith('|')) {
            inTable = false;
            currentTable.raw = tableBuffer.join('\n');
            tables.push(currentTable);
            currentTable = null;
        }
    }

    // Добавляем последнюю таблицу
    if (inTable && currentTable) {
        currentTable.raw = tableBuffer.join('\n');
        tables.push(currentTable);
    }

    return tables;
}

// ============================================
// 9. ИЗВЛЕЧЕНИЕ ССЫЛОК
// ============================================
function extractLinks(content) {
    const links = [];
    const lines = content.split('\n');

    for (const line of lines) {
        const trimmed = line.trim();

        // Ищем ссылки в формате [text](url)
        const linkMatches = trimmed.match(/\[([^\]]+)\]\(([^)]+)\)/g);
        if (linkMatches) {
            linkMatches.forEach(match => {
                const textMatch = match.match(/\[([^\]]+)\]/);
                const urlMatch = match.match(/\(([^)]+)\)/);
                if (textMatch && urlMatch) {
                    links.push({
                        text: textMatch[1],
                        url: urlMatch[1],
                        line: trimmed,
                        type: detectLinkType(urlMatch[1])
                    });
                }
            });
        }

        // Ищем ссылки в формате <url>
        const urlMatches = trimmed.match(/<https?:\/\/[^>]+>/g);
        if (urlMatches) {
            urlMatches.forEach(match => {
                links.push({
                    text: match,
                    url: match.replace(/[<>]/g, ''),
                    line: trimmed,
                    type: 'url'
                });
            });
        }
    }

    return links;
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================

function extractCodeBlock(lines, startIndex) {
    const startLine = lines[startIndex];
    const language = startLine.replace('```', '').trim();
    const codeLines = [];
    let endIndex = startIndex + 1;

    for (let i = startIndex + 1; i < lines.length; i++) {
        if (lines[i].trim() === '```') {
            endIndex = i;
            break;
        }
        codeLines.push(lines[i]);
    }

    return {
        language: language || 'bash',
        code: codeLines.join('\n'),
        endIndex
    };
}

function extractHttpHeaders(content, startIndex) {
    const headers = {};
    const lines = content.split('\n');

    for (let i = startIndex + 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed) break;
        const headerMatch = trimmed.match(/^([^:]+)\s*:\s*(.+)/);
        if (headerMatch) {
            headers[headerMatch[1].trim()] = headerMatch[2].trim();
        } else {
            break;
        }
    }

    return headers;
}

function extractHttpBody(content, startIndex) {
    const lines = content.split('\n');
    let body = '';
    let foundBody = false;

    for (let i = startIndex + 1; i < lines.length; i++) {
        const trimmed = lines[i].trim();
        if (!trimmed && !foundBody) continue;
        if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            foundBody = true;
            body += lines[i] + '\n';
        } else if (foundBody) {
            body += lines[i] + '\n';
        } else {
            break;
        }
    }

    return body.trim();
}

function detectCommandType(name) {
    const lower = name.toLowerCase();
    if (lower.includes('тест') || lower.includes('test')) return 'test';
    if (lower.includes('сборк') || lower.includes('build')) return 'build';
    if (lower.includes('запуск') || lower.includes('run')) return 'run';
    if (lower.includes('установк') || lower.includes('install')) return 'install';
    if (lower.includes('очистк') || lower.includes('clean')) return 'clean';
    if (lower.includes('отладк') || lower.includes('debug')) return 'debug';
    if (lower.includes('конфиг') || lower.includes('config')) return 'config';
    if (lower.includes('помощ') || lower.includes('help')) return 'help';
    if (lower.includes('опци') || lower.includes('option')) return 'option';
    if (lower.includes('зависим') || lower.includes('dependency')) return 'dependency';
    if (lower.includes('http') || lower.includes('api')) return 'http';
    if (lower.includes('git') || lower.includes('clone')) return 'git';
    if (lower.includes('проверк') || lower.includes('check')) return 'check';
    if (lower.includes('загрузк') || lower.includes('download')) return 'download';
    if (lower.includes('компиляц') || lower.includes('compile')) return 'compile';
    if (lower.includes('линковк') || lower.includes('link')) return 'link';
    if (lower.includes('документ') || lower.includes('doc')) return 'documentation';
    if (lower.includes('профилир') || lower.includes('profile')) return 'profile';
    return 'command';
}

function detectOptionType(flag) {
    if (flag.length === 1) return 'short';
    if (flag.startsWith('no-')) return 'negation';
    return 'long';
}

function detectArgumentType(name) {
    const lower = name.toLowerCase();
    if (lower.includes('path') || lower.includes('dir') || lower.includes('file')) return 'path';
    if (lower.includes('url') || lower.includes('host') || lower.includes('port')) return 'network';
    if (lower.includes('id') || lower.includes('num') || lower.includes('count')) return 'number';
    if (lower.includes('flag') || lower.includes('bool') || lower.includes('enable')) return 'boolean';
    if (lower.includes('key') || lower.includes('token') || lower.includes('secret')) return 'secret';
    if (lower.includes('name') || lower.includes('label') || lower.includes('title')) return 'string';
    return 'string';
}

function detectCodeBlockType(code) {
    if (code.includes('curl') || code.includes('http')) return 'http';
    if (code.includes('gcc') || code.includes('make') || code.includes('cmake')) return 'build';
    if (code.includes('sudo') || code.includes('apt') || code.includes('install')) return 'install';
    if (code.includes('git') || code.includes('clone')) return 'git';
    if (code.includes('npm') || code.includes('node')) return 'node';
    if (code.includes('python') || code.includes('pip')) return 'python';
    if (code.includes('docker') || code.includes('container')) return 'docker';
    if (code.includes('gdb') || code.includes('valgrind')) return 'debug';
    return 'command';
}

function detectLinkType(url) {
    if (url.includes('github.com')) return 'github';
    if (url.includes('docs') || url.includes('documentation')) return 'docs';
    if (url.includes('api')) return 'api';
    if (url.includes('http') || url.includes('https')) return 'external';
    if (url.startsWith('#')) return 'anchor';
    return 'internal';
}

function detectSectionType(title) {
    const lower = title.toLowerCase();
    if (lower.includes('быстрый старт') || lower.includes('quick start')) return 'quickstart';
    if (lower.includes('установк') || lower.includes('install')) return 'install';
    if (lower.includes('сборк') || lower.includes('build')) return 'build';
    if (lower.includes('команд') || lower.includes('commands')) return 'commands';
    if (lower.includes('конфиг') || lower.includes('config')) return 'config';
    if (lower.includes('тест') || lower.includes('test')) return 'test';
    if (lower.includes('отладк') || lower.includes('debug')) return 'debug';
    if (lower.includes('очистк') || lower.includes('clean')) return 'clean';
    if (lower.includes('зависим') || lower.includes('dependencies')) return 'dependencies';
    if (lower.includes('пример') || lower.includes('example')) return 'examples';
    return 'general';
}

function generateId(title) {
    return title
        .toLowerCase()
        .replace(/[^a-zа-я0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 50);
}

// ============================================
// 10. ВАЛИДАЦИЯ КОМАНД С HTTP
// ============================================
export function validateWithHttp(interfaceCommands, httpRequests) {
    const validation = {
        matched: [],
        missing: [],
        extra: [],
        summary: {
            total: interfaceCommands.length,
            matched: 0,
            missing: 0,
            extra: 0
        }
    };

    interfaceCommands.forEach(cmd => {
        const matched = httpRequests.find(req => {
            // Проверяем по HTTP запросам в команде
            if (cmd.httpRequests && cmd.httpRequests.length > 0) {
                return cmd.httpRequests.some(httpReq =>
                    req.url && httpReq.url && req.url.includes(httpReq.url) ||
                    req.method === httpReq.method
                );
            }

            // Проверяем по названию команды
            const cmdName = cmd.name.toLowerCase();
            const reqDesc = req.description ? req.description.toLowerCase() : '';

            // Проверяем по API полю
            let apiMatch = false;
            if (req.body) {
                try {
                    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
                    if (body.api) {
                        const api = body.api.toLowerCase();
                        const cmdApi = cmd.name.toLowerCase().replace(/[^a-zA-Z0-9]/g, '');
                        apiMatch = api.includes(cmdApi) || cmdApi.includes(api.split('/').pop());
                    }
                } catch (e) {}
            }

            // Проверяем по URL
            const urlMatch = req.url && cmd.description &&
                cmd.description.toLowerCase().includes(req.url.toLowerCase());

            return apiMatch || urlMatch || cmdName.includes(reqDesc);
        });

        if (matched) {
            validation.matched.push({
                command: cmd,
                request: matched
            });
            validation.summary.matched++;
        } else {
            validation.missing.push(cmd);
            validation.summary.missing++;
        }
    });

    httpRequests.forEach(req => {
        const isMatched = validation.matched.some(m => m.request === req);
        if (!isMatched) {
            validation.extra.push(req);
            validation.summary.extra++;
        }
    });

    return validation;
}

// ============================================
// ЭКСПОРТЫ
// ============================================
export default {
    parseInterfaceFile,
    extractCommands,
    extractSections,
    extractDependencies,
    extractBuildInfo,
    extractMetadata,
    extractHttpEndpoints,
    extractAllCodeBlocks,
    extractTables,
    extractLinks,
    extractCodeBlock,
    validateWithHttp,
    detectCommandType,
    detectOptionType,
    detectArgumentType,
    detectCodeBlockType,
    detectLinkType,
    detectSectionType,
    generateId
};

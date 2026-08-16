#!/bin/bash

# ============================================================================
# Переменные
# ============================================================================

PROJECT_DIR="/home/sergei/Desktop/system/packages/mtproto-mqtt"
PATCH_SOURCE="./apply/fix_connect_options_v2.patch"
PATCH_TARGET="./apply/true/full_init_connect.patch"
TARGET_FILE="./src/mesh-mqtt.c"

# ============================================================================
# Функции
# ============================================================================

print_header() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  $1"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
}

print_success() {
    echo "✅ $1"
}

print_error() {
    echo "❌ $1"
}

print_info() {
    echo "ℹ️  $1"
}

# ============================================================================
# Проверка директорий
# ============================================================================

check_directories() {
    print_info "Проверка директорий..."

    # Проверяем, что мы в правильной директории
    if [ ! -d "$PROJECT_DIR" ]; then
        print_error "Директория проекта не найдена: $PROJECT_DIR"
        exit 1
    fi

    cd "$PROJECT_DIR" || exit 1
    print_success "Перешли в директорию проекта: $PROJECT_DIR"

    # Проверяем наличие src
    if [ ! -d "./src" ]; then
        print_error "Директория src не найдена!"
        exit 1
    fi

    # Создаем директорию apply если её нет
    if [ ! -d "./apply" ]; then
        print_info "Создаем директорию ./apply..."
        mkdir -p ./apply
        print_success "Директория ./apply создана"
    fi
}

# ============================================================================
# Проверка патча
# ============================================================================

check_patch() {
    print_info "Проверка патча..."

    # Проверяем исходный патч
    if [ -f "$PATCH_SOURCE" ]; then
        print_success "Найден исходный патч: $PATCH_SOURCE"
    else
        print_error "Исходный патч не найден: $PATCH_SOURCE"
        print_info "Поиск патча в других местах..."

        # Ищем патч в разных местах
        if [ -f "./full_init_connect.patch" ]; then
            PATCH_SOURCE="./full_init_connect.patch"
            print_success "Найден патч в корне: $PATCH_SOURCE"
        elif [ -f "/tmp/full_init_connect.patch" ]; then
            PATCH_SOURCE="/tmp/full_init_connect.patch"
            print_success "Найден патч в /tmp: $PATCH_SOURCE"
        else
            print_error "Патч не найден!"
            exit 1
        fi
    fi
}

# ============================================================================
# Перемещение патча
# ============================================================================

move_patch() {
    print_info "Перемещение патча..."

    # Копируем патч в директорию apply
    if cp "$PATCH_SOURCE" "$PATCH_TARGET" 2>/dev/null; then
        print_success "Патч скопирован: $PATCH_SOURCE → $PATCH_TARGET"
    else
        print_error "Не удалось скопировать патч!"
        print_info "Пробуем переместить..."

        if mv "$PATCH_SOURCE" "$PATCH_TARGET" 2>/dev/null; then
            print_success "Патч перемещен: $PATCH_SOURCE → $PATCH_TARGET"
        else
            print_error "Не удалось переместить патч!"
            exit 1
        fi
    fi

    # Проверяем, что патч скопировался
    if [ -f "$PATCH_TARGET" ]; then
        print_success "Патч успешно размещен в ./apply/"
        ls -la "$PATCH_TARGET"
    else
        print_error "Патч не найден в ./apply/"
        exit 1
    fi
}

# ============================================================================
# Применение патча
# ============================================================================

apply_patch() {
    print_info "Применение патча..."

    # Проверяем целевой файл
    if [ ! -f "$TARGET_FILE" ]; then
        print_error "Целевой файл не найден: $TARGET_FILE"
        exit 1
    fi

    # Создаем бэкап
    BACKUP_FILE="${TARGET_FILE}.backup_$(date +%Y%m%d_%H%M%S)"
    cp "$TARGET_FILE" "$BACKUP_FILE"
    print_success "Создан бэкап: $BACKUP_FILE"

    # Применяем патч
    print_info "Применяем патч к $TARGET_FILE..."

    if patch -p1 < "$PATCH_TARGET" 2>&1; then
        print_success "Патч успешно применен!"
    else
        print_error "Ошибка при применении патча!"
        print_info "Восстанавливаем бэкап..."
        cp "$BACKUP_FILE" "$TARGET_FILE"
        print_success "Бэкап восстановлен"
        exit 1
    fi
}

# ============================================================================
# Проверка результата
# ============================================================================

check_result() {
    print_info "Проверка результата..."

    # Проверяем, что изменения применились
    if grep -q "strcpy(conn_opts.struct_id, \"MQTC\")" "$TARGET_FILE"; then
        print_success "Патч применен успешно!"
        print_info "Найдена строка: strcpy(conn_opts.struct_id, \"MQTC\")"
    elif grep -q "conn_opts.struct_id = \"MQTC\"" "$TARGET_FILE"; then
        print_info "Найдена старая строка, возможно патч не применился полностью"
        print_info "Пробуем исправить вручную..."

        # Исправляем вручную
        sed -i 's/conn_opts.struct_id = "MQTC";/strcpy(conn_opts.struct_id, "MQTC");/' "$TARGET_FILE"
        print_success "Исправление применено!"
    else
        print_warning "Изменения не найдены в файле"
        print_info "Проверьте файл вручную: $TARGET_FILE"
    fi
}

# ============================================================================
# Пересборка
# ============================================================================

rebuild() {
    print_info "Пересборка проекта..."

    if make clean 2>&1; then
        print_success "Очистка выполнена"
    else
        print_warning "Очистка не удалась, продолжаем..."
    fi

    if make 2>&1; then
        print_success "Сборка выполнена успешно!"
    else
        print_error "Ошибка при сборке!"
        exit 1
    fi
}

# ============================================================================
# Основная функция
# ============================================================================

main() {
    print_header "MTProto MQTT - Применение патча"

    check_directories
    check_patch
    move_patch
    apply_patch
    check_result

    # Спрашиваем про пересборку
    echo ""
    read -p "Выполнить пересборку? (y/N): " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        rebuild
    else
        print_info "Пересборка отложена"
        print_info "Для сборки выполните: make clean && make"
    fi

    print_header "Готово!"
    print_info "Патч: $PATCH_TARGET"
    print_info "Файл: $TARGET_FILE"
    print_info "Бэкап: $BACKUP_FILE"
}

# ============================================================================
# Запуск
# ============================================================================

# Проверяем права на выполнение
if [ "$EUID" -eq 0 ]; then
    print_error "Не запускайте скрипт от root!"
    exit 1
fi

# Запускаем основную функцию
main "$@"

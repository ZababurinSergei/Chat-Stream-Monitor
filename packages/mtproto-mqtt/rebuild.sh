#!/bin/bash
# ============================================================================
# rebuild.sh - Скрипт для пересборки MTProto MQTT Gateway
# ============================================================================

set -e  # Остановка при ошибке

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# ============================================================================
# Функции
# ============================================================================

print_header() {
    echo ""
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║  $1"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo ""
}

print_step() {
    echo -e "${CYAN}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# ============================================================================
# Проверка окружения
# ============================================================================

check_environment() {
    print_step "Checking environment..."

    # Проверка GCC
    if ! command -v gcc &> /dev/null; then
        print_error "GCC not found. Please install build-essential"
        exit 1
    fi
    print_success "GCC: $(gcc --version | head -1)"

    # Проверка Make
    if ! command -v make &> /dev/null; then
        print_error "Make not found. Please install make"
        exit 1
    fi
    print_success "Make: $(make --version | head -1)"

    # Проверка Paho MQTT
    if ldconfig -p 2>/dev/null | grep -q libpaho-mqtt3c; then
        print_success "Paho MQTT: found"
    else
        print_warning "Paho MQTT C library not found"
        print_info "Install with: sudo apt-get install libpaho-mqtt-dev"
    fi

    # Проверка OpenSSL
    if ldconfig -p 2>/dev/null | grep -q libssl; then
        print_success "OpenSSL: found"
    else
        print_warning "OpenSSL not found"
        print_info "Install with: sudo apt-get install libssl-dev"
    fi

    # Проверка liboqs (опционально)
    if ldconfig -p 2>/dev/null | grep -q liboqs; then
        print_success "liboqs: found (PQ crypto supported)"
    else
        print_warning "liboqs not found (PQ crypto disabled)"
        print_info "Install from: https://github.com/open-quantum-safe/liboqs"
        print_info "Or run: ./install-liboqs.sh"
    fi

    echo ""
}

# ============================================================================
# Создание директорий
# ============================================================================

create_directories() {
    print_step "Creating directories..."
    mkdir -p build bin logs config
    print_success "Directories created"
}

# ============================================================================
# Очистка
# ============================================================================

clean_build() {
    print_step "Cleaning previous build..."

    # Удаляем объектные файлы
    rm -rf build/*.o build/*.d 2>/dev/null || true

    # Удаляем старые логи сборки
    rm -f build.log build-debug.log 2>/dev/null || true

    print_success "Clean complete"
}

# ============================================================================
# Полная очистка
# ============================================================================

full_clean() {
    print_step "Full cleaning..."
    rm -rf build/* bin/* logs/* 2>/dev/null || true
    rm -f build.log build-debug.log 2>/dev/null || true
    print_success "Full clean complete"
}

# ============================================================================
# Проверка и установка зависимостей
# ============================================================================

check_dependencies() {
    print_step "Checking dependencies..."

    # Проверяем наличие заголовочных файлов Paho
    if [ ! -f /usr/include/MQTTClient.h ] && [ ! -f /usr/local/include/MQTTClient.h ]; then
        print_warning "MQTTClient.h not found in standard locations"
        print_info "Searching for MQTT headers..."
        find /usr -name "MQTTClient.h" 2>/dev/null | head -5 || echo "  Not found"
    else
        print_success "MQTT headers found"
    fi

    # Проверяем наличие библиотек
    echo "  Checking libraries:"
    for lib in paho-mqtt3c ssl crypto pthread m; do
        if ldconfig -p 2>/dev/null | grep -q "lib${lib}"; then
            echo "    ✅ lib${lib}"
        else
            echo "    ❌ lib${lib} not found"
        fi
    done

    echo ""
}

# ============================================================================
# Сборка
# ============================================================================

build_project() {
    print_step "Building project..."

    # Определяем флаги компиляции
    CFLAGS="-Wall -Wextra -O2 -g -D_GNU_SOURCE -std=c99"
    CFLAGS="$CFLAGS -DUSE_PAHO_MQTT"
    CFLAGS="$CFLAGS -DDEBUG -g3 -O0"
    CFLAGS="$CFLAGS -DLOG_LEVEL=LOG_LEVEL_DEBUG"
    CFLAGS="$CFLAGS -Isrc -Iinclude"

    # Добавляем пути к заголовкам
    if [ -d /usr/local/include ]; then
        CFLAGS="$CFLAGS -I/usr/local/include"
    fi

    if [ -d ../MTProxy/common ]; then
        CFLAGS="$CFLAGS -I../MTProxy/common"
    fi

    if [ -d ../MTProxy ]; then
        CFLAGS="$CFLAGS -I../MTProxy"
    fi

    # Флаги безопасности
    CFLAGS="$CFLAGS -fstack-protector-strong"
    CFLAGS="$CFLAGS -D_FORTIFY_SOURCE=2"
    CFLAGS="$CFLAGS -Wformat -Wformat-security"
    CFLAGS="$CFLAGS -fPIE -pie"
    CFLAGS="$CFLAGS -Wl,-z,stack-size=16777216"

    # Поиск liboqs
    if pkg-config --exists liboqs 2>/dev/null; then
        CFLAGS="$CFLAGS $(pkg-config --cflags liboqs)"
        LIBOQS_LDFLAGS="$(pkg-config --libs liboqs)"
        print_success "liboqs found via pkg-config"
    elif ldconfig -p 2>/dev/null | grep -q liboqs; then
        CFLAGS="$CFLAGS -I/usr/local/include/oqs"
        LIBOQS_LDFLAGS="-loqs"
        print_success "liboqs found in system"
    else
        LIBOQS_LDFLAGS=""
        print_warning "liboqs not found, PQ crypto disabled"
    fi

    # Флаги линковки
    LDFLAGS="-lpthread -lm -lpaho-mqtt3c -lssl -lcrypto"
    LDFLAGS="$LDFLAGS $LIBOQS_LDFLAGS"
    LDFLAGS="$LDFLAGS -Wl,-z,relro -Wl,-z,now"
    LDFLAGS="$LDFLAGS -Wl,-z,stack-size=16777216"

    # Добавляем пути к библиотекам
    if [ -d /usr/local/lib ]; then
        LDFLAGS="$LDFLAGS -L/usr/local/lib"
    fi

    echo "  CFLAGS: $CFLAGS"
    echo "  LDFLAGS: $LDFLAGS"
    echo ""

    # Получаем список исходных файлов
    SOURCES=$(find src -name "*.c" -type f 2>/dev/null | sort)
    if [ -z "$SOURCES" ]; then
        print_error "No source files found in src/"
        exit 1
    fi

    echo "  Source files:"
    for src in $SOURCES; do
        echo "    $src"
    done
    echo ""

    # Компиляция каждого файла
    OBJECTS=""
    for src in $SOURCES; do
        obj="build/$(basename ${src%.c}.o)"
        OBJECTS="$OBJECTS $obj"
        echo "  Compiling $src -> $obj"

        if ! gcc $CFLAGS -c "$src" -o "$obj" 2>> build.log; then
            print_error "Failed to compile $src"
            echo "  Check build.log for details"
            tail -20 build.log
            exit 1
        fi
    done

    echo ""
    print_success "All source files compiled"

    # Линковка
    echo "  Linking..."
    TARGET="bin/mtproto-mqtt-gateway"

    if ! gcc $CFLAGS -o "$TARGET" $OBJECTS $LDFLAGS 2>> build.log; then
        print_error "Failed to link $TARGET"
        echo "  Check build.log for details"
        tail -20 build.log
        exit 1
    fi

    print_success "Build complete"
}

# ============================================================================
# Проверка бинарника
# ============================================================================

check_binary() {
    print_step "Checking binary..."

    TARGET="bin/mtproto-mqtt-gateway"

    if [ ! -f "$TARGET" ]; then
        print_error "Binary not found!"
        ls -la bin/ 2>/dev/null || echo "  bin/ directory is empty"
        return 1
    fi

    print_success "Binary: $TARGET"
    print_info "Size: $(du -h $TARGET | cut -f1)"
    print_info "Type: $(file $TARGET | cut -d: -f2-)"

    # Проверка зависимостей
    print_step "Checking dependencies..."
    if ldd $TARGET 2>/dev/null | grep -q "not found"; then
        print_error "Missing dependencies:"
        ldd $TARGET 2>/dev/null | grep "not found" || echo "  None"
    else
        print_success "All dependencies satisfied"
        ldd $TARGET 2>/dev/null | head -10 || echo "  ldd not available"
    fi

    echo ""
}

# ============================================================================
# Тест подключения
# ============================================================================

test_connection() {
    print_step "Testing MQTT connection..."

    TARGET="bin/mtproto-mqtt-gateway"
    if [ ! -f "$TARGET" ]; then
        print_error "Binary not found for test"
        return 1
    fi

    echo ""
    echo "  Testing connection to OneMesh..."
    echo "  Broker: mqtt://mqtt.onemesh.ru:1883"
    echo "  User: onemeshd"
    echo ""

    # Увеличение стека для теста
    ulimit -s 32768 2>/dev/null || true
    echo "📊 Current stack limit: $(ulimit -s 2>/dev/null || echo 'unknown') MB"
    echo "✅ Stack limit increased to 32 MB"
    echo ""

    # Запуск теста с правильным протоколом
    if $TARGET --test-connect -b mqtt://mqtt.onemesh.ru:1883 2>&1; then
        print_success "Connection test passed!"
        return 0
    else
        local exit_code=$?
        print_error "Connection test failed with code: $exit_code"
        print_info "Check logs/ for more details"
        print_info "Run with GDB for debugging: gdb bin/mtproto-mqtt-gateway"
        return 1
    fi
}

# ============================================================================
# Запуск с GDB
# ============================================================================

run_gdb() {
    print_step "Running with GDB..."

    TARGET="bin/mtproto-mqtt-gateway"
    if [ ! -f "$TARGET" ]; then
        print_error "Binary not found"
        return 1
    fi

    echo ""
    echo "  Running: gdb $TARGET"
    echo "  Type 'run -c SPB -v' to start"
    echo "  Type 'bt' if crash occurs"
    echo "  Type 'quit' to exit"
    echo ""

    gdb $TARGET
}

# ============================================================================
# Запуск с Valgrind
# ============================================================================

run_valgrind() {
    print_step "Running with Valgrind..."

    if ! command -v valgrind &> /dev/null; then
        print_warning "Valgrind not installed"
        print_info "Install with: sudo apt-get install valgrind"
        return 1
    fi

    TARGET="bin/mtproto-mqtt-gateway"
    if [ ! -f "$TARGET" ]; then
        print_error "Binary not found"
        return 1
    fi

    mkdir -p logs

    echo ""
    echo "  Running Valgrind..."
    echo "  Log: logs/valgrind.log"
    echo ""

    valgrind --leak-check=full \
             --show-leak-kinds=all \
             --track-origins=yes \
             --verbose \
             --log-file=logs/valgrind.log \
             $TARGET -c SPB

    print_success "Valgrind done. Check logs/valgrind.log"
}

# ============================================================================
# Информация о проекте
# ============================================================================

show_info() {
    echo ""
    echo "═══════════════════════════════════════════════════════════════"
    echo "  MTProto MQTT Gateway v2.0"
    echo "  MTProto ↔ MQTT Mesh Gateway"
    echo "  ECDH + ML-KEM + ML-DSA (Quantum-Safe)"
    echo "═══════════════════════════════════════════════════════════════"
    echo ""
    echo "  📁 Project:  $PWD"
    echo "  📦 Binary:   ./bin/mtproto-mqtt-gateway"
    echo "  📚 Config:   config/"
    echo "  📝 Logs:     logs/"
    echo ""
    echo "  🚀 Run:      ./bin/mtproto-mqtt-gateway -c SPB -v"
    echo "  🔌 Test:     ./bin/mtproto-mqtt-gateway --test-connect"
    echo "  🔐 Crypto:   ./bin/mtproto-mqtt-gateway --check-pq"
    echo ""
}

# ============================================================================
# Показать помощь
# ============================================================================

show_help() {
    echo ""
    echo "Usage: ./rebuild.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --help      Show this help"
    echo "  -c, --clean     Clean build only"
    echo "  -d, --debug     Build with debug symbols"
    echo "  -t, --test      Build and test connection"
    echo "  -g, --gdb       Build and run with GDB"
    echo "  -v, --valgrind  Build and run with Valgrind"
    echo "  -i, --info      Show project info"
    echo "  -f, --full      Full clean and rebuild"
    echo "  --no-clean      Skip cleaning"
    echo "  --no-test       Skip connection test"
    echo ""
    echo "Examples:"
    echo "  ./rebuild.sh           # Full rebuild with test"
    echo "  ./rebuild.sh -d        # Debug build"
    echo "  ./rebuild.sh -t        # Build and test connection"
    echo "  ./rebuild.sh -g        # Build and run with GDB"
    echo "  ./rebuild.sh -v        # Build and run with Valgrind"
    echo "  ./rebuild.sh -f        # Full clean and rebuild"
    echo ""
}

# ============================================================================
# Основная функция
# ============================================================================

main() {
    # Парсинг аргументов
    DO_CLEAN=1
    DO_FULL_CLEAN=0
    DO_DEBUG=0
    DO_TEST=1
    DO_GDB=0
    DO_VALGRIND=0
    DO_INFO=0
    BUILD_ONLY=0

    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -c|--clean)
                DO_CLEAN=1
                DO_FULL_CLEAN=0
                DO_TEST=0
                shift
                ;;
            -f|--full)
                DO_FULL_CLEAN=1
                DO_CLEAN=1
                shift
                ;;
            -d|--debug)
                DO_DEBUG=1
                shift
                ;;
            -t|--test)
                DO_TEST=1
                shift
                ;;
            -g|--gdb)
                DO_GDB=1
                DO_DEBUG=1
                shift
                ;;
            -v|--valgrind)
                DO_VALGRIND=1
                DO_DEBUG=1
                shift
                ;;
            -i|--info)
                DO_INFO=1
                shift
                ;;
            --no-clean)
                DO_CLEAN=0
                shift
                ;;
            --no-test)
                DO_TEST=0
                shift
                ;;
            *)
                echo "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Показать информацию
    if [ $DO_INFO -eq 1 ]; then
        show_info
        exit 0
    fi

    # Заголовок
    print_header "MTProto MQTT Gateway - Rebuild Script"

    # Проверка окружения
    check_environment

    # Проверка зависимостей
    check_dependencies

    # Создание директорий
    create_directories

    # Полная очистка
    if [ $DO_FULL_CLEAN -eq 1 ]; then
        full_clean
    fi

    # Очистка
    if [ $DO_CLEAN -eq 1 ]; then
        clean_build
    fi

    # Сборка
    if [ $DO_DEBUG -eq 1 ]; then
        build_project
    else
        build_project
    fi

    # Проверка бинарника
    check_binary

    # Тест подключения
    if [ $DO_TEST -eq 1 ] && [ $DO_GDB -eq 0 ] && [ $DO_VALGRIND -eq 0 ]; then
        test_connection || true
    fi

    # GDB
    if [ $DO_GDB -eq 1 ]; then
        run_gdb
    fi

    # Valgrind
    if [ $DO_VALGRIND -eq 1 ]; then
        run_valgrind
    fi

    # Информация
    show_info

    print_success "Rebuild complete!"
    echo ""
}

# ============================================================================
# Запуск
# ============================================================================

# Проверка, что скрипт запущен из правильной директории
if [ ! -f "Makefile" ] && [ ! -d "src" ]; then
    print_error "Please run this script from the project root directory"
    print_error "Current directory: $PWD"
    exit 1
fi

# Запуск main с аргументами
main "$@"
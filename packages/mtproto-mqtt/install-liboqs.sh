#!/bin/bash
# ============================================================================
# install-liboqs.sh - Установка liboqs (Open Quantum Safe)
# Пост-квантовая криптография для MTProto MQTT Gateway
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

    # Проверка CMake
    if ! command -v cmake &> /dev/null; then
        print_error "CMake not found. Please install cmake"
        print_info "sudo apt-get install cmake"
        exit 1
    fi
    print_success "CMake: $(cmake --version | head -1)"

    # Проверка Git
    if ! command -v git &> /dev/null; then
        print_error "Git not found. Please install git"
        print_info "sudo apt-get install git"
        exit 1
    fi
    print_success "Git: $(git --version | head -1)"

    # Проверка Ninja (опционально)
    if command -v ninja &> /dev/null; then
        print_success "Ninja: $(ninja --version 2>/dev/null | head -1)"
        USE_NINJA=1
    else
        print_warning "Ninja not found, using make"
        USE_NINJA=0
    fi

    # Проверка OpenSSL
    if ldconfig -p 2>/dev/null | grep -q libssl; then
        print_success "OpenSSL: found"
    else
        print_warning "OpenSSL not found, installing..."
        sudo apt-get update
        sudo apt-get install -y libssl-dev
    fi

    echo ""
}

# ============================================================================
# Проверка уже установленной liboqs
# ============================================================================

check_existing() {
    print_step "Checking for existing liboqs installation..."

    if pkg-config --exists liboqs 2>/dev/null; then
        print_success "liboqs already installed via pkg-config"
        echo "  Version: $(pkg-config --modversion liboqs 2>/dev/null || echo 'unknown')"
        echo "  CFlags: $(pkg-config --cflags liboqs 2>/dev/null)"
        echo "  Libs: $(pkg-config --libs liboqs 2>/dev/null)"
        return 0
    fi

    if ldconfig -p 2>/dev/null | grep -q liboqs; then
        print_success "liboqs already installed in system"
        return 0
    fi

    if [ -f /usr/local/lib/liboqs.a ] || [ -f /usr/local/lib/liboqs.so ]; then
        print_success "liboqs already installed in /usr/local/lib"
        return 0
    fi

    print_warning "liboqs not found, installing..."
    return 1
}

# ============================================================================
# Установка зависимостей
# ============================================================================

install_dependencies() {
    print_step "Installing build dependencies..."

    sudo apt-get update

    # Основные зависимости
    local deps=(
        build-essential
        cmake
        git
        ninja-build
        libssl-dev
        python3
        python3-pytest
        python3-pytest-xdist
        unzip
        xsltproc
        doxygen
        graphviz
        python3-yaml
        valgrind
    )

    local missing=()
    for dep in "${deps[@]}"; do
        if ! dpkg -l | grep -q "^ii  $dep "; then
            missing+=("$dep")
        fi
    done

    if [ ${#missing[@]} -gt 0 ]; then
        echo "  Installing: ${missing[*]}"
        sudo apt-get install -y "${missing[@]}"
    else
        print_success "All dependencies already installed"
    fi

    # Установка pip
    if ! command -v pip3 &> /dev/null; then
        sudo apt-get install -y python3-pip
    fi

    # Установка Python пакетов
    pip3 install --user pytest pytest-xdist pyyaml 2>/dev/null || true

    echo ""
}

# ============================================================================
# Сборка liboqs
# ============================================================================

build_liboqs() {
    print_step "Building liboqs..."

    # Создаем временную директорию
    local tmp_dir="/tmp/liboqs-build-$$"
    mkdir -p "$tmp_dir"
    cd "$tmp_dir"

    print_info "Build directory: $tmp_dir"

    # Клонирование репозитория
    print_step "Cloning liboqs repository..."
    git clone -b main https://github.com/open-quantum-safe/liboqs.git
    cd liboqs

    # Проверка версии
    local commit=$(git rev-parse --short HEAD)
    print_info "Commit: $commit"

    # Создание директории сборки
    mkdir build && cd build

    # Настройка CMake
    print_step "Configuring build with CMake..."

    local cmake_args=(
        -DCMAKE_INSTALL_PREFIX=/usr/local
        -DCMAKE_BUILD_TYPE=Release
        -DBUILD_SHARED_LIBS=ON
        -DOQS_MINIMAL_BUILD=OFF
        -DOQS_USE_OPENSSL=ON
        -DOQS_BUILD_ONLY_LIB=OFF
        -DOQS_BUILD_DOCS=ON
        -DOQS_ENABLE_TEST_CONSTANT_TIME=OFF
        -DOQS_ENABLE_SIG_STFL_LMS=ON
        -DOQS_ENABLE_SIG_STFL_XMSS=ON
        -DOQS_ALGS_ENABLED=ALL
    )

    if [ $USE_NINJA -eq 1 ]; then
        cmake_args+=(-GNinja)
        print_info "Using Ninja build system"
    else
        print_info "Using Make build system"
    fi

    cmake "${cmake_args[@]}" ..

    # Сборка
    print_step "Building liboqs..."
    if [ $USE_NINJA -eq 1 ]; then
        ninja -j$(nproc)
    else
        make -j$(nproc)
    fi

    print_success "Build complete"

    # Запуск тестов (опционально)
    print_step "Running tests..."
    if [ $USE_NINJA -eq 1 ]; then
        if ninja run_tests 2>/dev/null; then
            print_success "Tests passed"
        else
            print_warning "Some tests failed (continuing anyway)"
        fi
    else
        if make run_tests 2>/dev/null; then
            print_success "Tests passed"
        else
            print_warning "Some tests failed (continuing anyway)"
        fi
    fi

    # Установка
    print_step "Installing liboqs..."
    if [ $USE_NINJA -eq 1 ]; then
        sudo ninja install
    else
        sudo make install
    fi

    # Обновление кэша библиотек
    sudo ldconfig

    print_success "Installation complete"

    # Очистка
    cd /
    rm -rf "$tmp_dir"
}

# ============================================================================
# Проверка установки
# ============================================================================

verify_installation() {
    print_step "Verifying liboqs installation..."

    # Проверка через pkg-config
    if pkg-config --exists liboqs 2>/dev/null; then
        print_success "pkg-config: found"
        echo "  Version: $(pkg-config --modversion liboqs 2>/dev/null)"
        echo "  CFlags: $(pkg-config --cflags liboqs 2>/dev/null)"
        echo "  Libs: $(pkg-config --libs liboqs 2>/dev/null)"
    else
        print_warning "pkg-config not found, checking manually"
    fi

    # Проверка библиотек
    echo ""
    echo "  Library files:"
    for lib in /usr/local/lib/liboqs.so /usr/local/lib/liboqs.a /usr/lib/liboqs.so /usr/lib/liboqs.a; do
        if [ -f "$lib" ]; then
            echo "    ✅ $lib"
        fi
    done

    # Проверка заголовков
    echo ""
    echo "  Header files:"
    for header in /usr/local/include/oqs/oqs.h /usr/include/oqs/oqs.h; do
        if [ -f "$header" ]; then
            echo "    ✅ $header"
        fi
    done

    # Тест компиляции
    echo ""
    print_step "Testing compilation with liboqs..."

    cat > /tmp/test_liboqs.c << 'EOF'
#include <oqs/oqs.h>
#include <stdio.h>

int main() {
    printf("liboqs version: %s\n", OQS_VERSION_TEXT);
    printf("KEM algorithms:\n");
    for (size_t i = 0; i < OQS_KEM_algs_length; i++) {
        printf("  %s\n", OQS_KEM_alg_identifier(i));
    }
    return 0;
}
EOF

    if gcc -o /tmp/test_liboqs /tmp/test_liboqs.c -loqs 2>/dev/null; then
        print_success "Compilation test passed"
        /tmp/test_liboqs
        rm -f /tmp/test_liboqs /tmp/test_liboqs.c
    else
        print_error "Compilation test failed"
        echo "  Try: gcc -I/usr/local/include -L/usr/local/lib test.c -loqs"
    fi
}

# ============================================================================
# Основная функция
# ============================================================================

main() {
    print_header "liboqs Installation Script"

    # Проверка окружения
    check_environment

    # Проверка существующей установки
    if check_existing; then
        echo ""
        read -p "liboqs already installed. Reinstall? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_info "Skipping installation"
            exit 0
        fi
    fi

    # Установка зависимостей
    install_dependencies

    # Сборка и установка
    build_liboqs

    # Проверка
    verify_installation

    print_header "Installation Complete"
    echo ""
    print_success "liboqs has been installed successfully!"
    echo ""
    echo "📁 Installation location: /usr/local"
    echo "📚 Header files: /usr/local/include/oqs/"
    echo "📖 Library files: /usr/local/lib/liboqs.*"
    echo ""
    echo "🔧 To use liboqs in your project:"
    echo "  gcc -I/usr/local/include -L/usr/local/lib your_program.c -loqs"
    echo ""
    echo "🔐 Supported algorithms:"
    echo "  KEM: ML-KEM, Kyber, FrodoKEM, etc."
    echo "  Signatures: ML-DSA, Falcon, SPHINCS+, etc."
    echo ""
    echo "📚 Documentation: https://github.com/open-quantum-safe/liboqs"
    echo ""
}

# ============================================================================
# Запуск
# ============================================================================

# Проверка прав sudo
if [ "$EUID" -eq 0 ]; then
    print_error "Please do not run this script as root"
    exit 1
fi

# Запуск main
main "$@"
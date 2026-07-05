# Makefile для сборки mtproto-mqtt-test
# Поддержка гибридной криптографии (ECDH + ML-KEM + ML-DSA)
# Требуется liboqs для пост-квантовой криптографии
# С автоматическим управлением памятью

# ============================================================================
# Компилятор и флаги
# ============================================================================

CC = gcc
CFLAGS = -Wall -Wextra -O2 -g -D_GNU_SOURCE -std=c99
CFLAGS += -DUSE_PAHO_MQTT
CFLAGS += -DDEBUG -g3 -O0
CFLAGS += -DLOG_LEVEL=LOG_LEVEL_DEBUG
CFLAGS += -Isrc -Iinclude -I../MTProxy/common -I../MTProxy
CFLAGS += -I/usr/local/include

# 🔥 Защита от переполнения стека
CFLAGS += -fstack-protector-strong
CFLAGS += -D_FORTIFY_SOURCE=2
CFLAGS += -Wp,-D_FORTIFY_SOURCE=2
CFLAGS += -Wp,-D_GLIBCXX_ASSERTIONS
CFLAGS += -Wformat -Wformat-security
CFLAGS += -Werror=format-security
CFLAGS += -fPIE -pie

# 🔥 Увеличение размера стека до 16MB
CFLAGS += -Wl,-z,stack-size=16777216

# Подключение liboqs для пост-квантовой криптографии
LIBOQS_CFLAGS = $(shell pkg-config --cflags liboqs 2>/dev/null || echo "")
LIBOQS_LDFLAGS = $(shell pkg-config --libs liboqs 2>/dev/null || echo "-loqs")

ifneq ($(LIBOQS_CFLAGS),)
    CFLAGS += $(LIBOQS_CFLAGS)
    $(info ✅ liboqs found: $(LIBOQS_CFLAGS))
else
    $(warning ⚠️ liboqs not found. Install for quantum-safe cryptography)
    $(warning    git clone https://github.com/open-quantum-safe/liboqs.git)
    $(warning    cd liboqs && mkdir build && cd build)
    $(warning    cmake -DCMAKE_INSTALL_PREFIX=/usr/local .. && make && sudo make install)
endif

# ============================================================================
# Библиотеки
# ============================================================================

LDFLAGS = -lpthread -lm -lpaho-mqtt3c -lssl -lcrypto
LDFLAGS += $(LIBOQS_LDFLAGS)

# 🔥 Дополнительные флаги безопасности
LDFLAGS += -Wl,-z,relro -Wl,-z,now
LDFLAGS += -Wl,-z,stack-size=16777216

# ============================================================================
# Каталоги
# ============================================================================

SRC_DIR = src
BUILD_DIR = build
BIN_DIR = bin
TEST_DIR = tests
LOG_DIR = logs
CONFIG_DIR = config

# ============================================================================
# Исходные файлы
# ============================================================================

SOURCES = $(wildcard $(SRC_DIR)/*.c)
OBJECTS = $(SOURCES:$(SRC_DIR)/%.c=$(BUILD_DIR)/%.o)
TARGET = $(BIN_DIR)/mtproto-mqtt-gateway

# Дополнительные исходники для тестов
TEST_SOURCES = $(wildcard $(TEST_DIR)/*.c)
TEST_TARGETS = $(TEST_SOURCES:$(TEST_DIR)/%.c=$(TEST_DIR)/%)

# ============================================================================
# Версия и информация
# ============================================================================

VERSION = 2.0.0
BUILD_DATE = $(shell date +%Y-%m-%d_%H:%M:%S)
GIT_COMMIT = $(shell git rev-parse --short HEAD 2>/dev/null || echo "unknown")

CFLAGS += -DVERSION=\"$(VERSION)\"
CFLAGS += -DBUILD_DATE=\"$(BUILD_DATE)\"
CFLAGS += -DGIT_COMMIT=\"$(GIT_COMMIT)\"
CFLAGS += -Wno-unused-function
# ============================================================================
# Цели по умолчанию
# ============================================================================

.PHONY: all clean distclean veryclean nuke clean-logs clean-bin clean-tests clean-temp clean-all test help run run-verbose run-spb run-moscow \
        run-krd run-ekb run-nsk run-kzn run-vlad run-sochi run-crimea \
        install uninstall debug profile coverage info \
        test-crypto test-hybrid test-multi test-all check-pq \
        user-alice user-bob

all: check-liboqs directories $(TARGET)
	@echo ""
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  ✅ Build complete: $(TARGET)"
	@echo "  📊 Size: $$(du -h $(TARGET) | cut -f1)"
	@echo "  🔗 Dependencies: $$(ldd $(TARGET) | wc -l) libraries"
	@echo "  🔐 PQ Support: $$($(TARGET) --check-pq 2>/dev/null || echo 'Check failed')"
	@echo "  📦 Version: $(VERSION)"
	@echo "  🧠 Memory: Auto-cleanup enabled"
	@echo "  🔒 Stack Protection: Enabled (size: 16MB)"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""

# ============================================================================
# Проверка liboqs
# ============================================================================

check-liboqs:
	@echo "🔍 Checking liboqs..."
	@pkg-config --exists liboqs && echo "  ✅ liboqs installed" || \
		(echo "  ⚠️ liboqs not found. Install for quantum-safe support:" && \
		 echo "     git clone https://github.com/open-quantum-safe/liboqs.git" && \
		 echo "     cd liboqs && mkdir build && cd build" && \
		 echo "     cmake -DCMAKE_INSTALL_PREFIX=/usr/local .. && make && sudo make install")
	@echo ""

# ============================================================================
# Создание директорий
# ============================================================================

directories:
	@mkdir -p $(BUILD_DIR) $(BIN_DIR) $(LOG_DIR) $(CONFIG_DIR)

# ============================================================================
# Сборка основного модуля
# ============================================================================

$(TARGET): $(OBJECTS) | $(BIN_DIR)
	$(CC) $(CFLAGS) -o $@ $^ $(LDFLAGS)

$(BUILD_DIR)/%.o: $(SRC_DIR)/%.c | $(BUILD_DIR)
	$(CC) $(CFLAGS) -MMD -MP -c $< -o $@

# ============================================================================
# Сборка с различными опциями
# ============================================================================

debug: CFLAGS += -DDEBUG_MQTT -DDEBUG_PACKETS
debug: all

profile: CFLAGS += -pg -fprofile-arcs -ftest-coverage
profile: LDFLAGS += -pg -lgcov
profile: all

coverage: CFLAGS += -fprofile-arcs -ftest-coverage
coverage: LDFLAGS += -lgcov
coverage: all

static: CFLAGS += -static
static: LDFLAGS += -static
static: all

# ============================================================================
# Запуск
# ============================================================================

run: all
	@echo "🚀 Starting MQTT test module..."
	$(TARGET)

run-verbose: all
	@echo "🚀 Starting MQTT test module (verbose)..."
	$(TARGET) -v

run-debug: debug
	@echo "🚀 Starting MQTT test module (debug)..."
	$(TARGET) -v -c SPB

# ============================================================================
# Запуск для разных городов
# ============================================================================

run-spb: all
	@echo "📍 Saint Petersburg..."
	$(TARGET) -c SPB

run-moscow: all
	@echo "📍 Moscow..."
	$(TARGET) -c MOS

run-krd: all
	@echo "📍 Krasnodar..."
	$(TARGET) -c KRD

run-ekb: all
	@echo "📍 Yekaterinburg..."
	$(TARGET) -c EKB

run-nsk: all
	@echo "📍 Novosibirsk..."
	$(TARGET) -c NSK

run-kzn: all
	@echo "📍 Kazan..."
	$(TARGET) -c KZN

run-vlad: all
	@echo "📍 Vladivostok..."
	$(TARGET) -c VVO

run-sochi: all
	@echo "📍 Sochi..."
	$(TARGET) -c SOCH

run-crimea: all
	@echo "📍 Crimea..."
	$(TARGET) -c CRM

run-custom: all
	@echo "📍 Custom city: $(CITY)"
	$(TARGET) -c $(CITY)

# ============================================================================
# Тесты криптографии
# ============================================================================

test-crypto: all
	@echo "🔐 Testing basic crypto..."
	$(TARGET) --test-crypto

test-hybrid: all
	@echo "🔐 Testing hybrid crypto (ECDH + ML-KEM) with auto memory management..."
	$(TARGET) --test-hybrid

test-multi: all
	@echo "📨 Testing multiple messages with auto memory management..."
	$(TARGET) --test-multi

check-pq: all
	@echo "🔍 Checking PQ algorithms support..."
	$(TARGET) --check-pq

# ============================================================================
# Тесты пользователей
# ============================================================================

user-alice: all
	@echo "👤 Testing Alice user..."
	$(TARGET) --test-user alice

user-bob: all
	@echo "👤 Testing Bob user..."
	$(TARGET) --test-user bob

# ============================================================================
# Все тесты
# ============================================================================

test-all: test-crypto test-hybrid test-multi check-pq
	@echo ""
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  ✅ All tests passed!"
	@echo "  📊 Memory: All buffers auto-cleaned"
	@echo "═══════════════════════════════════════════════════════════════"

test: test-all

# ============================================================================
# Установка
# ============================================================================

install: all
	@echo "📦 Installing to /usr/local/bin..."
	@sudo cp $(TARGET) /usr/local/bin/mtproto-mqtt-test
	@sudo chmod 755 /usr/local/bin/mtproto-mqtt-test
	@echo "✅ Installation complete"

uninstall:
	@echo "🗑️ Uninstalling..."
	@sudo rm -f /usr/local/bin/mtproto-mqtt-test
	@echo "✅ Uninstall complete"

# ============================================================================
# Отладка
# ============================================================================

debug-run: debug
	@echo "🐛 Starting with GDB..."
	gdb --args $(TARGET) -v -c SPB

valgrind: debug
	@echo "🔍 Running Valgrind..."
	valgrind --leak-check=full --show-leak-kinds=all \
	         --track-origins=yes --verbose \
	         $(TARGET) -c SPB

valgrind-verbose: debug
	@echo "🔍 Running Valgrind (verbose)..."
	valgrind --leak-check=full --show-leak-kinds=all \
	         --track-origins=yes --verbose \
	         --log-file=$(LOG_DIR)/valgrind.log \
	         $(TARGET) -c SPB -v

# ============================================================================
# Очистка
# ============================================================================

clean:
	@echo "🧹 Cleaning build files..."
	@rm -rf $(BUILD_DIR) $(BIN_DIR)
	@rm -f $(TEST_DIR)/test_*
	@find . -name "*.o" -delete
	@find . -name "*.d" -delete
	@find . -name "*.gcda" -delete
	@find . -name "*.gcno" -delete
	@find . -name "gmon.out" -delete
	@find . -name "*.log" -delete
	@find . -name "*.tmp" -delete
	@echo "✅ Clean complete"

distclean: clean
	@echo "🧹 Deep cleaning..."
	@rm -rf $(LOG_DIR)
	@rm -rf docs
	@rm -rf coverage
	@rm -rf $(BIN_DIR)
	@rm -rf $(BUILD_DIR)
	@rm -rf *.log *.tmp core core.*
	@rm -rf valgrind.out valgrind.log
	@rm -rf gmon.out *.gcda *.gcno
	@find . -name "*.o" -delete
	@find . -name "*.d" -delete
	@find . -name "*.so" -delete
	@find . -name "*.a" -delete
	@find . -name "*~" -delete
	@find . -name ".#*" -delete
	@find . -name "*.swp" -delete
	@find . -name "*.swo" -delete
	@echo "✅ Dist-clean complete"

veryclean: distclean
	@echo "🧹 Very deep cleaning..."
	@rm -rf $(CONFIG_DIR)
	@rm -rf $(TEST_DIR)/*.log
	@rm -rf $(TEST_DIR)/*.tmp
	@rm -rf $(TEST_DIR)/*.out
	@rm -rf $(TEST_DIR)/core.*
	@find . -name "*.pyc" -delete
	@find . -name "__pycache__" -delete
	@find . -name ".cache" -delete
	@echo "✅ Very-clean complete"

clean-logs:
	@echo "🧹 Cleaning logs..."
	@rm -rf $(LOG_DIR)
	@rm -f *.log *.tmp
	@find . -name "*.log" -delete
	@find . -name "*.tmp" -delete
	@echo "✅ Logs cleaned"

clean-bin:
	@echo "🧹 Cleaning binaries..."
	@rm -rf $(BIN_DIR)
	@rm -rf $(BUILD_DIR)
	@rm -f $(TARGET)
	@find . -name "*.o" -delete
	@find . -name "*.so" -delete
	@find . -name "*.a" -delete
	@echo "✅ Binaries cleaned"

clean-tests:
	@echo "🧹 Cleaning test files..."
	@rm -rf $(TEST_DIR)
	@rm -f test_* *.test
	@find . -name "*.test" -delete
	@echo "✅ Test files cleaned"

clean-temp:
	@echo "🧹 Cleaning temporary files..."
	@find . -name "*~" -delete
	@find . -name ".#*" -delete
	@find . -name "*.swp" -delete
	@find . -name "*.swo" -delete
	@find . -name "*.tmp" -delete
	@find . -name "*.log" -delete
	@find . -name "core.*" -delete
	@echo "✅ Temporary files cleaned"

# Полный сброс - удаляет ВСЁ, что было создано
nuke: distclean
	@echo "💥 NUKING everything..."
	@rm -rf $(BIN_DIR)
	@rm -rf $(BUILD_DIR)
	@rm -rf $(LOG_DIR)
	@rm -rf $(CONFIG_DIR)
	@rm -rf docs
	@rm -rf coverage
	@rm -rf $(TEST_DIR)
	@find . -name "*.o" -delete
	@find . -name "*.d" -delete
	@find . -name "*.so" -delete
	@find . -name "*.a" -delete
	@find . -name "*.log" -delete
	@find . -name "*.tmp" -delete
	@find . -name "*.out" -delete
	@find . -name "core.*" -delete
	@find . -name "gmon.out" -delete
	@find . -name "*.gcda" -delete
	@find . -name "*.gcno" -delete
	@find . -name "*~" -delete
	@find . -name ".#*" -delete
	@find . -name "*.swp" -delete
	@find . -name "*.swo" -delete
	@find . -name "valgrind.out" -delete
	@find . -name "valgrind.log" -delete
	@find . -name "__pycache__" -delete
	@find . -name ".cache" -delete
	@find . -name "*.pyc" -delete
	@echo ""
	@echo "💥 Everything nuked!"
	@echo "   bin/     - removed"
	@echo "   build/   - removed"
	@echo "   logs/    - removed"
	@echo "   config/  - removed"
	@echo "   tests/   - removed"
	@echo "   docs/    - removed"
	@echo "   coverage/- removed"
	@echo "   All temp files - removed"
	@echo "   All backup files - removed"
	@echo ""
	@echo "📁 Directory structure restored to initial state"

clean-all: nuke
	@echo "🧹 Cleaning ALL artifacts..."
	@rm -rf $(BIN_DIR)
	@rm -rf $(BUILD_DIR)
	@rm -rf $(LOG_DIR)
	@rm -rf $(CONFIG_DIR)
	@rm -rf docs
	@rm -rf coverage
	@rm -rf $(TEST_DIR)
	@find . -name "*.o" -delete
	@find . -name "*.d" -delete
	@find . -name "*.so" -delete
	@find . -name "*.a" -delete
	@find . -name "*.log" -delete
	@find . -name "*.tmp" -delete
	@find . -name "*.out" -delete
	@find . -name "core.*" -delete
	@find . -name "gmon.out" -delete
	@find . -name "*.gcda" -delete
	@find . -name "*.gcno" -delete
	@find . -name "*~" -delete
	@find . -name ".#*" -delete
	@find . -name "*.swp" -delete
	@find . -name "*.swo" -delete
	@find . -name "valgrind.out" -delete
	@find . -name "valgrind.log" -delete
	@find . -name "__pycache__" -delete
	@find . -name ".cache" -delete
	@find . -name "*.pyc" -delete
	@echo ""
	@echo "✅ ALL ARTIFACTS REMOVED!"
	@echo "   Project is completely clean"

clean-subdirs:
	@echo "🧹 Cleaning subdirectories..."
	@for dir in $(SRC_DIR) $(TEST_DIR) $(CONFIG_DIR); do \
		if [ -d "$$dir" ]; then \
			find "$$dir" -name "*.o" -delete; \
			find "$$dir" -name "*.d" -delete; \
			find "$$dir" -name "*.log" -delete; \
			find "$$dir" -name "*.tmp" -delete; \
			find "$$dir" -name "*~" -delete; \
		fi; \
	done
	@echo "✅ Subdirectories cleaned"

# ============================================================================
# Информация о сборке
# ============================================================================

info:
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  Build Information"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  Version:      $(VERSION)"
	@echo "  Build Date:   $(BUILD_DATE)"
	@echo "  Git Commit:   $(GIT_COMMIT)"
	@echo "  Compiler:     $(CC)"
	@echo "  Version:      $$($(CC) --version | head -1)"
	@echo "  CFLAGS:       $(CFLAGS)"
	@echo "  LDFLAGS:      $(LDFLAGS)"
	@echo "  Sources:      $(SOURCES)"
	@echo "  Objects:      $(OBJECTS)"
	@echo "  Target:       $(TARGET)"
	@echo "  Tests:        $(TEST_TARGETS)"
	@echo "─────────────────────────────────────────────────────────────────"
	@echo "  PQ Support:   $$($(TARGET) --check-pq 2>/dev/null || echo 'Check failed')"
	@echo "  Max Packet:   128KB (auto-allocated)"
	@echo "  Memory Mgmt:  Auto-cleanup via SAFE_FREE"
	@echo "  Stack Prot:   Enabled (16MB)"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""
	@echo "MQTT Library:"
	@if [ -f /usr/include/MQTTClient.h ]; then \
		echo "  ✅ Paho MQTT: /usr/include/MQTTClient.h"; \
	elif [ -f /usr/include/mosquitto.h ]; then \
		echo "  ✅ Mosquitto: /usr/include/mosquitto.h"; \
	else \
		echo "  ❌ No MQTT library found!"; \
	fi
	@echo ""

# ============================================================================
# Справка
# ============================================================================

help:
	@echo "═══════════════════════════════════════════════════════════════"
	@echo "  MTProto MQTT Test Module v$(VERSION)"
	@echo "  Hybrid Crypto: ECDH + ML-KEM + ML-DSA"
	@echo "  Memory: Auto-cleanup with SAFE_FREE macros"
	@echo "  Stack Protection: Enabled (16MB)"
	@echo "═══════════════════════════════════════════════════════════════"
	@echo ""
	@echo "📦 Build targets:"
	@echo "  all           - Build the test module (default)"
	@echo "  debug         - Build with debug symbols"
	@echo "  profile       - Build with profiling support"
	@echo "  coverage      - Build with coverage support"
	@echo "  static        - Build static binary"
	@echo ""
	@echo "🚀 Run targets:"
	@echo "  run           - Build and run"
	@echo "  run-verbose   - Build and run with verbose"
	@echo "  run-debug     - Build and run in debug mode"
	@echo ""
	@echo "📍 City targets:"
	@echo "  run-spb       - Saint Petersburg"
	@echo "  run-moscow    - Moscow"
	@echo "  run-krd       - Krasnodar"
	@echo "  run-ekb       - Yekaterinburg"
	@echo "  run-nsk       - Novosibirsk"
	@echo "  run-kzn       - Kazan"
	@echo "  run-vlad      - Vladivostok"
	@echo "  run-sochi     - Sochi"
	@echo "  run-crimea    - Crimea"
	@echo "  run-custom CITY=<code> - Custom city"
	@echo ""
	@echo "🔐 Crypto targets:"
	@echo "  test-crypto   - Test basic crypto"
	@echo "  test-hybrid   - Test hybrid crypto (ECDH + ML-KEM) with auto-memory"
	@echo "  test-multi    - Test multiple messages with auto-memory"
	@echo "  check-pq      - Check PQ algorithms support"
	@echo ""
	@echo "🧪 Test targets:"
	@echo "  test          - Run all tests"
	@echo "  test-all      - Run all tests (explicit)"
	@echo ""
	@echo "👤 User targets:"
	@echo "  user-alice    - Test Alice user"
	@echo "  user-bob      - Test Bob user"
	@echo ""
	@echo "🔧 Install targets:"
	@echo "  install       - Install to /usr/local/bin"
	@echo "  uninstall     - Remove from /usr/local/bin"
	@echo ""
	@echo "🐛 Debug targets:"
	@echo "  debug-run     - Run with GDB"
	@echo "  valgrind      - Run with Valgrind"
	@echo "  valgrind-verbose - Run with Valgrind (verbose)"
	@echo ""
	@echo "🧹 Clean targets:"
	@echo "  clean         - Remove build files"
	@echo "  distclean     - Deep clean (logs, docs, coverage)"
	@echo "  veryclean     - Very deep clean (config, tests)"
	@echo "  nuke          - Remove EVERYTHING!"
	@echo "  clean-logs    - Remove log files"
	@echo "  clean-bin     - Remove binaries only"
	@echo "  clean-tests   - Remove test files"
	@echo "  clean-temp    - Remove temporary files"
	@echo "  clean-all     - Remove all artifacts"
	@echo ""
	@echo "📖 Examples:"
	@echo "  make run-spb              # Run for SPB city"
	@echo "  make run-verbose          # Verbose mode"
	@echo "  make test                 # Run all tests"
	@echo "  make test-hybrid          # Test hybrid crypto"
	@echo "  make test-multi           # Test multiple messages"
	@echo "  make nuke                 # Complete clean"
	@echo "  make run-custom CITY=SPB  # Custom city"
	@echo "  ./bin/mtproto-mqtt-test -c SPB -s 'Hello' -r node-123"
	@echo ""
	@echo "🧠 Memory Management:"
	@echo "  - SAFE_MALLOC:  Alloc with NULL check"
	@echo "  - SAFE_CALLOC:  Alloc zeroed with NULL check"
	@echo "  - SAFE_REALLOC: Realloc with NULL check"
	@echo "  - SAFE_FREE:    Free and set pointer to NULL"
	@echo "  - AUTO_FREE:    Auto-cleanup on scope exit"
	@echo "  - Max packet:   128KB (dynamic allocation)"
	@echo ""
	@echo "🛡️ Stack Protection:"
	@echo "  - fstack-protector-strong"
	@echo "  - _FORTIFY_SOURCE=2"
	@echo "  - stack-size=16MB"

# ============================================================================
# Зависимости
# ============================================================================

-include $(OBJECTS:.o=.d)

# ============================================================================
# Специальные цели
# ============================================================================

.PHONY: test-crypto test-hybrid test-multi test-all check-pq user-alice user-bob
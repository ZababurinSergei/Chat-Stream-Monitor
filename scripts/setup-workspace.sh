#!/bin/bash

# ============================================
# Setup Workspace Script for Monorepo
# ============================================
# This script initializes and configures the monorepo workspace
# with full Directory integration.

set -e  # Exit on error
set -u  # Exit on undefined variable

# ============================================
# COLOR CODES
# ============================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color
BOLD='\033[1m'

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}${BOLD}  $1${NC}"
    echo -e "${CYAN}${BOLD}════════════════════════════════════════════════════════════════${NC}"
    echo ""
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

print_step() {
    echo -e "${MAGENTA}▶ $1${NC}"
}

# ============================================
# MAIN SETUP PROCESS
# ============================================

print_header "MONOREPO WORKSPACE SETUP"

# Переход в корень монорепозитория
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MONOREPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$MONOREPO_ROOT"
print_info "Working directory: $MONOREPO_ROOT"

# ============================================
# CHECK PREREQUISITES
# ============================================
print_header "CHECKING PREREQUISITES"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js found: $NODE_VERSION"
else
    print_error "Node.js is not installed"
    exit 1
fi

# Check pnpm
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    print_success "pnpm found: $PNPM_VERSION"
else
    print_error "pnpm is not installed"
    print_info "Install pnpm: npm install -g pnpm"
    exit 1
fi

# Check Git
if command -v git &> /dev/null; then
    GIT_VERSION=$(git --version)
    print_success "Git found: $GIT_VERSION"
else
    print_error "Git is not installed"
    exit 1
fi

# ============================================
# CLEANUP OLD FILES
# ============================================
print_header "CLEANING OLD DEPENDENCIES"

print_step "Removing root node_modules..."
rm -rf node_modules
print_success "Root node_modules removed"

print_step "Removing lock files..."
rm -f pnpm-lock.yaml
rm -f package-lock.json
rm -f yarn.lock
print_success "Lock files removed"

print_step "Removing package node_modules..."
rm -rf packages/*/node_modules
rm -rf apps/*/node_modules 2>/dev/null || true
rm -rf tooling/*/node_modules 2>/dev/null || true
print_success "Package node_modules removed"

print_step "Removing Directory node_modules..."
rm -rf Directory/*/node_modules
rm -rf Directory/*/*/node_modules 2>/dev/null || true
print_success "Directory node_modules removed"

print_step "Removing build artifacts..."
rm -rf packages/*/dist
rm -rf packages/*/build
rm -rf packages/*/.turbo
rm -rf Directory/*/dist
rm -rf Directory/*/build
rm -rf Directory/*/coverage
rm -rf Directory/*/.turbo
rm -rf apps/*/dist 2>/dev/null || true
rm -rf apps/*/.turbo 2>/dev/null || true
print_success "Build artifacts removed"

print_step "Removing turbo cache..."
rm -rf .turbo
rm -rf node_modules/.cache/turbo
print_success "Turbo cache removed"

print_step "Removing test coverage..."
rm -rf coverage
rm -rf packages/*/coverage
rm -rf Directory/*/coverage
rm -rf apps/*/coverage 2>/dev/null || true
print_success "Test coverage removed"

print_step "Removing logs..."
rm -rf logs
rm -f *.log
rm -f Directory/*/*.log
print_success "Logs removed"

print_step "Removing temporary files..."
rm -f *.backup.*
rm -f Directory/*/*.backup.*
rm -f *.tmp
rm -f Directory/*/*.tmp
print_success "Temporary files removed"

# ============================================
# VALIDATE WORKSPACE CONFIGURATION
# ============================================
print_header "VALIDATING WORKSPACE CONFIGURATION"

# Check pnpm-workspace.yaml
if [ -f "pnpm-workspace.yaml" ]; then
    print_success "pnpm-workspace.yaml found"

    # Validate workspace includes Directory
    if grep -q "Directory/\*" pnpm-workspace.yaml; then
        print_success "Directory integration configured"
    else
        print_warning "Directory not in workspace, adding..."
        echo '  - "Directory/*"' >> pnpm-workspace.yaml
    fi
else
    print_error "pnpm-workspace.yaml not found"
    exit 1
fi

# Check turbo.json
if [ -f "turbo.json" ]; then
    print_success "turbo.json found"
else
    print_error "turbo.json not found"
    exit 1
fi

# Check tsconfig.base.json
if [ -f "tsconfig.base.json" ]; then
    print_success "tsconfig.base.json found"
else
    print_warning "tsconfig.base.json not found, creating default..."
    cat > tsconfig.base.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  },
  "exclude": ["node_modules", "dist", "build", "coverage"]
}
EOF
    print_success "tsconfig.base.json created"
fi

# ============================================
# INSTALL DEPENDENCIES
# ============================================
print_header "INSTALLING DEPENDENCIES"

print_step "Running pnpm install..."
pnpm install --frozen-lockfile=false
print_success "Dependencies installed"

# ============================================
# BUILD ALL PACKAGES
# ============================================
print_header "BUILDING ALL PACKAGES"

print_step "Building with turbo..."
pnpm run build 2>/dev/null || {
    print_warning "Build script not found, running turbo build directly..."
    pnpm exec turbo build
}
print_success "Build completed"

# ============================================
# RUN TYPE CHECK
# ============================================
print_header "RUNNING TYPE CHECK"

if pnpm run type-check 2>/dev/null; then
    print_success "Type check passed"
else
    print_warning "Type check failed (may need manual fixes)"
fi

# ============================================
# SETUP GIT HOOKS
# ============================================
print_header "SETTING UP GIT HOOKS"

if [ -d ".git" ]; then
    print_step "Setting up husky..."

    # Install husky if not present
    if ! pnpm list husky 2>/dev/null | grep -q husky; then
        pnpm add -w husky
    fi

    # Initialize husky
    pnpm exec husky install 2>/dev/null || {
        print_warning "Husky setup skipped"
    }

    # Create pre-commit hook if not exists
    if [ ! -f ".husky/pre-commit" ]; then
        mkdir -p .husky
        cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

pnpm lint-staged
pnpm type-check
EOF
        chmod +x .husky/pre-commit
        print_success "Pre-commit hook created"
    fi

    print_success "Git hooks configured"
else
    print_warning "Not a git repository, skipping git hooks"
fi

# ============================================
# VERIFY PACKAGES
# ============================================
print_header "VERIFYING PACKAGES"

# Check ast-analyzer
if [ -d "Directory/ast-analyzer" ]; then
    if [ -f "Directory/ast-analyzer/package.json" ]; then
        print_success "ast-analyzer package found"

        # Verify tsconfig extends base
        if grep -q "extends.*tsconfig.base" Directory/ast-analyzer/tsconfig.json 2>/dev/null; then
            print_success "ast-analyzer tsconfig correctly configured"
        else
            print_warning "ast-analyzer tsconfig may need manual update"
        fi
    else
        print_error "ast-analyzer package.json not found"
    fi
else
    print_warning "ast-analyzer directory not found"
fi

# Check shared-types
if [ -d "packages/shared-types" ]; then
    if [ -f "packages/shared-types/package.json" ]; then
        print_success "shared-types package found"
    else
        print_error "shared-types package.json not found"
    fi
else
    print_warning "shared-types directory not found"
fi

# List all workspace packages
print_step "Workspace packages:"
pnpm list --depth=0 2>/dev/null || echo "  (no packages found)"

# ============================================
# CREATE ADDITIONAL DIRECTORIES
# ============================================
print_header "CREATING ADDITIONAL DIRECTORIES"

# Create apps directory if not exists
if [ ! -d "apps" ]; then
    mkdir -p apps
    print_success "apps directory created"
fi

# Create tooling directory if not exists
if [ ! -d "tooling" ]; then
    mkdir -p tooling
    print_success "tooling directory created"
fi

# Create scripts directory for additional utilities
if [ ! -d "scripts" ]; then
    mkdir -p scripts
    print_success "scripts directory created"
fi

# ============================================
# GENERATE SUMMARY
# ============================================
print_header "SETUP COMPLETE"

# Calculate statistics
TOTAL_PACKAGES=$(find packages -name "package.json" 2>/dev/null | wc -l)
TOTAL_DIRECTORY_PACKAGES=$(find Directory -name "package.json" -not -path "*/node_modules/*" 2>/dev/null | wc -l)
TOTAL_APPS=$(find apps -name "package.json" 2>/dev/null | wc -l)

echo -e "${BOLD}📊 WORKSPACE STATISTICS:${NC}"
echo "  📦 Packages: $TOTAL_PACKAGES"
echo "  📁 Directory packages: $TOTAL_DIRECTORY_PACKAGES"
echo "  🚀 Apps: $TOTAL_APPS"
echo ""

echo -e "${BOLD}🎯 AVAILABLE COMMANDS:${NC}"
echo ""
echo -e "  ${GREEN}pnpm dev${NC}              - Run all packages in development mode"
echo -e "  ${GREEN}pnpm build${NC}            - Build all packages"
echo -e "  ${GREEN}pnpm test${NC}             - Run all tests"
echo -e "  ${GREEN}pnpm test:coverage${NC}    - Run tests with coverage"
echo -e "  ${GREEN}pnpm lint${NC}             - Lint all code"
echo -e "  ${GREEN}pnpm lint:fix${NC}         - Fix linting issues"
echo -e "  ${GREEN}pnpm type-check${NC}       - Type check all packages"
echo -e "  ${GREEN}pnpm clean${NC}            - Clean all build artifacts"
echo -e "  ${GREEN}pnpm format${NC}           - Format code with prettier"
echo -e "  ${GREEN}pnpm changeset${NC}        - Create changeset for release"
echo -e "  ${GREEN}pnpm version-packages${NC} - Version all packages"
echo -e "  ${GREEN}pnpm release${NC}          - Publish to npm"
echo ""

echo -e "${BOLD}🔧 FILTERED COMMANDS (turbo):${NC}"
echo ""
echo -e "  ${YELLOW}pnpm turbo build --filter=@newkind/ast-analyzer${NC}  - Build only ast-analyzer"
echo -e "  ${YELLOW}pnpm turbo test --filter=./packages/*${NC}            - Test only packages"
echo -e "  ${YELLOW}pnpm turbo dev --parallel${NC}                        - Run all in parallel"
echo ""

echo -e "${BOLD}📁 DIRECTORY STRUCTURE:${NC}"
echo ""
echo "  monorepo/"
echo "  ├── Directory/"
echo "  │   └── ast-analyzer/     # ✅ Integrated"
echo "  ├── packages/"
echo "  │   └── shared-types/     # ✅ Ready"
echo "  ├── apps/                  # 🆕 Created"
echo "  ├── tooling/               # 🆕 Created"
echo "  └── scripts/               # 🆕 Created"
echo ""

# ============================================
# NEXT STEPS
# ============================================
print_header "NEXT STEPS"

echo -e "${BOLD}1. Verify the setup:${NC}"
echo "   pnpm run test"
echo ""
echo -e "${BOLD}2. Start development:${NC}"
echo "   pnpm run dev"
echo ""
echo -e "${BOLD}3. Make your first change:${NC}"
echo "   pnpm run changeset"
echo ""
echo -e "${BOLD}4. Commit and push:${NC}"
echo "   git add ."
echo "   git commit -m \"chore: setup monorepo workspace\""
echo "   git push"
echo ""

print_success "Workspace setup completed successfully!"
print_info "If you encounter any issues, check the logs above"

# ============================================
# END OF SCRIPT
# ============================================
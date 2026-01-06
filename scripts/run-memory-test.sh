#!/bin/bash
#
# Memory Profiling Test Script for TACO Frontend
# Builds production, starts preview server, runs Selenium memory tests
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_DIR/src/taco_dao_frontend"
RESULTS_DIR="$SCRIPT_DIR/memory-results"
PORT=4173

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

cleanup() {
    log_info "Cleaning up..."
    if [ -n "$PREVIEW_PID" ]; then
        kill $PREVIEW_PID 2>/dev/null || true
    fi
    # Kill any orphaned vite preview processes on our port
    lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
}

trap cleanup EXIT

# Create results directory
mkdir -p "$RESULTS_DIR"

# Step 1: Build production
log_info "Building production bundle..."
cd "$FRONTEND_DIR"

if ! npm run build 2>&1 | tee "$RESULTS_DIR/build.log"; then
    log_error "Build failed! Check $RESULTS_DIR/build.log"
    exit 1
fi
log_success "Production build complete"

# Step 2: Kill any existing preview server on the port
log_info "Checking for existing servers on port $PORT..."
lsof -ti :$PORT | xargs kill -9 2>/dev/null || true
sleep 1

# Step 3: Start preview server
log_info "Starting preview server on port $PORT..."
npx vite preview --host 0.0.0.0 --port $PORT &
PREVIEW_PID=$!

# Wait for server to be ready
log_info "Waiting for server to be ready..."
for i in {1..30}; do
    if curl -s "http://localhost:$PORT" > /dev/null 2>&1; then
        log_success "Server is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        log_error "Server failed to start within 30 seconds"
        exit 1
    fi
    sleep 1
done

# Step 4: Setup Python virtual environment and install dependencies
log_info "Setting up Python virtual environment..."

VENV_DIR="$SCRIPT_DIR/.venv"
PYTHON_CMD="python3"

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    log_info "Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
    if [ $? -ne 0 ]; then
        log_error "Failed to create virtual environment. Try: sudo apt install python3-venv"
        exit 1
    fi
fi

# Activate virtual environment
source "$VENV_DIR/bin/activate"
PYTHON_CMD="$VENV_DIR/bin/python"
PIP_CMD="$VENV_DIR/bin/pip"

# Install selenium if not present
if ! $PYTHON_CMD -c "import selenium" 2>/dev/null; then
    log_warn "Installing selenium..."
    $PIP_CMD install selenium --quiet
    if [ $? -ne 0 ]; then
        log_error "Failed to install selenium"
        exit 1
    fi
fi

# Install psutil if not present
if ! $PYTHON_CMD -c "import psutil" 2>/dev/null; then
    log_warn "Installing psutil..."
    $PIP_CMD install psutil --quiet
    if [ $? -ne 0 ]; then
        log_error "Failed to install psutil"
        exit 1
    fi
fi

# Check for Chrome/Chromium
if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    log_error "Chrome or Chromium is required but not found."
    log_info "Install with: sudo apt install chromium-browser"
    exit 1
fi

log_success "Python environment ready"

# Step 5: Run memory profiling
log_info "Running memory profiling tests..."
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPORT_FILE="$RESULTS_DIR/memory_report_${TIMESTAMP}.json"

$PYTHON_CMD "$SCRIPT_DIR/memory-profiler.py" \
    --url "http://localhost:$PORT" \
    --output "$REPORT_FILE" \
    --pages "/" "/dao" "/vote" "/wallet" \
    --wait-time 5

if [ $? -eq 0 ]; then
    log_success "Memory profiling complete!"
    log_info "Report saved to: $REPORT_FILE"

    # Generate summary
    echo ""
    echo "=========================================="
    echo "           MEMORY PROFILE SUMMARY        "
    echo "=========================================="
    python3 -c "
import json
import sys

with open('$REPORT_FILE', 'r') as f:
    data = json.load(f)

summary = data.get('summary', {})
print(f\"Test Duration: {summary.get('total_duration_seconds', 0):.1f}s\")
print(f\"Peak JS Heap: {summary.get('js_heap_peak_mb', 0):.2f} MB\")
print(f\"Peak Tab Memory: {summary.get('tab_memory_peak_mb', 0):.2f} MB\")
print(f\"JS Heap Growth: {summary.get('js_heap_growth_mb', 0):+.2f} MB\")
print()
print('Per-Page Breakdown:')
print('-' * 60)
for page in data['pages']:
    js_heap = page.get('js_heap', {}).get('js_heap_used_mb', 0)
    tab_mem = page.get('tab_memory', {}).get('tab_total_mb', 0)
    print(f\"  {page['path']:15} | JS Heap: {js_heap:6.2f} MB | Tab: {tab_mem:6.2f} MB\")

if data.get('recommendations'):
    print()
    print('Recommendations:')
    print('-' * 60)
    for rec in data['recommendations']:
        priority = rec.get('priority', 'INFO')
        issue = rec.get('issue', '')
        print(f\"  [{priority}] {issue}\")
"
    echo "=========================================="
else
    log_error "Memory profiling failed!"
    exit 1
fi

log_success "All tests complete!"

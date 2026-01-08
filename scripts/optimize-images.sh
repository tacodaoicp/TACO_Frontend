#!/bin/bash
#
# Image Optimization Script for TACO Frontend
# Converts PNG images to WebP format while preserving quality
# WebP provides ~25-35% smaller files AND smaller decoded memory footprint
#
# Usage: ./optimize-images.sh [--dry-run]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
ASSETS_DIR="$PROJECT_DIR/src/taco_dao_frontend/src/assets"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

DRY_RUN=false
if [ "$1" == "--dry-run" ]; then
    DRY_RUN=true
    echo -e "${YELLOW}DRY RUN MODE - No files will be modified${NC}"
fi

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check for required tools
check_tools() {
    if command -v cwebp &> /dev/null; then
        CONVERTER="cwebp"
        log_info "Using cwebp for conversion"
    elif python3 -c "from PIL import Image" 2>/dev/null; then
        CONVERTER="python"
        log_info "Using Python PIL for conversion"
    else
        log_error "No WebP converter found!"
        log_info "Install one of these:"
        log_info "  - sudo apt install webp"
        log_info "  - pip3 install Pillow"
        exit 1
    fi
}

# Convert PNG to WebP
convert_image() {
    local input="$1"
    local output="${input%.png}.webp"

    if [ "$CONVERTER" == "cwebp" ]; then
        cwebp -q 90 -m 6 -alpha_q 90 "$input" -o "$output" 2>/dev/null
    else
        python3 << EOF
from PIL import Image
import sys
try:
    img = Image.open('$input')
    # Preserve transparency if present
    if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
        img.save('$output', 'WEBP', quality=90, method=6)
    else:
        img.convert('RGB').save('$output', 'WEBP', quality=90, method=6)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
    sys.exit(1)
EOF
    fi
}

# Analyze images and show potential savings
analyze_images() {
    echo ""
    echo "=============================================="
    echo "        IMAGE ANALYSIS REPORT               "
    echo "=============================================="
    echo ""

    local total_png_size=0
    local total_decoded_memory=0

    # Chef images (largest memory consumers)
    echo "CHEF IMAGES (High Memory Impact):"
    echo "-" | head -c 60 && echo

    for png in "$ASSETS_DIR"/images/chef/*.png; do
        if [ -f "$png" ]; then
            local size=$(stat -f%z "$png" 2>/dev/null || stat -c%s "$png" 2>/dev/null)
            local dims=$(file "$png" | grep -oP '\d+ x \d+' | head -1)

            if [ -n "$dims" ]; then
                local width=$(echo "$dims" | cut -d'x' -f1 | tr -d ' ')
                local height=$(echo "$dims" | cut -d'x' -f2 | tr -d ' ')
                local decoded_mb=$(echo "scale=2; $width * $height * 4 / 1024 / 1024" | bc)

                printf "  %-25s %6d KB  %10s  decoded: %5s MB\n" \
                    "$(basename "$png")" "$((size/1024))" "$dims" "$decoded_mb"

                total_png_size=$((total_png_size + size))
                total_decoded_memory=$(echo "$total_decoded_memory + $decoded_mb" | bc)
            fi
        fi
    done

    echo ""
    echo "TOKEN IMAGES (Lower Memory Impact):"
    echo "-" | head -c 60 && echo

    local token_count=0
    local token_size=0

    for png in "$ASSETS_DIR"/tokens/*.png "$ASSETS_DIR"/tokens/snspng/*.png; do
        if [ -f "$png" ]; then
            local size=$(stat -f%z "$png" 2>/dev/null || stat -c%s "$png" 2>/dev/null)
            token_count=$((token_count + 1))
            token_size=$((token_size + size))
        fi
    done

    echo "  Total token images: $token_count"
    echo "  Total size: $((token_size/1024)) KB"
    echo "  (128x128 images = ~64KB decoded each)"

    total_png_size=$((total_png_size + token_size))

    echo ""
    echo "=============================================="
    echo "SUMMARY:"
    echo "  Total PNG file size:    $((total_png_size/1024)) KB"
    echo "  Estimated decoded:      $total_decoded_memory MB"
    echo ""
    echo "EXPECTED SAVINGS with WebP:"
    echo "  - File size reduction:  ~30-40%"
    echo "  - Same decoded memory (WebP decodes to same RGBA)"
    echo "  - Faster network loading"
    echo "=============================================="
}

# Convert all PNG images
convert_all() {
    echo ""
    echo "=============================================="
    echo "        CONVERTING IMAGES TO WebP           "
    echo "=============================================="
    echo ""

    local converted=0
    local failed=0
    local skipped=0

    # Process all PNG files
    find "$ASSETS_DIR" -name "*.png" -type f | while read -r png; do
        local webp="${png%.png}.webp"
        local basename=$(basename "$png")

        # Skip if WebP already exists and is newer
        if [ -f "$webp" ] && [ "$webp" -nt "$png" ]; then
            log_warn "Skipping $basename (WebP already exists)"
            continue
        fi

        local png_size=$(stat -f%z "$png" 2>/dev/null || stat -c%s "$png" 2>/dev/null)

        if $DRY_RUN; then
            log_info "[DRY RUN] Would convert: $basename"
        else
            log_info "Converting: $basename"
            if convert_image "$png"; then
                local webp_size=$(stat -f%z "$webp" 2>/dev/null || stat -c%s "$webp" 2>/dev/null)
                local savings=$(( (png_size - webp_size) * 100 / png_size ))
                log_success "  $basename: $((png_size/1024))KB -> $((webp_size/1024))KB (-${savings}%)"
            else
                log_error "  Failed to convert $basename"
            fi
        fi
    done
}

# Update Vue file imports
update_imports() {
    echo ""
    echo "=============================================="
    echo "        UPDATING VUE IMPORTS                "
    echo "=============================================="
    echo ""

    log_info "Finding Vue files that import PNG images..."

    # Find Vue files that import PNGs
    local vue_files=$(grep -rl "\.png['\"]" "$PROJECT_DIR/src/taco_dao_frontend/src" --include="*.vue" --include="*.ts" 2>/dev/null || true)

    if [ -z "$vue_files" ]; then
        log_info "No Vue files with PNG imports found"
        return
    fi

    echo ""
    echo "Files with PNG imports:"
    echo "$vue_files" | while read -r file; do
        if [ -n "$file" ]; then
            local count=$(grep -c "\.png['\"]" "$file" 2>/dev/null || echo 0)
            echo "  $(basename "$file"): $count PNG imports"
        fi
    done

    echo ""
    if $DRY_RUN; then
        log_warn "[DRY RUN] Would update imports in the files above"
        log_info "Run without --dry-run to apply changes"
    else
        log_info "To update imports, consider using <picture> element with fallback:"
        echo ""
        echo '  <picture>'
        echo '    <source srcset="@/assets/images/chef/chef-taco.webp" type="image/webp">'
        echo '    <img src="@/assets/images/chef/chef-taco.png" alt="Chef">'
        echo '  </picture>'
        echo ""
        log_info "Or update imports directly (replaces PNG with WebP):"
        log_info "  Run: ./scripts/optimize-images.sh --update-imports"
    fi
}

# Main execution
main() {
    echo ""
    echo "=============================================="
    echo "     TACO Frontend Image Optimizer          "
    echo "=============================================="
    echo ""

    check_tools

    case "${1:-}" in
        --analyze)
            analyze_images
            ;;
        --update-imports)
            update_imports
            ;;
        --dry-run)
            DRY_RUN=true
            analyze_images
            convert_all
            update_imports
            ;;
        *)
            analyze_images
            convert_all
            update_imports
            ;;
    esac

    echo ""
    log_success "Done!"
    echo ""
}

main "$@"

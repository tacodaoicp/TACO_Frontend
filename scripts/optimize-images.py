#!/usr/bin/env python3
"""
Image Optimization Script for TACO Frontend

Converts PNG to WebP format:
- Keeps original dimensions (no resize)
- Reduces file size by ~30-40%
- Faster network loading

NOTE: Decoded memory in browser = width × height × 4 bytes (RGBA)
This is the same for PNG and WebP - both decode to RGBA bitmaps.
To reduce decoded memory, you'd need to reduce dimensions.
"""

import os
import sys
from pathlib import Path
from typing import Optional

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip3 install Pillow")
    sys.exit(1)

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
ASSETS_DIR = PROJECT_ROOT / "src" / "taco_dao_frontend" / "src" / "assets"

# WebP Quality settings
WEBP_QUALITY = 90  # High quality (lossy)
WEBP_LOSSLESS = False  # Set True for lossless (larger files)
WEBP_METHOD = 6  # Higher = slower but better compression (0-6)

def calculate_decoded_memory(width: int, height: int) -> float:
    """Calculate decoded RGBA memory in MB"""
    return (width * height * 4) / (1024 * 1024)

def process_image(input_path: Path, dry_run: bool = False) -> Optional[dict]:
    """
    Convert a PNG to WebP keeping original dimensions.
    """
    try:
        # Get original stats
        original_size = input_path.stat().st_size
        img = Image.open(input_path)
        original_dims = img.size
        decoded_memory = calculate_decoded_memory(*original_dims)

        # Output path
        output_path = input_path.with_suffix('.webp')

        result = {
            "input": str(input_path.relative_to(ASSETS_DIR)),
            "output": str(output_path.relative_to(ASSETS_DIR)),
            "original_size_kb": original_size // 1024,
            "dimensions": f"{original_dims[0]}x{original_dims[1]}",
            "decoded_mb": round(decoded_memory, 2),
        }

        if dry_run:
            result["status"] = "dry_run"
            return result

        # Save as WebP
        # Preserve transparency if present
        if img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info):
            # Keep alpha channel
            if img.mode == 'P':
                img = img.convert('RGBA')
            if WEBP_LOSSLESS:
                img.save(output_path, 'WEBP', lossless=True, method=WEBP_METHOD)
            else:
                img.save(output_path, 'WEBP', quality=WEBP_QUALITY, method=WEBP_METHOD)
        else:
            # No alpha channel
            img = img.convert('RGB')
            if WEBP_LOSSLESS:
                img.save(output_path, 'WEBP', lossless=True, method=WEBP_METHOD)
            else:
                img.save(output_path, 'WEBP', quality=WEBP_QUALITY, method=WEBP_METHOD)

        # Get new file size
        new_file_size = output_path.stat().st_size
        savings = original_size - new_file_size
        savings_pct = (savings / original_size * 100) if original_size > 0 else 0

        result["new_size_kb"] = new_file_size // 1024
        result["saved_kb"] = savings // 1024
        result["saved_pct"] = round(savings_pct, 1)
        result["status"] = "converted"

        return result

    except Exception as e:
        return {
            "input": str(input_path),
            "status": "error",
            "error": str(e)
        }

def find_png_images(assets_dir: Path) -> list:
    """Find all PNG images in assets directory"""
    images = []
    for png_path in assets_dir.rglob("*.png"):
        images.append(png_path)
    return sorted(images, key=lambda p: p.stat().st_size, reverse=True)

def print_report(results: list):
    """Print optimization report"""
    print("\n" + "=" * 70)
    print("                    PNG → WebP CONVERSION REPORT")
    print("=" * 70)

    total_original = 0
    total_new = 0
    total_decoded = 0

    converted = [r for r in results if r.get("status") == "converted"]
    dry_run = [r for r in results if r.get("status") == "dry_run"]
    errors = [r for r in results if r.get("status") == "error"]

    items = converted if converted else dry_run

    if items:
        print("\n📦 CONVERTED IMAGES:")
        print("-" * 70)
        print(f"{'File':<40} {'PNG':>8} {'WebP':>8} {'Saved':>8} {'Decoded':>8}")
        print("-" * 70)

        for r in items:
            filename = r['input']
            if len(filename) > 38:
                filename = "..." + filename[-35:]

            orig_kb = r.get('original_size_kb', 0)
            new_kb = r.get('new_size_kb', orig_kb)  # For dry run
            saved_pct = r.get('saved_pct', 0)
            decoded = r.get('decoded_mb', 0)

            total_original += orig_kb
            total_new += new_kb
            total_decoded += decoded

            if r.get("status") == "dry_run":
                print(f"{filename:<40} {orig_kb:>6}KB {'--':>8} {'--':>8} {decoded:>6.1f}MB")
            else:
                print(f"{filename:<40} {orig_kb:>6}KB {new_kb:>6}KB {saved_pct:>6.1f}% {decoded:>6.1f}MB")

    if errors:
        print(f"\n❌ ERRORS ({len(errors)}):")
        for r in errors:
            print(f"  {r['input']}: {r.get('error', 'Unknown error')}")

    # Summary
    print("\n" + "=" * 70)
    print("                         SUMMARY")
    print("=" * 70)
    print(f"  Images processed:        {len(items)}")
    print(f"  Errors:                  {len(errors)}")
    print()
    print(f"  Total PNG size:          {total_original:,} KB ({total_original/1024:.1f} MB)")
    print(f"  Total WebP size:         {total_new:,} KB ({total_new/1024:.1f} MB)")
    print(f"  File size savings:       {total_original - total_new:,} KB ({(total_original - total_new)/1024:.1f} MB)")
    if total_original > 0:
        print(f"  Reduction:               {(total_original - total_new) / total_original * 100:.1f}%")
    print()
    print(f"  Total decoded memory:    {total_decoded:.1f} MB")
    print("  (Decoded memory is same for PNG/WebP - browser decodes both to RGBA)")
    print("=" * 70)

    print("\n📌 NEXT STEPS:")
    print("  1. Update Vue imports to use .webp instead of .png")
    print("  2. Keep PNG files as fallback for older browsers")
    print("  3. Use <picture> element for best browser support:")
    print()
    print('     <picture>')
    print('       <source srcset="@/assets/images/chef/chef-taco.webp" type="image/webp">')
    print('       <img src="@/assets/images/chef/chef-taco.png" alt="Chef">')
    print('     </picture>')
    print()

def main():
    import argparse

    parser = argparse.ArgumentParser(description="Convert PNG to WebP for TACO Frontend")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be done without making changes")
    parser.add_argument("--lossless", action="store_true", help="Use lossless WebP (larger files)")
    parser.add_argument("--quality", type=int, default=90, help="WebP quality (1-100, default 90)")
    parser.add_argument("--chef-only", action="store_true", help="Only process chef images")

    args = parser.parse_args()

    global WEBP_QUALITY, WEBP_LOSSLESS
    WEBP_QUALITY = args.quality
    WEBP_LOSSLESS = args.lossless

    print("🖼️  TACO Frontend PNG → WebP Converter")
    print(f"   Quality: {WEBP_QUALITY}  Lossless: {WEBP_LOSSLESS}")
    print()

    # Find images
    if args.chef_only:
        chef_dir = ASSETS_DIR / "images" / "chef"
        images = list(chef_dir.glob("*.png"))
    else:
        images = find_png_images(ASSETS_DIR)

    if not images:
        print("No PNG images found!")
        return

    print(f"Found {len(images)} PNG images to convert")

    if args.dry_run:
        print("\n⚠️  DRY RUN MODE - No files will be modified\n")

    # Process images
    results = []
    for img_path in images:
        print(f"Converting: {img_path.name}...", end=" ", flush=True)
        result = process_image(img_path, dry_run=args.dry_run)
        if result:
            results.append(result)
            if result.get("status") == "converted":
                print(f"✓ ({result.get('saved_pct', 0):.0f}% smaller)")
            elif result.get("status") == "dry_run":
                print("(dry run)")
            else:
                print(f"✗ {result.get('error', '')}")

    # Print report
    print_report(results)

if __name__ == "__main__":
    main()

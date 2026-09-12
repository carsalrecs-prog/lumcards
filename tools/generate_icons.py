import os
import sys
from PIL import Image, ImageDraw, ImageFont

def draw_lumcards_image(size):
    """Generate a high-quality RGBA image for Lumcards logo at specified size."""
    # Work at 4x resolution for anti-aliasing if small, or direct
    scale = 4 if size <= 128 else 2
    w = size * scale
    h = size * scale
    
    img = Image.new('RGBA', (w, h), (0, 0, 0, 0))
    
    # 1. Rounded rectangle mask with gradient
    margin = int(w * 0.04)
    radius = int(w * 0.24)
    
    mask = Image.new('L', (w, h), 0)
    mask_draw = ImageDraw.Draw(mask)
    mask_draw.rounded_rectangle([margin, margin, w - margin, h - margin], radius=radius, fill=255)
    
    # Gradient: diagonal / top-to-bottom indigo (#6366f1 to #3730a3)
    grad = Image.new('RGBA', (w, h))
    grad_draw = ImageDraw.Draw(grad)
    for y in range(h):
        ratio = y / float(h)
        # from rgb(99, 102, 241) to rgb(55, 48, 163)
        r = int(99 * (1.0 - ratio) + 55 * ratio)
        g = int(102 * (1.0 - ratio) + 48 * ratio)
        b = int(241 * (1.0 - ratio) + 163 * ratio)
        grad_draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
        
    img.paste(grad, (0, 0), mask)
    
    draw = ImageDraw.Draw(img)
    # Subtle inner border for depth
    border_w = max(1, int(w * 0.02))
    draw.rounded_rectangle([margin, margin, w - margin, h - margin], radius=radius, outline=(255, 255, 255, 55), width=border_w)
    
    # 2. Draw 'L'
    # Try finding bold fonts on Windows
    font = None
    font_size = int(w * 0.58)
    for font_name in ['arialbd.ttf', 'seguisb.ttf', 'segoeuib.ttf', 'arial.ttf']:
        try:
            font_path = os.path.join(os.environ.get('WINDIR', 'C:\\Windows'), 'Fonts', font_name)
            if os.path.exists(font_path):
                font = ImageFont.truetype(font_path, font_size)
                break
        except Exception:
            pass
            
    if font:
        # Measure text to center optically
        bbox = draw.textbbox((0, 0), "L", font=font)
        text_w = bbox[2] - bbox[0]
        text_h = bbox[3] - bbox[1]
        # Position L slightly to the left to make room for the star in top right
        l_x = int(w * 0.22)
        l_y = int((h - text_h) / 2.0 - bbox[1] * 0.5)
        draw.text((l_x, l_y), "L", fill=(255, 255, 255, 255), font=font)
    else:
        # Fallback manual polygon for L
        thickness = int(w * 0.14)
        top = int(h * 0.22)
        bottom = int(h * 0.78)
        left = int(w * 0.24)
        right = int(w * 0.65)
        draw.rectangle([left, top, left + thickness, bottom], fill=(255, 255, 255, 255))
        draw.rectangle([left, bottom - thickness, right, bottom], fill=(255, 255, 255, 255))

    # 3. 4-pointed sparkle star in top right
    cx = int(w * 0.74)
    cy = int(h * 0.26)
    r_outer = int(w * 0.13)
    r_inner = int(w * 0.038)
    
    spark_points = [
        (cx, cy - r_outer),
        (cx + r_inner, cy - r_inner),
        (cx + r_outer, cy),
        (cx + r_inner, cy + r_inner),
        (cx, cy + r_outer),
        (cx - r_inner, cy + r_inner),
        (cx - r_outer, cy),
        (cx - r_inner, cy - r_inner)
    ]
    draw.polygon(spark_points, fill=(255, 255, 255, 255))
    
    # Downsample with high quality Lanczos filter
    final_img = img.resize((size, size), Image.Resampling.LANCZOS)
    return final_img

def main():
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    assets_dir = os.path.join(root_dir, 'assets')
    os.makedirs(assets_dir, exist_ok=True)
    
    # Generate images for multiple sizes
    sizes = [16, 24, 32, 48, 64, 128, 256]
    images = [draw_lumcards_image(s) for s in sizes]
    
    # Save icon.ico with all resolutions
    ico_path = os.path.join(assets_dir, 'icon.ico')
    images[-1].save(ico_path, format='ICO', sizes=[(s, s) for s in sizes])
    print(f"Created {ico_path}")
    
    # Save icon.png (256x256)
    png_path = os.path.join(assets_dir, 'icon.png')
    images[-1].save(png_path, format='PNG')
    print(f"Created {png_path}")
    
    # Also save dist/icon.png if dist exists
    dist_png = os.path.join(root_dir, 'dist', 'icon.png')
    images[-1].save(dist_png, format='PNG')
    print(f"Created {dist_png}")

if __name__ == '__main__':
    main()

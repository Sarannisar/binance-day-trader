import os
from PIL import Image, ImageDraw

def generate_assets():
    # Base images
    trans_logo = Image.open(r'c:\Users\SERVER-GSM\Desktop\trade\logo_dark_transparent.png')
    bg_color = (11, 14, 20, 255) # #0b0e14

    # 1. Update ic_launcher_background.xml color
    color_xml_path = r'c:\Users\SERVER-GSM\Desktop\trade\android\app\src\main\res\values\ic_launcher_background.xml'
    with open(color_xml_path, 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#0b0e14</color>
</resources>
''')
    print('Updated ic_launcher_background.xml to #0b0e14')

    # 2. Android Mipmap dimensions
    # Format: (folder, standard_size, foreground_size)
    densities = [
        ('mipmap-mdpi', 48, 108),
        ('mipmap-hdpi', 72, 162),
        ('mipmap-xhdpi', 96, 216),
        ('mipmap-xxhdpi', 144, 324),
        ('mipmap-xxxhdpi', 192, 432),
    ]

    res_root = r'c:\Users\SERVER-GSM\Desktop\trade\android\app\src\main\res'

    for folder, std_size, fg_size in densities:
        dir_path = os.path.join(res_root, folder)
        os.makedirs(dir_path, exist_ok=True)

        # A) Standard square/squircle icon (std_size x std_size) with dark bg
        icon_std = Image.new('RGBA', (std_size, std_size), bg_color)
        logo_part = trans_logo.resize((int(std_size * 0.78), int(std_size * 0.78)), Image.Resampling.LANCZOS)
        offset = (int((std_size - logo_part.width) / 2), int((std_size - logo_part.height) / 2))
        icon_std.paste(logo_part, offset, logo_part)
        icon_std.save(os.path.join(dir_path, 'ic_launcher.png'))

        # B) Round icon (std_size x std_size) with circular mask
        icon_round = Image.new('RGBA', (std_size, std_size), (0, 0, 0, 0))
        mask = Image.new('L', (std_size, std_size), 0)
        draw = ImageDraw.Draw(mask)
        draw.ellipse((0, 0, std_size - 1, std_size - 1), fill=255)
        
        # Paste solid icon into circular mask
        icon_round.paste(icon_std, (0, 0), mask)
        icon_round.save(os.path.join(dir_path, 'ic_launcher_round.png'))

        # C) Foreground icon for adaptive icon (fg_size x fg_size)
        # Android guidelines: Logo should be centered in the central 66% (safe zone)
        icon_fg = Image.new('RGBA', (fg_size, fg_size), (0, 0, 0, 0))
        fg_logo_size = int(fg_size * 0.58)
        logo_fg = trans_logo.resize((fg_logo_size, fg_logo_size), Image.Resampling.LANCZOS)
        fg_offset = (int((fg_size - fg_logo_size) / 2), int((fg_size - fg_logo_size) / 2))
        icon_fg.paste(logo_fg, fg_offset, logo_fg)
        icon_fg.save(os.path.join(dir_path, 'ic_launcher_foreground.png'))

    print('Generated all Android mipmap launcher icons!')

    # 3. Splash Screens
    splash_dirs = [
        ('drawable', 480, 800),
        ('drawable-port-mdpi', 320, 480),
        ('drawable-port-hdpi', 480, 800),
        ('drawable-port-xhdpi', 720, 1280),
        ('drawable-port-xxhdpi', 960, 1600),
        ('drawable-port-xxxhdpi', 1280, 1920),
        ('drawable-land-mdpi', 480, 320),
        ('drawable-land-hdpi', 800, 480),
        ('drawable-land-xhdpi', 1280, 720),
        ('drawable-land-xxhdpi', 1600, 960),
        ('drawable-land-xxxhdpi', 1920, 1280),
    ]

    for dname, w, h in splash_dirs:
        sp_dir = os.path.join(res_root, dname)
        os.makedirs(sp_dir, exist_ok=True)
        splash_img = Image.new('RGBA', (w, h), bg_color)
        
        # Logo size: approx 35% of the smaller dimension
        dim = int(min(w, h) * 0.40)
        sp_logo = trans_logo.resize((dim, dim), Image.Resampling.LANCZOS)
        sp_offset = (int((w - dim) / 2), int((h - dim) / 2))
        splash_img.paste(sp_logo, sp_offset, sp_logo)
        splash_img.save(os.path.join(sp_dir, 'splash.png'))

    print('Generated splash screens across all orientations!')

    # 4. Web & PWA Assets
    public_dir = r'c:\Users\SERVER-GSM\Desktop\trade\public'
    os.makedirs(public_dir, exist_ok=True)

    # 512x512 app icon
    icon_512 = Image.new('RGBA', (512, 512), bg_color)
    l512 = trans_logo.resize((390, 390), Image.Resampling.LANCZOS)
    icon_512.paste(l512, (61, 61), l512)
    icon_512.save(os.path.join(public_dir, 'icon-512.png'))

    # 192x192 app icon
    icon_192 = Image.new('RGBA', (192, 192), bg_color)
    l192 = trans_logo.resize((146, 146), Image.Resampling.LANCZOS)
    icon_192.paste(l192, (23, 23), l192)
    icon_192.save(os.path.join(public_dir, 'icon-192.png'))

    # favicon.png
    fav = Image.new('RGBA', (64, 64), bg_color)
    lfav = trans_logo.resize((50, 50), Image.Resampling.LANCZOS)
    fav.paste(lfav, (7, 7), lfav)
    fav.save(os.path.join(public_dir, 'favicon.png'))

    # logo.png (transparent for Header UI)
    trans_logo.resize((128, 128), Image.Resampling.LANCZOS).save(os.path.join(public_dir, 'logo.png'))

    print('Generated web and PWA assets successfully!')

if __name__ == '__main__':
    generate_assets()

import numpy as np
from PIL import Image

def process_logo():
    src_path = r'C:/Users/SERVER-GSM/.gemini/antigravity/brain/0e1ed1f0-3408-4313-8a1c-dc6799bc4557/.user_uploaded/media_1791954957904_5926f805.png'
    img = Image.open(src_path).convert('RGBA')
    arr = np.array(img, dtype=np.float32)

    r = arr[:, :, 0]
    g = arr[:, :, 1]
    b = arr[:, :, 2]

    # Detect orange region: high red, low blue, distinct difference
    # True orange in this logo has r > 180 and r - b > 90
    is_orange = (r > 150) & (b < 140) & ((r - b) > 60)

    # Output RGBA array
    out = np.zeros((1024, 1024, 4), dtype=np.uint8)

    # 1. Background is white: where r > 240, g > 240, b > 240 and not orange
    is_pure_white = (r >= 250) & (g >= 250) & (b >= 250)

    # 2. For B (Black in original):
    # We turn it into pure white (255, 255, 255).
    # Its alpha is proportional to darkness: 255 - brightness
    brightness = (r + g + b) / 3.0
    b_alpha = np.clip(255.0 - brightness, 0, 255)

    # 3. For Orange Z:
    # Target orange color
    target_orange = np.array([255, 115, 0], dtype=np.float32) # Vibrant #ff7300
    
    # Calculate orange strength
    # When blending to white, b rises towards 255
    # When blending to black, r drops towards 0
    orange_intensity = np.clip((r - b) / 180.0, 0, 1.0) * np.clip(r / 200.0, 0, 1.0)
    
    # Fill array
    # Base: White B with b_alpha
    out[:, :, 0] = 255
    out[:, :, 1] = 255
    out[:, :, 2] = 255
    out[:, :, 3] = b_alpha.astype(np.uint8)

    # Overlay Orange Z
    # Wherever is_orange or orange_intensity > 0.2
    orange_mask = (orange_intensity > 0.15) & (b < 200)
    
    # Blend orange over white B
    for c in range(3):
        out[:, :, c] = np.where(orange_mask, int(target_orange[c]), out[:, :, c])
    out[:, :, 3] = np.where(orange_mask, 255, out[:, :, 3])

    # Clean pure white background to 0 alpha
    out[:, :, 3] = np.where(is_pure_white, 0, out[:, :, 3])

    trans_img = Image.fromarray(out, mode='RGBA')
    trans_img.save(r'c:\Users\SERVER-GSM\Desktop\trade\logo_dark_transparent.png')

    # Also generate dark theme app icon with #0b0e14 background
    bg_color = (11, 14, 20, 255) # #0b0e14
    solid_icon = Image.new('RGBA', (1024, 1024), bg_color)
    
    # Scale logo down slightly (e.g. 75% size, centered) for Android launcher icon safe margins
    logo_scaled = trans_img.resize((768, 768), Image.Resampling.LANCZOS)
    solid_icon.paste(logo_scaled, (128, 128), logo_scaled)
    solid_icon.save(r'c:\Users\SERVER-GSM\Desktop\trade\logo_dark_icon_1024.png')
    
    print('Images generated successfully!')

if __name__ == '__main__':
    process_logo()

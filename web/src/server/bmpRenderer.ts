/**
 * High-performance 800x480 1-Bit Monochrome BMP Generator for TRMNL 7.5" OG Display
 */

export interface DashboardConfig {
  title: string;
  subtitle: string;
  city: string;
  latitude: number;
  longitude: number;
  useCelsius: boolean;
  temperature: number;
  tempMax: number;
  tempMin: number;
  conditionText: string;
  humidity: number;
  windSpeed: number;
  rainProbability: number;
  cardHeader: string;
  notes: string[];
  motto: string;
  batteryPercent: number;
  batteryVoltage: number;
  wifiRssi: number;
  lastUpdated: string;
}

export class MonochromeCanvas {
  public readonly width = 800;
  public readonly height = 480;
  public readonly bytesPerRow = 100; // 800 / 8 = 100 bytes
  public buffer: Uint8Array;

  constructor() {
    this.buffer = new Uint8Array(this.width * this.height / 8);
    this.clear(1); // Default white (1)
  }

  public clear(color: 0 | 1 = 1) {
    this.buffer.fill(color === 1 ? 0xFF : 0x00);
  }

  public setPixel(x: number, y: number, color: 0 | 1) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
    const byteIndex = y * this.bytesPerRow + Math.floor(x / 8);
    const bitIndex = 7 - (x % 8);
    if (color === 1) {
      this.buffer[byteIndex] |= (1 << bitIndex);
    } else {
      this.buffer[byteIndex] &= ~(1 << bitIndex);
    }
  }

  public drawHLine(x: number, y: number, length: number, color: 0 | 1 = 0) {
    for (let i = 0; i < length; i++) {
      this.setPixel(x + i, y, color);
    }
  }

  public drawVLine(x: number, y: number, length: number, color: 0 | 1 = 0) {
    for (let i = 0; i < length; i++) {
      this.setPixel(x, y + i, color);
    }
  }

  public drawRect(x: number, y: number, w: number, h: number, color: 0 | 1 = 0) {
    this.drawHLine(x, y, w, color);
    this.drawHLine(x, y + h - 1, w, color);
    this.drawVLine(x, y, h, color);
    this.drawVLine(x + w - 1, y, h, color);
  }

  public fillRect(x: number, y: number, w: number, h: number, color: 0 | 1 = 0) {
    for (let j = 0; j < h; j++) {
      this.drawHLine(x, y + j, w, color);
    }
  }

  public drawRoundRect(x: number, y: number, w: number, h: number, r: number, color: 0 | 1 = 0) {
    this.drawHLine(x + r, y, w - 2 * r, color);
    this.drawHLine(x + r, y + h - 1, w - 2 * r, color);
    this.drawVLine(x, y + r, h - 2 * r, color);
    this.drawVLine(x + w - 1, y + r, h - 2 * r, color);
    // Corners
    this.drawCircleHelper(x + r, y + r, r, 1, color);
    this.drawCircleHelper(x + w - r - 1, y + r, r, 2, color);
    this.drawCircleHelper(x + w - r - 1, y + h - r - 1, r, 4, color);
    this.drawCircleHelper(x + r, y + h - r - 1, r, 8, color);
  }

  public fillRoundRect(x: number, y: number, w: number, h: number, r: number, color: 0 | 1 = 0) {
    this.fillRect(x + r, y, w - 2 * r, h, color);
    for (let i = 0; i < r; i++) {
      const offset = Math.floor(Math.sqrt(r * r - (r - i) * (r - i)));
      this.drawHLine(x + r - offset, y + i, offset * 2 + (w - 2 * r), color);
      this.drawHLine(x + r - offset, y + h - 1 - i, offset * 2 + (w - 2 * r), color);
    }
  }

  private drawCircleHelper(x0: number, y0: number, r: number, cornername: number, color: 0 | 1) {
    let f = 1 - r;
    let ddF_x = 1;
    let ddF_y = -2 * r;
    let x = 0;
    let y = r;

    while (x < y) {
      if (f >= 0) {
        y--;
        ddF_y += 2;
        f += ddF_y;
      }
      x++;
      ddF_x += 2;
      f += ddF_x;
      if (cornername & 0x4) {
        this.setPixel(x0 + x, y0 + y, color);
        this.setPixel(x0 + y, y0 + x, color);
      }
      if (cornername & 0x2) {
        this.setPixel(x0 + x, y0 - y, color);
        this.setPixel(x0 + y, y0 - x, color);
      }
      if (cornername & 0x8) {
        this.setPixel(x0 - y, y0 + x, color);
        this.setPixel(x0 - x, y0 + y, color);
      }
      if (cornername & 0x1) {
        this.setPixel(x0 - y, y0 - x, color);
        this.setPixel(x0 - x, y0 - y, color);
      }
    }
  }

  public drawCircle(x0: number, y0: number, r: number, color: 0 | 1 = 0) {
    let f = 1 - r;
    let ddF_x = 1;
    let ddF_y = -2 * r;
    let x = 0;
    let y = r;

    this.setPixel(x0, y0 + r, color);
    this.setPixel(x0, y0 - r, color);
    this.setPixel(x0 + r, y0, color);
    this.setPixel(x0 - r, y0, color);

    while (x < y) {
      if (f >= 0) {
        y--;
        ddF_y += 2;
        f += ddF_y;
      }
      x++;
      ddF_x += 2;
      f += ddF_x;

      this.setPixel(x0 + x, y0 + y, color);
      this.setPixel(x0 - x, y0 + y, color);
      this.setPixel(x0 + x, y0 - y, color);
      this.setPixel(x0 - x, y0 - y, color);
      this.setPixel(x0 + y, y0 + x, color);
      this.setPixel(x0 - y, y0 + x, color);
      this.setPixel(x0 + y, y0 - x, color);
      this.setPixel(x0 - y, y0 - x, color);
    }
  }

  public fillCircle(x0: number, y0: number, r: number, color: 0 | 1 = 0) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r) {
          this.setPixel(x0 + x, y0 + y, color);
        }
      }
    }
  }

  /**
   * Built-in Clean Bitmap Font Renderer (5x7 base with scaling)
   */
  public drawText(text: string, startX: number, startY: number, size: number = 2, color: 0 | 1 = 0) {
    const FONT_5X7: { [key: string]: number[] } = {
      ' ': [0x00, 0x00, 0x00, 0x00, 0x00],
      '!': [0x00, 0x00, 0x5F, 0x00, 0x00],
      '"': [0x00, 0x07, 0x00, 0x07, 0x00],
      '#': [0x14, 0x7F, 0x14, 0x7F, 0x14],
      '$': [0x24, 0x2A, 0x7F, 0x2A, 0x12],
      '%': [0x23, 0x13, 0x08, 0x64, 0x62],
      '&': [0x36, 0x49, 0x55, 0x22, 0x50],
      '\'': [0x00, 0x05, 0x03, 0x00, 0x00],
      '(': [0x00, 0x1C, 0x22, 0x41, 0x00],
      ')': [0x00, 0x41, 0x22, 0x1C, 0x00],
      '*': [0x14, 0x08, 0x3E, 0x08, 0x14],
      '+': [0x08, 0x08, 0x3E, 0x08, 0x08],
      ',': [0x00, 0x50, 0x30, 0x00, 0x00],
      '-': [0x08, 0x08, 0x08, 0x08, 0x08],
      '.': [0x00, 0x60, 0x60, 0x00, 0x00],
      '/': [0x20, 0x10, 0x08, 0x04, 0x02],
      '0': [0x3E, 0x51, 0x49, 0x45, 0x3E],
      '1': [0x00, 0x42, 0x7F, 0x40, 0x00],
      '2': [0x42, 0x61, 0x51, 0x49, 0x46],
      '3': [0x21, 0x41, 0x45, 0x4B, 0x31],
      '4': [0x18, 0x14, 0x12, 0x7F, 0x10],
      '5': [0x27, 0x45, 0x45, 0x45, 0x39],
      '6': [0x3C, 0x4A, 0x49, 0x49, 0x30],
      '7': [0x01, 0x71, 0x09, 0x05, 0x03],
      '8': [0x36, 0x49, 0x49, 0x49, 0x36],
      '9': [0x06, 0x49, 0x49, 0x29, 0x1E],
      ':': [0x00, 0x36, 0x36, 0x00, 0x00],
      ';': [0x00, 0x56, 0x36, 0x00, 0x00],
      '<': [0x08, 0x14, 0x22, 0x41, 0x00],
      '=': [0x14, 0x14, 0x14, 0x14, 0x14],
      '>': [0x00, 0x41, 0x22, 0x14, 0x08],
      '?': [0x02, 0x01, 0x51, 0x09, 0x06],
      '@': [0x32, 0x49, 0x79, 0x41, 0x3E],
      'A': [0x7E, 0x11, 0x11, 0x11, 0x7E],
      'B': [0x7F, 0x49, 0x49, 0x49, 0x36],
      'C': [0x3E, 0x41, 0x41, 0x41, 0x22],
      'D': [0x7F, 0x41, 0x41, 0x22, 0x1C],
      'E': [0x7F, 0x49, 0x49, 0x49, 0x41],
      'F': [0x7F, 0x09, 0x09, 0x09, 0x01],
      'G': [0x3E, 0x41, 0x49, 0x49, 0x7A],
      'H': [0x7F, 0x08, 0x08, 0x08, 0x7F],
      'I': [0x00, 0x41, 0x7F, 0x41, 0x00],
      'J': [0x20, 0x40, 0x41, 0x3F, 0x01],
      'K': [0x7F, 0x08, 0x14, 0x22, 0x41],
      'L': [0x7F, 0x40, 0x40, 0x40, 0x40],
      'M': [0x7F, 0x02, 0x0C, 0x02, 0x7F],
      'N': [0x7F, 0x04, 0x08, 0x10, 0x7F],
      'O': [0x3E, 0x41, 0x41, 0x41, 0x3E],
      'P': [0x7F, 0x09, 0x09, 0x09, 0x06],
      'Q': [0x3E, 0x41, 0x51, 0x21, 0x5E],
      'R': [0x7F, 0x09, 0x19, 0x29, 0x46],
      'S': [0x46, 0x49, 0x49, 0x49, 0x31],
      'T': [0x01, 0x01, 0x7F, 0x01, 0x01],
      'U': [0x3F, 0x40, 0x40, 0x40, 0x3F],
      'V': [0x1F, 0x20, 0x40, 0x20, 0x1F],
      'W': [0x7F, 0x20, 0x18, 0x20, 0x7F],
      'X': [0x63, 0x14, 0x08, 0x14, 0x63],
      'Y': [0x07, 0x08, 0x70, 0x08, 0x07],
      'Z': [0x61, 0x51, 0x49, 0x45, 0x43],
      'a': [0x20, 0x54, 0x54, 0x54, 0x78],
      'b': [0x7F, 0x48, 0x44, 0x44, 0x38],
      'c': [0x38, 0x44, 0x44, 0x44, 0x20],
      'd': [0x38, 0x44, 0x44, 0x48, 0x7F],
      'e': [0x38, 0x54, 0x54, 0x54, 0x18],
      'f': [0x08, 0x7E, 0x09, 0x01, 0x02],
      'g': [0x0C, 0x52, 0x52, 0x52, 0x3E],
      'h': [0x7F, 0x08, 0x04, 0x04, 0x78],
      'i': [0x00, 0x44, 0x7D, 0x40, 0x00],
      'j': [0x20, 0x40, 0x44, 0x3D, 0x00],
      'k': [0x7F, 0x10, 0x28, 0x44, 0x00],
      'l': [0x00, 0x41, 0x7F, 0x40, 0x00],
      'm': [0x7C, 0x04, 0x18, 0x04, 0x78],
      'n': [0x7C, 0x08, 0x04, 0x04, 0x78],
      'o': [0x38, 0x44, 0x44, 0x44, 0x38],
      'p': [0x7C, 0x14, 0x14, 0x14, 0x08],
      'q': [0x08, 0x14, 0x14, 0x18, 0x7C],
      'r': [0x7C, 0x08, 0x04, 0x04, 0x08],
      's': [0x48, 0x54, 0x54, 0x54, 0x20],
      't': [0x04, 0x3F, 0x44, 0x40, 0x20],
      'u': [0x3C, 0x40, 0x40, 0x20, 0x7C],
      'v': [0x1C, 0x20, 0x40, 0x20, 0x1C],
      'w': [0x3C, 0x40, 0x30, 0x40, 0x3C],
      'x': [0x44, 0x28, 0x10, 0x28, 0x44],
      'y': [0x0C, 0x50, 0x50, 0x50, 0x3C],
      'z': [0x44, 0x64, 0x54, 0x4C, 0x44],
      '•': [0x00, 0x18, 0x18, 0x00, 0x00],
      '°': [0x00, 0x06, 0x09, 0x06, 0x00]
    };

    let cursorX = startX;
    for (let char of text) {
      const glyph = FONT_5X7[char] || FONT_5X7['?'] || [0x00, 0x00, 0x00, 0x00, 0x00];
      for (let col = 0; col < 5; col++) {
        const line = glyph[col];
        for (let row = 0; row < 7; row++) {
          if ((line >> row) & 1) {
            this.fillRect(cursorX + col * size, startY + row * size, size, size, color);
          }
        }
      }
      cursorX += (5 + 1) * size;
    }
  }

  /**
   * Generates standard 1-Bit Monochrome BMP File Buffer
   */
  public toBmpBuffer(): Buffer {
    const fileHeaderSize = 14;
    const dibHeaderSize = 40;
    const paletteSize = 8;
    const pixelArraySize = this.bytesPerRow * this.height; // 48,000 bytes
    const totalFileSize = fileHeaderSize + dibHeaderSize + paletteSize + pixelArraySize; // 48,062 bytes

    const buffer = Buffer.alloc(totalFileSize);

    // 1. BMP Header (14 bytes)
    buffer.write('BM', 0);                          // Signature
    buffer.writeUInt32LE(totalFileSize, 2);         // File size
    buffer.writeUInt32LE(0, 6);                     // Reserved
    buffer.writeUInt32LE(fileHeaderSize + dibHeaderSize + paletteSize, 10); // Offset to pixel array

    // 2. DIB Header (BITMAPINFOHEADER - 40 bytes)
    buffer.writeUInt32LE(dibHeaderSize, 14);        // DIB Header size
    buffer.writeInt32LE(this.width, 18);            // Width (800)
    buffer.writeInt32LE(this.height, 22);           // Height (480) - positive = bottom-up
    buffer.writeUInt16LE(1, 26);                    // Color planes
    buffer.writeUInt16LE(1, 28);                    // Bits per pixel (1-bit monochrome)
    buffer.writeUInt32LE(0, 30);                    // Compression (0 = BI_RGB)
    buffer.writeUInt32LE(pixelArraySize, 34);       // Image size
    buffer.writeInt32LE(2835, 38);                  // X pixels per meter (~72 DPI)
    buffer.writeInt32LE(2835, 42);                  // Y pixels per meter (~72 DPI)
    buffer.writeUInt32LE(2, 46);                    // Colors in palette
    buffer.writeUInt32LE(2, 50);                    // Important colors

    // 3. Color Palette (8 bytes): Index 0 = Black, Index 1 = White
    buffer[54] = 0x00; buffer[55] = 0x00; buffer[56] = 0x00; buffer[57] = 0x00; // 0 = Black
    buffer[58] = 0xFF; buffer[59] = 0xFF; buffer[60] = 0xFF; buffer[61] = 0x00; // 1 = White

    // 4. Pixel Array (Bottom-up format for standard BMP)
    const pixelOffset = 62;
    for (let row = 0; row < this.height; row++) {
      // In bottom-up BMP, row 0 in file is bottom of image (height - 1 - row)
      const srcRow = this.height - 1 - row;
      const srcOffset = srcRow * this.bytesPerRow;
      const dstOffset = pixelOffset + row * this.bytesPerRow;
      for (let col = 0; col < this.bytesPerRow; col++) {
        buffer[dstOffset + col] = this.buffer[srcOffset + col];
      }
    }

    return buffer;
  }
}

/**
 * Render Complete Dashboard into 800x480 Monochrome Canvas
 */
export function renderDashboardImage(config: DashboardConfig): Buffer {
  const canvas = new MonochromeCanvas();

  // ===========================================================================
  // 1. TOP HEADER BAR
  // ===========================================================================
  const now = new Date();
  const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const dateStr = `${days[now.getDay()]}, ${months[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;

  // Date
  canvas.drawText(dateStr, 25, 22, 2, 0);

  // Wi-Fi & Battery Status
  canvas.drawText(`WiFi ${config.wifiRssi}dB`, 520, 22, 2, 0);
  canvas.drawText(`${config.batteryPercent}% ${config.batteryVoltage.toFixed(2)}V`, 650, 22, 2, 0);

  // Battery Icon
  canvas.drawRoundRect(740, 20, 36, 18, 2, 0);
  canvas.fillRect(776, 24, 3, 10, 0);
  const fillW = Math.round((config.batteryPercent / 100) * 30);
  if (fillW > 0) canvas.fillRect(743, 23, fillW, 12, 0);

  // Double horizontal divider
  canvas.drawHLine(20, 52, 760, 0);
  canvas.drawHLine(20, 54, 760, 0);

  // ===========================================================================
  // 2. HERO DIGITAL CLOCK & GREETING BAR
  // ===========================================================================
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const timeStr = `${hours}:${minutes}`;

  // Giant Clock
  canvas.drawText(timeStr, 25, 75, 7, 0);

  // Subtitle
  canvas.drawText(`${config.title} • ${config.city}`, 260, 85, 3, 0);
  canvas.drawText(config.subtitle, 260, 115, 2, 0);

  canvas.drawHLine(20, 142, 760, 0);

  // ===========================================================================
  // 3. LEFT COLUMN: WEATHER CARD
  // ===========================================================================
  const c1_x = 20, c1_y = 155, c1_w = 365, c1_h = 265;
  canvas.drawRoundRect(c1_x, c1_y, c1_w, c1_h, 8, 0);
  canvas.fillRoundRect(c1_x, c1_y, c1_w, 32, 8, 0);
  canvas.fillRect(c1_x, c1_y + 20, c1_w, 12, 0);

  // Card Header (White on Black)
  canvas.drawText('LIVE WEATHER & FORECAST', c1_x + 15, c1_y + 10, 2, 1);

  // Big Temperature
  const tempStr = `${Math.round(config.temperature)}°${config.useCelsius ? 'C' : 'F'}`;
  canvas.drawText(tempStr, c1_x + 20, c1_y + 55, 6, 0);

  // Condition Text
  canvas.drawText(config.conditionText.toUpperCase(), c1_x + 20, c1_y + 115, 3, 0);
  canvas.drawHLine(c1_x + 15, c1_y + 145, c1_w - 30, 0);

  // Weather Metrics
  let mY = c1_y + 165;
  const mStep = 24;
  canvas.drawText(`Range : H ${Math.round(config.tempMax)}° / L ${Math.round(config.tempMin)}°`, c1_x + 20, mY, 2, 0); mY += mStep;
  canvas.drawText(`Humidity    : ${config.humidity}%`, c1_x + 20, mY, 2, 0); mY += mStep;
  canvas.drawText(`Wind Speed  : ${config.windSpeed.toFixed(1)} ${config.useCelsius ? 'km/h' : 'mph'}`, c1_x + 20, mY, 2, 0); mY += mStep;
  canvas.drawText(`Rain Chance : ${config.rainProbability}%`, c1_x + 20, mY, 2, 0);

  // ===========================================================================
  // 4. RIGHT COLUMN: AGENDA & FOCUS CARD
  // ===========================================================================
  const c2_x = 405, c2_y = 155, c2_w = 375, c2_h = 265;
  canvas.drawRoundRect(c2_x, c2_y, c2_w, c2_h, 8, 0);
  canvas.fillRoundRect(c2_x, c2_y, c2_w, 32, 8, 0);
  canvas.fillRect(c2_x, c2_y + 20, c2_w, 12, 0);

  canvas.drawText(config.cardHeader.toUpperCase(), c2_x + 15, c2_y + 10, 2, 1);

  // Agenda Notes
  let aY = c2_y + 55;
  const aStep = 28;
  for (let i = 0; i < Math.min(config.notes.length, 3); i++) {
    canvas.drawText(config.notes[i], c2_x + 15, aY, 2, 0);
    aY += aStep;
  }

  // Inverted Motto Card
  const qY = c2_y + 150;
  canvas.fillRoundRect(c2_x + 12, qY, c2_w - 24, 100, 6, 0);
  canvas.drawText('DAILY INSPIRATION:', c2_x + 25, qY + 15, 2, 1);
  canvas.drawText(config.motto, c2_x + 25, qY + 45, 2, 1);

  // ===========================================================================
  // 5. FOOTER
  // ===========================================================================
  canvas.drawHLine(20, 435, 760, 0);
  canvas.drawText(`TRMNL 7.5" OG DIY Kit • Last Sync: ${config.lastUpdated} • Auto-refresh active`, 25, 452, 2, 0);

  return canvas.toBmpBuffer();
}

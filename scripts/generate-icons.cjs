const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const outputDirectory = path.resolve(__dirname, "..", "assets", "icons");
fs.mkdirSync(outputDirectory, { recursive: true });

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, "ascii");
  const body = Buffer.concat([typeBuffer, data]);
  const header = Buffer.alloc(4);
  header.writeUInt32BE(data.length, 0);
  const checksum = Buffer.alloc(4);
  checksum.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([header, body, checksum]);
}

function icnsChunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([header, data]);
}

function parseColor(value) {
  const normalized = value.trim().replace("#", "");
  const hex = normalized.length === 3
    ? normalized.split("").map((component) => component + component).join("")
    : normalized;
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
    255,
  ];
}

function attribute(attributes, name, fallback) {
  const match = attributes.match(new RegExp(`${name}=["']([^"']+)["']`));
  return match ? match[1] : fallback;
}

function parseSvg(svgSource) {
  const gradientAttributes = svgSource.match(/<linearGradient\b([^>]*)>/)?.[1] || "";
  const stops = [...svgSource.matchAll(/<stop\b([^>]*)\/?/g)].map((match) => ({
    offset: Number.parseFloat(attribute(match[1], "offset", "0")) || 0,
    color: parseColor(attribute(match[1], "stop-color", "#000000")),
  }));
  const rectAttributes = svgSource.match(/<rect\b([^>]*)\/?/ )?.[1] || "";
  const circles = [...svgSource.matchAll(/<circle\b([^>]*)\/?/g)].map((match) => ({
    cx: Number.parseFloat(attribute(match[1], "cx", "0")),
    cy: Number.parseFloat(attribute(match[1], "cy", "0")),
    radius: Number.parseFloat(attribute(match[1], "r", "0")),
    color: parseColor(attribute(match[1], "fill", "#000000")),
  }));

  if (stops.length < 2 || !rectAttributes || !circles.length) {
    throw new Error("icon.svg must contain a gradient background and circle artwork.");
  }

  return {
    viewBoxSize: 512,
    gradientStart: parseColor(stops[0].color.map((component) => component.toString(16).padStart(2, "0")).join("")),
    gradientEnd: parseColor(stops[stops.length - 1].color.map((component) => component.toString(16).padStart(2, "0")).join("")),
    cornerRadius: Number.parseFloat(attribute(rectAttributes, "rx", "0")),
    circles,
  };
}

function blend(base, overlay) {
  const alpha = overlay[3] / 255;
  return [
    Math.round(base[0] * (1 - alpha) + overlay[0] * alpha),
    Math.round(base[1] * (1 - alpha) + overlay[1] * alpha),
    Math.round(base[2] * (1 - alpha) + overlay[2] * alpha),
    255,
  ];
}

function png(size, artwork) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = row + 1 + x * 4;
      const svgX = (x + 0.5) * artwork.viewBoxSize / size;
      const svgY = (y + 0.5) * artwork.viewBoxSize / size;
      const t = (svgX + svgY) / (artwork.viewBoxSize * 2);
      let pixel = [
        Math.round(artwork.gradientStart[0] * (1 - t) + artwork.gradientEnd[0] * t),
        Math.round(artwork.gradientStart[1] * (1 - t) + artwork.gradientEnd[1] * t),
        Math.round(artwork.gradientStart[2] * (1 - t) + artwork.gradientEnd[2] * t),
        255,
      ];
      const radius = artwork.cornerRadius;
      const cornerX = Math.min(svgX, artwork.viewBoxSize - svgX);
      const cornerY = Math.min(svgY, artwork.viewBoxSize - svgY);
      const inCorner = cornerX < radius && cornerY < radius;
      const cornerDistance = Math.hypot(radius - cornerX, radius - cornerY);
      const inside = !inCorner || cornerDistance <= radius;
      raw[offset] = pixel[0];
      raw[offset + 1] = pixel[1];
      raw[offset + 2] = pixel[2];
      raw[offset + 3] = inside ? 255 : 0;
      for (const circle of artwork.circles) {
        if (Math.hypot(svgX - circle.cx, svgY - circle.cy) <= circle.radius) {
          pixel = blend(pixel, circle.color);
          raw[offset] = pixel[0];
          raw[offset + 1] = pixel[1];
          raw[offset + 2] = pixel[2];
          raw[offset + 3] = inside ? 255 : 0;
        }
      }
    }
  }

  const signature = Buffer.from("89504e470d0a1a0a", "hex");
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const end = Buffer.from("0000000049454e44ae426082", "hex");
  return Buffer.concat([
    signature,
    pngChunk("IHDR", header),
    pngChunk("IDAT", zlib.deflateSync(raw)),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const svgPath = path.join(outputDirectory, "icon.svg");
if (!fs.existsSync(svgPath)) throw new Error(`Missing icon source: ${svgPath}`);
const svgSource = fs.readFileSync(svgPath, "utf8");
const artwork = parseSvg(svgSource);
const iconSizes = [16, 32, 48, 64, 128, 256];
const images = iconSizes.map((size) => png(size, artwork));
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(images.length, 4);

let offset = 6 + images.length * 16;
const icoEntries = images.map((image, index) => {
  const entry = Buffer.alloc(16);
  const size = iconSizes[index];
  entry[0] = size === 256 ? 0 : size;
  entry[1] = size === 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(image.length, 8);
  entry.writeUInt32LE(offset, 12);
  offset += image.length;
  return entry;
});
fs.writeFileSync(path.join(outputDirectory, "icon.ico"), Buffer.concat([icoHeader, ...icoEntries, ...images]));

const icnsPayload = icnsChunk("ic09", images[images.length - 1]);
const icnsHeader = Buffer.alloc(8);
icnsHeader.write("icns", 0, 4, "ascii");
icnsHeader.writeUInt32BE(icnsPayload.length + 8, 4);
fs.writeFileSync(path.join(outputDirectory, "icon.icns"), Buffer.concat([icnsHeader, icnsPayload]));

console.log(`Generated icons in ${outputDirectory}`);

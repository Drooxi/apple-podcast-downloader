const fs = require("fs");
const path = require("path");
const zlib = require("zlib");

const outputDirectory = path.resolve(__dirname, "..", "assets", "icons");
fs.mkdirSync(outputDirectory, { recursive: true });

function chunk(type, data) {
  const header = Buffer.alloc(8);
  header.write(type, 0, 4, "ascii");
  header.writeUInt32BE(data.length + 8, 4);
  return Buffer.concat([header, data]);
}

function png(size) {
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y += 1) {
    const row = y * (size * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < size; x += 1) {
      const offset = row + 1 + x * 4;
      const t = (x + y) / (size * 2);
      const dx = x - size / 2;
      const dy = y - size / 2;
      const distance = Math.sqrt(dx * dx + dy * dy) / (size / 2);
      raw[offset] = Math.round(255 * (1 - t) + 220 * t);
      raw[offset + 1] = Math.round(54 * (1 - t) + 55 * t);
      raw[offset + 2] = Math.round(126 * (1 - t) + 238 * t);
      raw[offset + 3] = distance <= 1 ? 255 : 0;
    }
  }

  const signature = Buffer.from("89504e470d0a1a0a", "hex");
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  const end = Buffer.from("0000000049454e44ae426082", "hex");
  return Buffer.concat([signature, chunk("IHDR", header), chunk("IDAT", zlib.deflateSync(raw)), end]);
}

const image = png(512);
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(1, 4);
const icoEntry = Buffer.alloc(16);
icoEntry[0] = 0;
icoEntry[1] = 0;
icoEntry[2] = 0;
icoEntry[3] = 0;
icoEntry.writeUInt16LE(1, 4);
icoEntry.writeUInt16LE(32, 6);
icoEntry.writeUInt32LE(image.length, 8);
icoEntry.writeUInt32LE(22, 12);
fs.writeFileSync(path.join(outputDirectory, "icon.ico"), Buffer.concat([icoHeader, icoEntry, image]));

const icnsPayload = chunk("ic09", image);
const icnsHeader = Buffer.alloc(8);
icnsHeader.write("icns", 0, 4, "ascii");
icnsHeader.writeUInt32BE(icnsPayload.length + 8, 4);
fs.writeFileSync(path.join(outputDirectory, "icon.icns"), Buffer.concat([icnsHeader, icnsPayload]));

fs.writeFileSync(
  path.join(outputDirectory, "icon.svg"),
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#ff367e"/><stop offset="1" stop-color="#dc37ee"/></linearGradient></defs><rect width="512" height="512" rx="128" fill="url(#g)"/><circle cx="180" cy="180" r="58" fill="#fff"/><circle cx="290" cy="265" r="38" fill="#f4d6ff"/><circle cx="365" cy="340" r="22" fill="#e7b2ff"/></svg>`,
);

console.log(`Generated icons in ${outputDirectory}`);

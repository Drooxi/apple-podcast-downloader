const fs = require("node:fs");
const path = require("node:path");

const outputDirectory = path.resolve(__dirname, "..", "out", "make");

fs.rmSync(outputDirectory, { recursive: true, force: true });
console.log(`Cleaned Electron Builder output: ${outputDirectory}`);

const path = require("node:path");
const downloader = require("./core/podcast-downloader.cjs");

if (require.main === module) {
    downloader.runDownload({
        outputDir: path.resolve(process.argv[2] || "episodes"),
    }).catch((error) => {
        console.error(error.message);
        process.exitCode = 1;
    });
}

module.exports = downloader;

const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "extension", "icons");
fs.mkdirSync(dir, { recursive: true });

// Minimal valid 1x1 purple PNG (base64)
const png = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

for (const size of [16, 48, 128]) {
  fs.writeFileSync(path.join(dir, `icon${size}.png`), png);
}

console.log("Extension icons created.");

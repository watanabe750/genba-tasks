import fs from "node:fs/promises";
import sharp from "sharp";

const src = "public/icon.svg";
await fs.mkdir("public/icons", { recursive: true });

await Promise.all([
  sharp(src).resize(192, 192).png().toFile("public/icons/icon-192.png"),
  sharp(src).resize(512, 512).png().toFile("public/icons/icon-512.png"),
  sharp(src).resize(512, 512).png().toFile("public/icons/maskable-512.png"),
  sharp(src).resize(32, 32).png().toFile("public/favicon-32.png"),
  sharp(src).resize(16, 16).png().toFile("public/favicon-16.png")
]);

console.log("icons generated → public/icons & public/favicon-*.png");

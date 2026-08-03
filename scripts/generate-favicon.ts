/* eslint-disable @typescript-eslint/no-require-imports */
/**
 * Generate src/app/icon.png + src/app/favicon.ico từ source logo PNG.
 *
 * Cách dùng:
 *   pnpm tsx scripts/generate-favicon.ts <source.png>
 *
 * Output:
 *   - src/app/icon.png   (256×256, Next.js auto-injects <link rel="icon">)
 *   - src/app/favicon.ico (multi-size 16/32/48, PNG-encoded inside ICO)
 *
 * Format ICO multi-size: 6-byte header + N×16-byte entry + N PNG chunks.
 * Modern ICO chấp nhận PNG nhúng (không phải BMP) — mọi browser 2010+ OK.
 */
import { writeFileSync } from "node:fs";
import { resolve } from "node:path";

import sharp from "sharp";

const sourcePathArg = process.argv[2];
if (!sourcePathArg) {
  console.error("Usage: tsx scripts/generate-favicon.ts <source.png>");
  process.exit(1);
}

const sourcePath = resolve(process.cwd(), sourcePathArg);
const appDir = resolve(process.cwd(), "src/app");
const publicDir = resolve(process.cwd(), "public");
const iconPngPath = resolve(appDir, "icon.png");
const faviconIcoPath = resolve(appDir, "favicon.ico");

// PWA icons referenced bởi src/app/manifest.ts. Trước đây 404 vì chưa có
// file - generate ở đây để fix luôn.
const PWA_ICONS: Array<{ size: number; name: string }> = [
  { size: 16, name: "favicon-16x16.png" },
  { size: 32, name: "favicon-32x32.png" },
  { size: 180, name: "apple-touch-icon.png" },
  { size: 192, name: "android-chrome-192x192.png" },
  { size: 512, name: "android-chrome-512x512.png" },
];

async function main() {
  // Bắt buộc ensureAlpha() để PNG output là RGBA 4 kênh. Logo Cursor source
  // có thể là RGB (không alpha) -> sharp default sẽ xuất PNG RGB và làm
  // Next.js Turbopack reject favicon.ico với lỗi "The PNG is not in RGBA
  // format!" khi build.
  const src = sharp(sourcePath).ensureAlpha();

  // 1) icon.png 256×256 cho Next.js App Router auto-inject favicon link.
  //    Dùng `cover` để giữ tỉ lệ. Background trong suốt phòng case logo có alpha.
  await src
    .clone()
    .resize(256, 256, { fit: "cover", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, force: true })
    .toFile(iconPngPath);
  console.log("✔ wrote", iconPngPath);

  // 2) favicon.ico multi-size (16, 32, 48) — PNG-embedded ICO. PNG bên trong
  //    PHẢI là RGBA 8-bit (Next.js requirement) -> ensureAlpha() ở src đã
  //    đảm bảo điều này.
  const sizes = [16, 32, 48];
  const pngBuffers = await Promise.all(
    sizes.map((size) =>
      sharp(sourcePath)
        .ensureAlpha()
        .resize(size, size, {
          fit: "cover",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9, force: true })
        .toBuffer(),
    ),
  );

  // Build ICO container
  const headerSize = 6;
  const entrySize = 16;
  const headerTotal = headerSize + entrySize * sizes.length;

  const header = Buffer.alloc(headerTotal);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type = 1 (ICO)
  header.writeUInt16LE(sizes.length, 4); // count

  let offset = headerTotal;
  for (let i = 0; i < sizes.length; i++) {
    const size = sizes[i];
    const png = pngBuffers[i];
    const entryOffset = headerSize + entrySize * i;
    // width/height: 0 nghĩa 256, các size khác ghi trực tiếp
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 0);
    header.writeUInt8(size === 256 ? 0 : size, entryOffset + 1);
    header.writeUInt8(0, entryOffset + 2); // color count (0 = >=256 colors)
    header.writeUInt8(0, entryOffset + 3); // reserved
    header.writeUInt16LE(1, entryOffset + 4); // color planes
    header.writeUInt16LE(32, entryOffset + 6); // bits per pixel
    header.writeUInt32LE(png.length, entryOffset + 8); // data size
    header.writeUInt32LE(offset, entryOffset + 12); // data offset
    offset += png.length;
  }

  const ico = Buffer.concat([header, ...pngBuffers]);
  writeFileSync(faviconIcoPath, ico);
  console.log("✔ wrote", faviconIcoPath, `(${ico.length} bytes, ${sizes.length} sizes)`);

  // 3) PWA icons cho manifest.ts (public/) — generate song song. Cũng dùng
  //    RGBA để consistent + browser/PWA strict mode happy.
  await Promise.all(
    PWA_ICONS.map(async ({ size, name }) => {
      const out = resolve(publicDir, name);
      await sharp(sourcePath)
        .ensureAlpha()
        .resize(size, size, {
          fit: "cover",
          background: { r: 0, g: 0, b: 0, alpha: 0 },
        })
        .png({ compressionLevel: 9, force: true })
        .toFile(out);
      console.log("✔ wrote", out);
    }),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

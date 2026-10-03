#!/usr/bin/env node
/**
 * ===========================================================================
 * LUMEN — PWA icon generator
 * ===========================================================================
 *   npm run icons
 *
 * Draws the LUMEN mark — a glowing clinical cross on near-black — as SVG and
 * lets sharp rasterise it into the exact PNGs the web manifest and the iOS
 * head tags ask for:
 *
 *   public/icons/icon-192.png            192×192   (manifest "any")
 *   public/icons/icon-512.png            512×512   (manifest "any")
 *   public/icons/icon-maskable-512.png   512×512   (manifest "maskable")
 *   public/icons/apple-touch-icon.png    180×180   (iOS home screen)
 *   public/icons/splash.png             1170×2532  (iOS startup image)
 *
 * Run this whenever the brand changes. The output is committed, so a fresh
 * clone that never runs the script still installs correctly on a phone.
 */

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "public", "icons");

const BG = "#0A0A0A";
const ACCENT = "#39FF88";

/** Bars of the cross, in a 512×512 design space centred on (256, 256). */
const CROSS_BARS = [
  { x: 210, y: 112, width: 92, height: 288 }, // vertical arm
  { x: 112, y: 210, width: 288, height: 92 }, // horizontal arm
];

function bars() {
  return CROSS_BARS.map(
    (bar) =>
      `<rect x="${bar.x}" y="${bar.y}" width="${bar.width}" height="${bar.height}" rx="30" fill="${ACCENT}"/>`,
  ).join("\n    ");
}

/** Positions the cross around (256, 256) scaled about the centre. */
function crossGroup(scale) {
  const offset = (512 - 512 * scale) / 2;
  return `<g transform="translate(${offset} ${offset}) scale(${scale})">
    ${bars()}
  </g>`;
}

function defs(strongestOpacity) {
  return `<defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${ACCENT}" stop-opacity="${strongestOpacity}"/>
      <stop offset="65%" stop-color="${ACCENT}" stop-opacity="${strongestOpacity / 4}"/>
      <stop offset="100%" stop-color="${ACCENT}" stop-opacity="0"/>
    </radialGradient>
  </defs>`;
}

/** Home-screen icon: rounded square, ambient glow, cross. */
function iconSvg({ size, maskable = false }) {
  const rx = maskable ? 0 : 104;
  // A maskable icon is cropped by the launcher, so keep the mark inside the
  // central 80% safe zone (scale 0.72 ≈ 74% of the canvas).
  const scale = maskable ? 0.72 : 1;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  ${defs(0.3)}
  <rect width="512" height="512" rx="${rx}" fill="${BG}"/>
  <circle cx="256" cy="256" r="220" fill="url(#glow)"/>
  ${crossGroup(scale)}
</svg>`;
}

/** iOS startup image: the same mark centred on a tall dark canvas. */
function splashSvg({ width, height, scale = 1.1 }) {
  const cx = width / 2;
  const cy = height / 2;
  const offsetX = cx - 256 * scale;
  const offsetY = cy - 256 * scale;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  ${defs(0.22)}
  <rect width="${width}" height="${height}" fill="${BG}"/>
  <circle cx="${cx}" cy="${cy}" r="${Math.min(width, height) * 0.44}" fill="url(#glow)"/>
  <g transform="translate(${offsetX} ${offsetY}) scale(${scale})">
    ${bars()}
  </g>
</svg>`;
}

const TARGETS = [
  { file: "icon-192.png", width: 192, height: 192, svg: iconSvg({ size: 192 }) },
  { file: "icon-512.png", width: 512, height: 512, svg: iconSvg({ size: 512 }) },
  {
    file: "icon-maskable-512.png",
    width: 512,
    height: 512,
    svg: iconSvg({ size: 512, maskable: true }),
  },
  {
    file: "apple-touch-icon.png",
    width: 180,
    height: 180,
    svg: iconSvg({ size: 180 }),
  },
  {
    file: "splash.png",
    width: 1170,
    height: 2532,
    svg: splashSvg({ width: 1170, height: 2532 }),
  },
];

async function main() {
  await mkdir(outDir, { recursive: true });

  for (const target of TARGETS) {
    await sharp(Buffer.from(target.svg))
      .resize(target.width, target.height)
      .png({ compressionLevel: 9 })
      .toFile(path.join(outDir, target.file));
    console.log(`  ✓ public/icons/${target.file}  (${target.width}×${target.height})`);
  }

  console.log("");
  console.log(`LUMEN icons written to ${outDir}`);
}

main().catch((error) => {
  console.error("Icon generation failed:", error);
  process.exitCode = 1;
});

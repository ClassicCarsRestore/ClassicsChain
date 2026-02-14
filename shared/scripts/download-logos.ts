import { readFileSync, writeFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHARED_DIR = join(__dirname, "..");
const LOGOS_DIR = join(SHARED_DIR, "logos");
const BRANDS_FILE = join(SHARED_DIR, "brands.json");
const MANIFEST_FILE = join(SHARED_DIR, "logo-manifest.json");

const DELAY_MS = 300;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 3000;
const BATCH_SIZE = 10;
const BATCH_PAUSE_MS = 2000;
const THUMB_SIZE = 128;

interface BrandEntry {
  brand: string;
  sources: { logo_url: string | null };
}

function toKebab(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function getExtFromUrl(url: string): string {
  const path = new URL(url).pathname;
  const match = path.match(/\.(\w+)$/);
  if (!match) return "png";
  const ext = match[1].toLowerCase();
  if (ext === "svg") return "svg";
  if (ext === "jpg" || ext === "jpeg") return "jpg";
  if (ext === "png") return "png";
  if (ext === "gif") return "gif";
  if (ext === "webp") return "webp";
  if (ext === "pdf") return "";
  return "png";
}

function getFilenameFromUrl(url: string): string | null {
  // URLs are like: https://commons.wikimedia.org/wiki/Special:FilePath/Filename.ext
  const match = url.match(/Special:FilePath\/(.+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function buildThumbApiUrl(filename: string): string {
  // Use Wikimedia API to get a thumbnail
  const encoded = encodeURIComponent(filename.replace(/ /g, "_"));
  return `https://api.wikimedia.org/core/v1/commons/file/File:${encoded}`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function fetchWithRetry(url: string): Promise<Response | null> {
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        headers: {
          "User-Agent":
            "ClassicsChain/1.0 (academic research; https://github.com/classicschain)",
        },
      });

      if (res.status === 429) {
        const wait = RETRY_BACKOFF_MS * attempt;
        process.stdout.write(` [429, wait ${wait / 1000}s]`);
        await sleep(wait);
        continue;
      }

      if (!res.ok) {
        process.stdout.write(` [${res.status}]`);
        return null;
      }

      return res;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        process.stdout.write(` [err: ${(err as Error).message}]`);
        return null;
      }
      await sleep(RETRY_BACKOFF_MS * attempt);
    }
  }
  return null;
}

async function downloadViaApi(
  wikiFilename: string,
  outputPath: string,
  ext: string
): Promise<boolean> {
  // Step 1: Get file info from API
  const apiUrl = buildThumbApiUrl(wikiFilename);
  const infoRes = await fetchWithRetry(apiUrl);
  if (!infoRes) return false;

  const info = (await infoRes.json()) as {
    thumbnail?: { url: string };
    original?: { url: string };
    preferred?: { url: string };
  };

  // For SVGs, use the original; for rasters, prefer thumbnail
  let downloadUrl: string | undefined;
  if (ext === "svg") {
    downloadUrl = info.original?.url;
  } else {
    downloadUrl = info.preferred?.url ?? info.thumbnail?.url ?? info.original?.url;
  }

  if (!downloadUrl) {
    process.stdout.write(` [no url in API]`);
    return false;
  }

  await sleep(200);

  // Step 2: Download the actual file
  const fileRes = await fetchWithRetry(downloadUrl);
  if (!fileRes) return false;

  const buffer = Buffer.from(await fileRes.arrayBuffer());

  if (ext === "svg") {
    writeFileSync(outputPath, buffer);
  } else {
    try {
      await sharp(buffer)
        .resize(THUMB_SIZE, THUMB_SIZE, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .toFile(outputPath);
    } catch {
      // If sharp fails (e.g. animated GIF), just save raw
      writeFileSync(outputPath, buffer);
    }
  }
  return true;
}

async function main() {
  const brands: BrandEntry[] = JSON.parse(readFileSync(BRANDS_FILE, "utf-8"));
  const withLogos = brands.filter(
    (b) => b.sources.logo_url && !b.sources.logo_url.endsWith(".pdf")
  );

  console.log(
    `Found ${withLogos.length} brands with logos (out of ${brands.length} total)`
  );

  const manifest: Record<string, string> = {};
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;
  let batchCount = 0;

  for (const brand of withLogos) {
    const url = brand.sources.logo_url!;
    const ext = getExtFromUrl(url);
    if (!ext) {
      skipped++;
      continue;
    }

    const filename = `${toKebab(brand.brand)}.${ext}`;
    const outputPath = join(LOGOS_DIR, filename);

    if (existsSync(outputPath)) {
      manifest[brand.brand] = `logos/${filename}`;
      skipped++;
      continue;
    }

    const wikiFilename = getFilenameFromUrl(url);
    if (!wikiFilename) {
      process.stdout.write(
        `[${downloaded + failed + skipped + 1}/${withLogos.length}] ${brand.brand}... can't parse URL\n`
      );
      failed++;
      continue;
    }

    process.stdout.write(
      `[${downloaded + failed + skipped + 1}/${withLogos.length}] ${brand.brand}...`
    );

    const ok = await downloadViaApi(wikiFilename, outputPath, ext);
    if (ok) {
      manifest[brand.brand] = `logos/${filename}`;
      downloaded++;
      console.log(" ok");
    } else {
      failed++;
      console.log(" FAILED");
    }

    batchCount++;
    if (batchCount >= BATCH_SIZE) {
      batchCount = 0;
      await sleep(BATCH_PAUSE_MS);
    } else {
      await sleep(DELAY_MS);
    }
  }

  // Ensure all existing logos are in manifest
  for (const brand of withLogos) {
    const url = brand.sources.logo_url!;
    const ext = getExtFromUrl(url);
    if (!ext) continue;
    const filename = `${toKebab(brand.brand)}.${ext}`;
    if (existsSync(join(LOGOS_DIR, filename))) {
      manifest[brand.brand] = `logos/${filename}`;
    }
  }

  writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    `\nDone: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed`
  );
  console.log(`Manifest: ${Object.keys(manifest).length} entries`);
}

main();

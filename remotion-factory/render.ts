/**
 * Remotion Factory — Render Script
 *
 * Renders explainer videos for Mountain Blog articles.
 *
 * Usage:
 *   npx ts-node render.ts                    # Renders all compositions
 *   npx ts-node render.ts FutureIsNow        # Renders a specific composition
 *
 * Output goes to ../mountain/videos/
 */
import path from "path";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";

const COMPOSITIONS = ["FutureIsNow", "TheUnfinished"];

async function render(compositionId?: string) {
  const idsToRender = compositionId
    ? [compositionId]
    : COMPOSITIONS;

  console.log(`Bundling Remotion project...`);
  const bundleLocation = await bundle({
    entryPoint: path.resolve(__dirname, "./src/index.ts"),
    webpackOverride: (config) => config,
  });

  const outputDir = path.resolve(__dirname, "../mountain/videos");

  for (const id of idsToRender) {
    console.log(`\nRendering: ${id}`);

    const composition = await selectComposition({
      serveUrl: bundleLocation,
      id,
    });

    const outputPath = path.join(outputDir, `${toKebab(id)}.mp4`);

    await renderMedia({
      composition,
      serveUrl: bundleLocation,
      codec: "h264",
      outputLocation: outputPath,
    });

    console.log(`  ✓ ${outputPath}`);
  }

  console.log("\nDone.");
}

function toKebab(s: string): string {
  return s
    .replace(/([a-z])([A-Z])/g, "$1-$2")
    .toLowerCase();
}

const targetId = process.argv[2];
render(targetId).catch((err) => {
  console.error(err);
  process.exit(1);
});

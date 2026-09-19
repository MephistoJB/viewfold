import { build } from "esbuild";
import { mkdir } from "node:fs/promises";

const outdir = "custom_components/viewfold/frontend";
await mkdir(outdir, { recursive: true });
await build({
  entryPoints: ["src/index.ts"],
  bundle: true,
  format: "esm",
  minify: true,
  sourcemap: "external",
  sourcesContent: false,
  target: ["es2022"],
  outfile: `${outdir}/viewfold.js`,
  legalComments: "none",
});

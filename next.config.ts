import fs from "fs";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

import packageJSON from "./package.json" with { type: "json" };

const pages = ["/", "/image", "/pdf", "/audio", "/zip"];
const resources = ["https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.all.js"];
const revision = Date.now().toString();

const withPWA = withSerwistInit({
  swSrc: "src/service-workers/sw.ts",
  swDest: "public/sw.js",
  exclude: [/public\/sw.js/],
  disable: process.env.NODE_ENV !== "production",
  register: false,
  reloadOnOnline: false,
  additionalPrecacheEntries: pages.concat(resources).map((url) => ({ url, revision })),
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  experimental: {
    useTypeScriptCli: true,
  }
};

const manifestPath = "./public/manifest.json";

const updateManifestVersion = () => {
  if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    manifest.version = packageJSON.version;
    manifest.id = packageJSON.version;
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + "\n");
    console.log(`✅ Manifest version updated to ${packageJSON.version}`);
  } else {
    console.warn("⚠️  manifest.json not found!");
  }
};

updateManifestVersion();

export default withPWA(nextConfig);

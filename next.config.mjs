import fs from "fs"
import withSerwistInit from "@serwist/next";
import packageJSON from "./package.json" with { type: "json" };

const pages = ["/", "/image", "/pdf"];
const revision = Date.now().toString();

const withPWA = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  exclude: [/public\/sw.js/],
  disable: process.env.NODE_ENV === "development",
  register: false,
  reloadOnOnline: false,
  additionalPrecacheEntries: pages.map((url) => ({ url, revision })),
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    nextScriptWorkers: true,
  },
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

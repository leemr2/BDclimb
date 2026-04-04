import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    // Workspace folder is D:\drlee\bdclimb but the IDE/workspace root can be D:\drlee;
    // pinning root avoids some Turbopack path bugs on Windows.
    root: __dirname,
    resolveAlias: {
      // Fallback if any loader still resolves the bare package name (dev CSS pipeline).
      tailwindcss: path.join(__dirname, "node_modules", "tailwindcss"),
    },
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Los ítems aceptan PDFs e imágenes: el límite por defecto (1 MB) es muy bajo.
  experimental: {
    serverActions: { bodySizeLimit: "10mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;

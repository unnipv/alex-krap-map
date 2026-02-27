import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  output: "export",
  basePath: isProd ? "/alex-krap-map" : "",
  assetPrefix: isProd ? "/alex-krap-map/" : "",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;

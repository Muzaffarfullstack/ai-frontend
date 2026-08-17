import type { NextConfig } from "next";

function mediaRemotePatterns(): NonNullable<NextConfig["images"]>["remotePatterns"] {
  const configured = process.env.NEXT_PUBLIC_MEDIA_BASE_URL?.trim();
  if (!configured) return [];
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.protocol !== "http:") return [];
    const prefix = url.pathname.replace(/\/$/, "");
    return [{
      protocol: url.protocol.slice(0, -1) as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: `${prefix || ""}/**`,
    }];
  } catch {
    return [];
  }
}

const nextConfig: NextConfig = {
  distDir: process.env.NEXT_DIST_DIR?.trim() || ".next",
  output: "standalone",
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: mediaRemotePatterns(),
  },
};

export default nextConfig;

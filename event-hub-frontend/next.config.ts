import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/app/:path*",
        destination: "/:path*",
      },
    ];
  },
};

export default nextConfig;

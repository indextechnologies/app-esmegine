import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Las webs de los tenants consumen /_next/image sobre las fotos de menú.
    localPatterns: [
      {
        pathname: '/api/*/menu/foto/**',
        search: '',
      },
    ],
  },
};

export default nextConfig;

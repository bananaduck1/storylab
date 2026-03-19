import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "euuanplbiwyflzvjsgrb.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  async redirects() {
    return [
      { source: "/academy", destination: "/teachers/sam-a", permanent: true },
      { source: "/academy/:path*", destination: "/teachers/sam-a/:path*", permanent: true },
      { source: "/blog/:slug", destination: "/teachers/sam-a/blog/:slug", permanent: true },
      { source: "/teacher/register", destination: "/teacher/onboarding", permanent: false },
    ];
  },
};

export default nextConfig;

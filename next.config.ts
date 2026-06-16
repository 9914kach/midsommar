import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@supabase/ssr"],
  compiler: {
    styledComponents: true,
  },
};

export default nextConfig;

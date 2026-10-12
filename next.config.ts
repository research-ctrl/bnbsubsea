import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export: `pnpm build` pre-renders every page into dist/client, which Vercel serves from its CDN
  // (see vercel.json). The only server code is the enquiry endpoint in api/enquiries.ts.
  output: "export",
  // Applied by the dev server only: a static export has no server to redirect, so production repeats this rule in
  // vercel.json ("redirects"). Keep the two in step.
  async redirects() {
    return [{ source: "/lourdes", destination: "/#lourdes", permanent: false }];
  },
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    /**
     * All three are barrel packages: `import { Select } from "radix-ui"` reaches
     * the index that re-exports every primitive, and a Phosphor icon module
     * carries all six weight variants. None is in Next's default list, so
     * without this the first-paint chunk pays for components no page renders.
     */
    optimizePackageImports: [
      "radix-ui",
      "@base-ui/react",
      "@phosphor-icons/react",
    ],
  },
};

export default nextConfig;

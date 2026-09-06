import stylexOptions from "./stylex.config.cjs";
const stylexLoader = {
  loader: "babel-loader",
  options: {
    babelrc: false,
    configFile: false,
    plugins: [["@stylexjs/babel-plugin", stylexOptions]],
  },
};

const nextConfig = {
  turbopack: { rules: { "*.stylex.js": { loaders: [stylexLoader], as: "*.js" } } },
  webpack(config) {
    config.module.rules.push({ test: /\.stylex\.js$/, use: [stylexLoader] });
    return config;
  },
  experimental: {
    /**
     * All three are barrel packages: `import { Select } from "radix-ui"` reaches
     * the index that re-exports every primitive, and a Phosphor icon module
     * carries all six weight variants. None is in Next's default list, so
     * without this the first-paint chunk pays for components no page renders.
     */
    optimizePackageImports: ["radix-ui", "@base-ui/react", "@phosphor-icons/react"],
  },
};

export default nextConfig;

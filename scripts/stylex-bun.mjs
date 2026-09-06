import { plugin } from "bun";
import { transformFileSync } from "@babel/core";
import stylexOptions from "../stylex.config.cjs";

// Tests and benchmarks import components directly, outside Next.js's loader.
plugin({
  name: "stylex-modules",
  setup(build) {
    build.onLoad({ filter: /\.stylex\.js$/ }, ({ path }) => {
      const result = transformFileSync(path, {
        babelrc: false,
        configFile: false,
        plugins: [["@stylexjs/babel-plugin", { ...stylexOptions, dev: false }]],
      });
      if (!result?.code) throw new Error(`StyleX compilation produced no code for ${path}`);
      return { contents: result.code, loader: "js" };
    });
  },
});

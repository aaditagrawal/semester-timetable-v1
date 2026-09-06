import stylexOptions from "./stylex.config.cjs";
const config = {
  plugins: {
    "@stylexjs/postcss-plugin": {
      include: ["**/*.stylex.js"],
      babelConfig: {
        babelrc: false,
        configFile: false,
        plugins: [["@stylexjs/babel-plugin", stylexOptions]],
      },
      useCSSLayers: false,
    },
  },
};
export default config;

//@ts-check

"use strict";

const path = require("path");
const sentryWebpackPlugin = require("@sentry/webpack-plugin");

const isProd = process.env.NODE_ENV === "production";
// const packageJson = require("./package.json");
// const release = `${packageJson.name}@${packageJson.version}`;

const sentryPlugin = new sentryWebpackPlugin({
  // sentry-cli configuration - can also be done directly through sentry-cli
  // see https://docs.sentry.io/product/cli/configuration/ for details
  org: "leizl",
  project: "swagger-generate-ts",
  // other SentryWebpackPlugin configuration
  include: "./dist",
  authToken: "5a8832afed284ea6b9f630c1d192e9ff2788e41395014f2086764a62ab94e833",
  ignore: ["node_modules", "webpack.config.js", "web-app", ".cz-config.js"],
  // release,
});

//@ts-check
/** @typedef {import('webpack').Configuration['plugins']} Plugins **/

/** @type Plugins */
let plugins = [sentryPlugin];
if (isProd) {
  plugins = [sentryPlugin];
}

//@ts-check
/** @typedef {import('webpack').Configuration} WebpackConfig **/

/** @type WebpackConfig */
const extensionConfig = {
  target: "node", // VS Code extensions run in a Node.js-context 📖 -> https://webpack.js.org/configuration/node/
  mode: "none", // this leaves the source code as close as possible to the original (when packaging we set this to 'production')

  entry: "./src/extension.ts", // the entry point of this extension, 📖 -> https://webpack.js.org/configuration/entry-context/
  output: {
    // the bundle is stored in the 'dist' folder (check package.json), 📖 -> https://webpack.js.org/configuration/output/
    path: path.resolve(__dirname, "dist"),
    filename: "extension.js",
    libraryTarget: "commonjs2",
  },
  externals: {
    vscode: "commonjs vscode", // the vscode-module is created on-the-fly and must be excluded. Add other modules that cannot be webpack'ed, 📖 -> https://webpack.js.org/configuration/externals/
    // modules added here also need to be added in the .vscodeignore file
  },
  resolve: {
    // support reading TypeScript and JavaScript files, 📖 -> https://github.com/TypeStrong/ts-loader
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
          },
        ],
      },
    ],
  },
  devtool: "nosources-source-map",
  infrastructureLogging: {
    level: "log", // enables logging required for problem matchers
  },
  plugins,
};
module.exports = [extensionConfig];

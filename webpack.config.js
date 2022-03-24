/**
 * File: /webpack.config.js
 * Project: every-wallet
 * File Created: 22-03-2022 11:27:28
 * Author: Clay Risser
 * -----
 * Last Modified: 24-03-2022 09:41:19
 * Modified By: Clay Risser
 * -----
 * Risser Labs LLC (c) Copyright 2022
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const path = require("path");
const webpack = require("webpack");

module.exports = {
  mode: "production",
  entry: "./src/index.ts",
  target: "web",
  resolve: {
    extensions: [".mjs", ".tsx", ".ts", ".js", ".jsx", ".json"],
    fallback: {
      assert: require.resolve("assert/"),
      buffer: require.resolve("buffer"),
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      os: require.resolve("os-browserify/browser"),
      stream: require.resolve("stream-browserify"),
      url: require.resolve("url/"),
      util: require.resolve("util/"),
    },
  },
  output: {
    filename: "bundle.js",
    library: {
      name: "EveryWallet",
      type: "assign",
      export: "default",
    },
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new webpack.ProvidePlugin({
      Buffer: ["buffer", "Buffer"],
    }),
    new webpack.ProvidePlugin({
      process: "process/browser",
    }),
  ],
  module: {
    rules: [
      {
        test: /\.(m?js)|([jt]sx?)$/,
        exclude: [/\.json$/, /node_modules/],
        use: {
          loader: "babel-loader",
          options: {
            babelrc: true,
            envName: "umd",
          },
        },
      },
    ],
  },
};

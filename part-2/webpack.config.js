const glob = require('glob');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const SWFilePlugin = require('./webpack/SWFilePlugin');

const pageConfigs = glob.sync('./client/pages/*').reduce((result, item) => {
  const basename = path.basename(item);
  result.entry[basename] = `./client/pages/${basename}/index.js`;
  result.html.push(new HtmlWebpackPlugin({
    filename: `${basename}.html`,
    template: `./client/pages/${basename}/index.html`,
    chunks:[basename, 'global']
  }));
  return result;
}, { entry: {}, html: [] });

module.exports = {
  entry: pageConfigs.entry,
  mode: process.env.NODE_ENV || 'development',
  output: {
    filename: '[name].[chunkhash].js',
    path: path.resolve(__dirname, 'public'),
    publicPath: '/'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [ExtractCssChunks.loader, 'css-loader']
      },
      {
        test: /\.html$/,
        use: ['html-loader']
      },
      {
        test: /\.(png|jpg)$/,
        use: ['file-loader']
      }
    ]
  },
  optimization: {
    splitChunks: {
      cacheGroups: {
        global: {
          test: /global/,
          name: 'global',
          chunks: 'initial',
          minSize: 0
        }
      }
    }
  },
  plugins: [
    new CleanWebpackPlugin(),
    new ExtractCssChunks({ filename: "[name].[chunkhash].css" }),
    ...pageConfigs.html,
    new SWFilePlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client')
    }
  }
};
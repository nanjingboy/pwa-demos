const glob = require('glob');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const SWFilePlugin = require('./webpack/SWFilePlugin');

const pageConfigs = ['index', 'detail', 'edit'].reduce((result, item) => {
  result.entry[item] = `./client/pages/${item}/index.js`;
  result.html.push(new HtmlWebpackPlugin({
    filename: `${item}.html`,
    template: `./client/pages/${item}/index.html`,
    chunks:[item, 'global']
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
    new CopyPlugin([
      { from: path.join(__dirname, 'client/manifest.json'), to: path.join(__dirname, 'public') },
      { from: path.join(__dirname, 'client/launcher-icon.png'), to: path.join(__dirname, 'public') }
    ]),
    new SWFilePlugin()
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client')
    }
  }
};
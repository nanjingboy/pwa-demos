const path = require('path');
const Terser = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { EnvironmentPlugin } = require('webpack');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const ExtractCssChunks = require("extract-css-chunks-webpack-plugin");
const { ShellPlugin } = require('./webpack/plugins');
const { InjectManifest } = require('workbox-webpack-plugin');

const pageConfigs = [
  { key: 'home', isEnableGoHomeLink: false, isShowEditAction: false, isShowPlusAction: true },
  { key: 'detail', isEnableGoHomeLink: true, isShowEditAction: true, isShowPlusAction: false },
  { key: 'edit', isEnableGoHomeLink: true, isShowEditAction: false, isShowPlusAction: false },
].reduce((result, { key, isEnableGoHomeLink, isShowEditAction, isShowPlusAction }) => {
  result.entry[key] = `./client/${key}/index.js`;
  result.html.push(new HtmlWebpackPlugin({
    filename: `${key}.html`,
    template: './client/index.ejs',
    chunks: [key, 'global'],
    templateParameters: {
      isEnableGoHomeLink,
      isShowPlusAction,
      isShowEditAction
    }
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
    },
    minimizer: [
      new Terser({
        test: /\.m?js$/
      })
    ]
  },
  plugins: [
    new EnvironmentPlugin({
      NODE_ENV: 'development'
    }),
    new CleanWebpackPlugin(),
    new ExtractCssChunks({ filename: "[name].[chunkhash].css" }),
    ...pageConfigs.html,
    new ShellPlugin(),
    new CopyPlugin([
      { from: path.join(__dirname, 'client/manifest.json'), to: path.join(__dirname, 'public') },
      { from: path.join(__dirname, 'client/launcher-icon.png'), to: path.join(__dirname, 'public') }
    ]),
    new InjectManifest({
      swSrc: './client/sw.js',
      swDest: 'sw.js',
      importWorkboxFrom: 'local'
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client')
    }
  }
};
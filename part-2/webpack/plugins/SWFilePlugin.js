const path = require('path');
const memFs = require('mem-fs');
const editor = require('mem-fs-editor');

class SWFilePlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('SWFilePlugin', (compilation, callback) => {
      const publicPath = compilation.mainTemplate.getPublicPath({
        hash: compilation.hash
      });
      const assets = Object.keys(compilation.assets).map(asset => `${publicPath}${asset}`);
      const importScripts = assets.filter(
        asset => /^\/db|network\.[a-zA-Z0-9]+\.js$/.test(asset)
      );
      const fsEditor = editor.create(memFs.create());
      fsEditor.copyTpl(
        path.join(__dirname, '../../client/sw.js'),
        path.join(__dirname, '../../public/sw.js'),
        {
          precacheName: `precache-${(new Date()).getTime()}`,
          precacheList: JSON.stringify(assets),
          importScripts: JSON.stringify(importScripts)
        }
      );
      fsEditor.commit(() => {
        callback();
      })
    });
  }
}

module.exports = SWFilePlugin;

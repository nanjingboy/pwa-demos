const path = require('path');
const memFs = require('mem-fs');
const editor = require("mem-fs-editor");

class SWFilePlugin {
  constructor() {
    this.options = {
      precacheName: `precache-${(new Date()).getTime()}`
    };
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('SWFilePlugin', (compilation, callback) => {
      const publicPath = compilation.mainTemplate.getPublicPath({
        hash: compilation.hash
      });
      const assets = Object.keys(compilation.assets).map(asset => `${publicPath}${asset}`);
      const fsEditor = editor.create(memFs.create());
      fsEditor.copyTpl(
        path.join(__dirname, '../client/sw.js'),
        path.join(__dirname, '../public/sw.js'),
        {
          precacheName: this.options.precacheName,
          precacheList: JSON.stringify(assets)
        }
      );
      fsEditor.commit(() => {
        callback();
      })
    });
  }
}

module.exports = SWFilePlugin;
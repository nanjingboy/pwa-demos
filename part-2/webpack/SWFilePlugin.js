const path = require('path');
const memFs = require('mem-fs');
const editor = require("mem-fs-editor");

class SWFilePlugin {
  constructor(options) {
    const defaultOptions = {
      precacheName: `precache-${(new Date()).getTime()}`
    };
    this.options = Object.assign(defaultOptions, options || {});
  }

  apply(compiler) {
    compiler.hooks.emit.tapAsync('SWFilePlugin', (compilation, callback) => {
      const fsEditor = editor.create(memFs.create());
      fsEditor.copyTpl(
        path.join(__dirname, '../client/sw.js'),
        path.join(__dirname, '../public/sw.js'),
        {
          precacheName: this.options.precacheName,
          precacheList: JSON.stringify(Object.keys(compilation.assets).map(asset => `/${asset}`))
        }
      );
      fsEditor.commit(() => {
        callback();
      })
    });
  }
}

module.exports = SWFilePlugin;
const path = require('path');
const fs = require('fs-extra');
const editor = require("mem-fs-editor");

class ShellPlugin {
  constructor() {
    this.htmls = []
  }

  apply(compiler) {
    compiler.hooks.compilation.tap('ShellPlugin',  compilation => {
      compilation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('ShellPlugin', (data, callback) => {
        this.htmls.push({
          key: data.outputName.replace(/\.html$/i, ''),
          html: data.html
        });
        callback(null, data);
      });
    });
    compiler.hooks.emit.tapAsync('ShellPlugin', async (compilation, callback) => {
      const shellRootPath = path.join(__dirname, '../../public/shell');
      await fs.ensureDir(shellRootPath);
      for (const htmlConfig of this.htmls) {
        const { key, html } = htmlConfig;
        const htmlParts = html.split('<!-- shell -->').map(part => part.trim());
        await fs.writeFile(
          path.join(shellRootPath, `${key}_top.html`),
          htmlParts[0],
          'utf-8'
        );
        await fs.writeFile(
          path.join(shellRootPath, `${key}_bottom.html`),
          htmlParts[1],
          'utf-8'
        );
        compilation.assets[`shell/${key}_top.html`] = {
          source: () => htmlParts[0],
          size: () => htmlParts[0].length
        };
        compilation.assets[`shell/${key}_bottom.html`] = {
          source: () => htmlParts[1],
          size: () => htmlParts[1].length
        };
        delete(compilation.assets[`${key}.html`]);
      }
      callback();
    });
  }
}

module.exports = ShellPlugin;
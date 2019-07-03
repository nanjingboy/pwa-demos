const path = require('path');
const loaderUtils = require('loader-utils');

module.exports.raw = true;
module.exports.default = function(content) {
  const url = loaderUtils.interpolateName(this, '[name].[hash].[ext]', {
    content
  });
  this.emitFile(url, content);
  return `module.exports = __webpack_public_path__ + ${JSON.stringify(url)};`;
}
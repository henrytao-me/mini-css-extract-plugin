'use strict';

const { resolve } = require('path');

const fs = require('fs-extra');
const glob = require('glob');

const cached = [];

module.exports = (loaderContext, options, keys) => {
  const { extension = 'scss', rootDir, outDir, scssDir } = options;
  const filename = options.filename || `index.${extension}`;
  if (!rootDir || !outDir) {
    throw new Error('Missing rootDir | outDir');
  }
  const { resourcePath } = loaderContext;
  const relativeResourcePath = `.${resourcePath.replace(rootDir, '')}`;
  const scssFileDir = scssDir && filename ? resolve(scssDir, filename) : null;

  // Remove output file and copy all scss files over
  if (scssFileDir && cached.indexOf(scssFileDir) < 0) {
    cached.push(scssFileDir);
    fs.removeSync(scssFileDir);
    fs.ensureFileSync(scssFileDir);
    glob.sync(`${rootDir}/**/*.${extension}`).forEach(fileDir => {
      const relativeFileDir = `.${fileDir.replace(rootDir, '')}`;
      fs.copySync(fileDir, resolve(scssDir, relativeFileDir));
    });
  }

  // Output scss.js file
  fs.outputFileSync(`${resolve(outDir, relativeResourcePath)}.js`, `module.exports = ${JSON.stringify(keys)}`);

  // Append scss file to scssFileDir
  if (scssFileDir) {
    fs.outputFileSync(scssFileDir, `${fs.readFileSync(scssFileDir, 'utf8')}
      @import '.${resolve(scssDir, relativeResourcePath).replace(resolve(scssFileDir, '../'), '')}';
      `);
  }
};
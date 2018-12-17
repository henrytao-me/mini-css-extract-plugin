'use strict';

const fs = require('fs-extra');
const glob = require('glob');
const { resolve } = require('path');

const cached = [];

module.exports = (loaderContext, options, keys) => {
  const { extension = 'scss', rootDir, outDir, scssDir, filename } = options;
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
    glob.sync(`${rootDir}/**/*.${extension}`).map(fileDir => {
      const relativeFileDir = `.${fileDir.replace(rootDir, '')}`;
      fs.copySync(fileDir, resolve(scssDir, relativeFileDir));
    });
  }

  // Output scss.js file
  fs.outputFileSync(resolve(outDir, relativeResourcePath) + '.js', `module.exports = ${JSON.stringify(keys)}`);

  // Append scss file to scssFileDir
  if (scssFileDir) {
    fs.outputFileSync(scssFileDir, `${fs.readFileSync(scssFileDir, 'utf8')}
      @import '.${resolve(scssDir, relativeResourcePath).replace(resolve(scssFileDir, '../'), '')}';
      `);
  }
};
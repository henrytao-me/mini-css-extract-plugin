const { resolve } = require('path');

const fs = require('fs-extra');
const glob = require('glob');

const cached = [];

/**
 * Extract scss files
 *
 * loaderContext: webpack loader
 * options:
 *   extension (string? | 'scss'): extension for look up, could be less
 *   rootDir (string): for calculating relative path
 *   outDir (string): directory for output namespaces *.[style].js
 *   scssDir (string?): directory for output all styles *.[style]
 *   filename (string? | `index.${extension}`): combined output style
 * namespaces: a map that contains all classnames
 */
module.exports = (loaderContext, options, namespaces) => {
  const { extension = 'scss', rootDir, outDir, scssDir } = options;
  const filename = options.filename || `index.${extension}`;
  if (!rootDir || !outDir) {
    throw new Error('Missing rootDir | outDir');
  }
  const { resourcePath } = loaderContext;
  const relativeResourcePath = `.${resourcePath.replace(rootDir, '')}`;
  const scssFileDir = scssDir && filename ? resolve(scssDir, filename) : null;

  // Remove output file and copy all scss files over (do one for each scssFileDir)
  if (scssFileDir && cached.indexOf(scssFileDir) < 0) {
    cached.push(scssFileDir);
    fs.removeSync(scssFileDir);
    fs.ensureFileSync(scssFileDir);
    glob.sync(`${rootDir}/**/*.${extension}`).forEach((fileDir) => {
      const relativeFileDir = `.${fileDir.replace(rootDir, '')}`;
      fs.copySync(fileDir, resolve(scssDir, relativeFileDir));
    });
  }

  // Write *.[style] file with updated classnames
  const content = Object.keys(namespaces).reduce(
    (content, className) =>
      content.replace(
        new RegExp(`\\.${className}(?!-)\\b`, 'g'),
        `.${namespaces[className]}`
      ),
    fs.readFileSync(resourcePath, 'utf8')
  );
  fs.outputFileSync(resolve(scssDir, relativeResourcePath), content);

  // Write *.[style].js file
  fs.outputFileSync(
    `${resolve(outDir, relativeResourcePath)}.js`,
    `module.exports = ${JSON.stringify(namespaces)}`
  );

  // Append scss file to scssFileDir
  if (scssFileDir) {
    fs.outputFileSync(
      scssFileDir,
      `${fs.readFileSync(scssFileDir, 'utf8')}@import '.${resolve(
        scssDir,
        relativeResourcePath
      ).replace(resolve(scssFileDir, '../'), '')}';\r\n`
    );
  }
};

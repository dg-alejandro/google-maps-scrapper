/**
 * jsonExporter.js
 * Responsibility: save clean business data as a JSON file.
 * Useful for passing results to other tools or AI instances.
 */

const fs   = require('fs');
const path = require('path');
const { buildBaseFileName, ensureOutputFolder } = require('../utils/fileHelper');

/**
 * Saves an array of business objects as a formatted JSON file in the output/ folder.
 *
 * @param {Array}  businesses - array of normalized business objects from parseResults()
 * @param {string} query      - the original search text (used to generate the file name)
 * @returns {string} - absolute path of the created file
 */
function exportJSON(businesses, query) {
  const outputFolder = ensureOutputFolder();
  const filePath     = path.join(outputFolder, `${buildBaseFileName(query)}.json`);

  //indent with 2 spaces — makes the file readable when pasted directly into Claude or other AI tools
  fs.writeFileSync(filePath, JSON.stringify(businesses, null, 2), 'utf-8');

  return filePath;
}

module.exports = { exportJSON };

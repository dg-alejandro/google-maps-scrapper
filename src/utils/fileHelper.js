/**
 * fileHelper.js
 * Responsibility: shared utilities for generating file names and creating the output folder.
 * Extracted to avoid duplication between csvExporter.js and jsonExporter.js.
 */

const fs   = require('fs');
const path = require('path');

/**
 * Converts a search query into a valid, normalized file name (no extension).
 * Example: "Peluquerías en Santiago" → "peluquerias_en_santiago_2024-01-15"
 *
 * @param {string} query - the original search text
 * @returns {string} - base file name without extension
 */
function buildBaseFileName(query) {
  const baseName = query
    .toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '_');
  const date = new Date().toISOString().slice(0, 10);
  return `${baseName}_${date}`;
}

/**
 * Ensures the output/ folder exists, creating it if necessary.
 *
 * @returns {string} - absolute path to the output/ folder
 */
function ensureOutputFolder() {
  const outputFolder = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, { recursive: true });
  }
  return outputFolder;
}

module.exports = { buildBaseFileName, ensureOutputFolder };

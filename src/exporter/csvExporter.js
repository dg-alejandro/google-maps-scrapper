/**
 * csvExporter.js
 *responsibility: receive an array of clean business objects and write them as a CSV file.
 *the generated CSV is compatible with Excel and Notion (UTF-8 with BOM on Windows).
 */

const fs   = require('fs');
const path = require('path');
const { buildBaseFileName, ensureOutputFolder } = require('../utils/fileHelper');

//CSV column headers — must match the object keys returned by parsePlace() in placesParser.js
const HEADERS = ['name', 'rating', 'reviewCount', 'phone', 'websiteUrl', 'googleMapsUrl', 'webPresence'];

/**
 *escapes a single value for CSV format.
 *if the value contains commas, quotes, or newlines, it wraps it in double quotes.
 *internal double quotes are escaped by doubling them ("" is the CSV standard for a literal ").
 *
 * @param {string|number} value - the raw field value to escape
 * @returns {string} - safe CSV string
 */
function escapeCSV(value) {
  const text = String(value); //ensure we always work with a string, even for numbers
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

/**
 *converts an array of clean business objects into a CSV string.
 *the first row is the header row; each subsequent row maps one business.
 *
 * @param {Array} businesses - array of normalized business objects from parseResults()
 * @returns {string} - full CSV content as a string (not yet written to disk)
 */
function buildCSV(businesses) {
  const rows = businesses.map((business) =>
    HEADERS.map((key) => escapeCSV(business[key])).join(',')
  );
  //prepend the header row, then join all rows with newlines
  return [HEADERS.join(','), ...rows].join('\n');
}

/**
 *saves the CSV to the output/ folder with a name based on the search query and today's date.
 *adds a UTF-8 BOM at the start so Excel and Notion on Windows display special characters correctly.
 *
 * @param {Array}  businesses - array of normalized business objects
 * @param {string} query      - the original search text (used to generate the file name)
 * @returns {string} - absolute path of the created file
 */
function exportCSV(businesses, query) {
  const outputFolder = ensureOutputFolder();
  const filePath     = path.join(outputFolder, `${buildBaseFileName(query)}.csv`);

  //UTF-8 BOM — without this, Excel interprets the file as ANSI and breaks accented characters
  const BOM = '\uFEFF';
  fs.writeFileSync(filePath, BOM + buildCSV(businesses), 'utf-8');

  return filePath;
}

module.exports = { exportCSV };

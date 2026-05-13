/**
 * index.js — Entry point of the scraper.
 * Orchestrates the modules: config → search → parse → export.
 *
 * Usage: node index.js
 * The script will prompt for business type and city interactively.
 */

const readline = require('readline');

const { loadEnv } = require('./src/utils/env');
loadEnv();

const { searchBusinesses } = require('./src/api/placesClient');
const { parseResults }     = require('./src/parser/placesParser');
const { exportCSV }        = require('./src/exporter/csvExporter');
const { exportJSON }       = require('./src/exporter/jsonExporter');

/**
 * Asks a question in the terminal and returns the user's answer.
 *
 * @param {Object} rl        - readline instance
 * @param {string} question  - question text to display
 * @returns {Promise<string>}
 */
function ask(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => resolve(answer.trim()));
  });
}

async function main() {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!apiKey || apiKey === 'TU_API_KEY_AQUI') {
    console.error('ERROR: Crea un archivo .env con tu GOOGLE_PLACES_API_KEY.');
    process.exit(1);
  }

  const rl = readline.createInterface({
    input:  process.stdin,
    output: process.stdout,
  });

  console.log('\n=== Scraper de Negocios Locales ===\n');

  const businessType = await ask(rl, '¿Qué tipo de negocio buscas? (ej: dentistas, gimnasios): ');
  const city         = await ask(rl, '¿En qué ciudad?                                          ');

  rl.close();

  if (!businessType || !city) {
    console.error('ERROR: Debes introducir un sector y una ciudad.');
    process.exit(1);
  }

  const query = `${businessType} en ${city}`;

  // 1. fetch raw data from the API
  const rawResults = await searchBusinesses(query, apiKey);

  if (rawResults.length === 0) {
    console.log('No se encontraron resultados para esa búsqueda.');
    process.exit(0);
  }

  // 2. clean and normalize
  const businesses = parseResults(rawResults);

  // 3. print summary to console
  console.log('--- Negocios encontrados ---');
  businesses.forEach((b, i) => {
    console.log(`${i + 1}. ${b.name} | ${b.phone || 'sin teléfono'} | ${b.websiteUrl || 'sin web'} | ★ ${b.rating}`);
  });

  // 4. export files
  const csvPath  = exportCSV(businesses, query);
  const jsonPath = exportJSON(businesses, query);

  console.log(`\nCSV  guardado en: ${csvPath}`);
  console.log(`JSON guardado en: ${jsonPath}`);
}

main().catch((err) => {
  console.error('Error inesperado:', err.message);
  process.exit(1);
});

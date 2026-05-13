/**
 *responsibility: transform raw API data into clean, normalized business objects.
 *this module does not fetch data or write files, it only shapes the data.
 */

/**
 *classifies a business's web presence based on its website URL.
 *used to identify leads that lack their own website (potential clients).
 *
 * @param {string|undefined} websiteUri - the raw URL from the API (may be undefined)
 * @returns {string} - one of: 'no_website', 'Instagram only', 'Facebook only', 'Booksy', 'own_website'
 */
function classifyWebPresence(websiteUri) {
  if (!websiteUri)                          return 'no_website';
  if (websiteUri.includes('instagram.com')) return 'Instagram only';
  if (websiteUri.includes('facebook.com'))  return 'Facebook only';
  if (websiteUri.includes('booksy.com'))    return 'Booksy';
  return 'own_website';
}

/**
 *transforms a single raw place object from the API into a clean, flat business object.
 *uses nullish coalescing (??) to replace missing fields with empty strings instead of undefined.
 *
 * @param {Object} place - raw place object returned by the Google Places API
 * @returns {Object} - normalized business object ready for export
 */
function parsePlace(place) {
  //extract the website URL first — it's needed both as a field and for web presence classification
  const websiteUrl = place.websiteUri ?? '';

  return {
    name:        place.displayName?.text   ?? '', //business name (nested inside displayName.text)
    rating:      place.rating              ?? '', //average star rating (1.0–5.0)
    reviewCount: place.userRatingCount     ?? '', //total number of reviews
    phone:       place.nationalPhoneNumber ?? '', //local phone number format
    websiteUrl,                                   //shorthand property — same as websiteUrl: websiteUrl
    googleMapsUrl: place.googleMapsUri     ?? '', //direct Google Maps link
    webPresence:   classifyWebPresence(websiteUrl), //derived field — not from the API directly
  };
}

/**
 *transforms an array of raw place objects into an array of clean business objects.
 *this is the only exported function — the rest are internal implementation details.
 *
 * @param {Array} rawPlaces - array of raw place objects from the API
 * @returns {Array} - array of normalized business objects
 */
function parseResults(rawPlaces) {
  return rawPlaces.map(parsePlace); //apply parsePlace to every element
}

module.exports = { parseResults };




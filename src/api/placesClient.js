/**
 *responsibility: communicate with the Google Places API (New) - Text Search endpoint
 *this module only fetches and returns raw API data — it does not parse or format results
 */

//base URL for the Places API (New) Text Search endpoint
//all POST requests in this module are sent here
const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText';

//field Mask: tells the API exactly which fields to return
//only requesting what we need reduces API cost and improves response speed
const FIELD_MASK = [
  'places.name',              //internal Google resource ID — used for deduplication
  'places.displayName',       //human-readable business name
  'places.websiteUri',        //business website (may be Instagram, Facebook, etc.)
  'places.nationalPhoneNumber', //local-format phone number
  'places.rating',            //average star rating (1–5)
  'places.userRatingCount',   //total number of user reviews
  'places.googleMapsUri',     //direct link to the business on Google Maps
  'nextPageToken',            //token to fetch the next page of results (pagination)
].join(',');//transform the array into a string

//maximum time to wait for a single API response before aborting (in milliseconds)
const TIMEOUT_MS = 10_000;

/**
 *sends a single POST request to the Places API and returns the raw JSON response.
 *this is a private function — it is not exported and should only be used by searchBusinesses().
 *
 * @param {string} apiKey  - google Places API key loaded from .env
 * @param {Object} body    - request body (contains the text query and optional page token)
 * @returns {Promise<Object>} - raw JSON response from the API
 */
async function callAPI(apiKey, body) {
  //set up a cancellation controller so we can abort the request if it takes too long
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let response;
  try {
    response = await fetch(PLACES_API_URL, {
      method: 'POST',//we send data
      signal: controller.signal, //links the abort controller to this fetch call
      headers: {
        'Content-Type': 'application/json',
        //required by Places API (New): declares which fields we want back
        'X-Goog-FieldMask': FIELD_MASK,
        //aPI key goes in the header, not the URL — headers are not logged by servers
        'X-Goog-Api-Key': apiKey,
      },
      body: JSON.stringify(body), //convert the JS object to a JSON string for the request
    });
  } catch (err) {
    //fetch() only throws on network-level failures (no connection, DNS error, timeout)
    if (err.name === 'AbortError') {
      throw new Error(`Timeout: the API did not respond within ${TIMEOUT_MS / 1000}s`);
    }
    throw new Error(`Network error: ${err.message}`);
  } finally {
    //always clear the timer, even if the request succeeded — prevents memory leaks
    clearTimeout(timer);
  }

  //handle HTTP error responses (4xx, 5xx)
  if (!response.ok) {
    //read the body as plain text first — error responses may be HTML (e.g. from a proxy)
    const errorText = await response.text();
    let errorMessage;
    try {
      //try to extract a structured message from Google's JSON error format
      errorMessage = JSON.parse(errorText).error?.message ?? errorText;
    } catch {
      //if the body is not valid JSON, use the raw text as the error message
      errorMessage = errorText;
    }
    throw new Error(`API error (${response.status}): ${errorMessage}`);
  }

  //parse and return the successful JSON response
  return response.json();
}

/**
 *searches for businesses using the Places API Text Search and paginates through all results
 *google Places returns a maximum of 20 results per page and up to 3 pages (60 results total)
 *
 * @param {string} query   - search text, e.g. "barbershops in Seville"
 * @param {string} apiKey  - google Places API key loaded from .env
 * @returns {Promise<Array>} - array of unique raw place objects from the API
 */
async function searchBusinesses(query, apiKey) {
  console.log(`\nSearching: "${query}"...`);

  const allResults = [];   //accumulates places across all pages
  let currentPage  = 1;
  let nextPageToken = null; //null means we are on the first page

  do {
    console.log(`  Fetching page ${currentPage}...`);

    //first page: only send the query. Subsequent pages: also include the page token
    const body = nextPageToken
      ? { textQuery: query, pageToken: nextPageToken }
      : { textQuery: query };

    const data = await callAPI(apiKey, body);

    //stop paginating if the API returns an empty page
    if (!data.places || data.places.length === 0) break;

    //spread operator unpacks the array and appends each place individually
    allResults.push(...data.places);

    //save the token for the next iteration; null if this was the last page
    nextPageToken = data.nextPageToken || null;
    currentPage++;

    //brief pause between pages — avoids hammering the API with back-to-back requests
    if (nextPageToken) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
    }
  } while (nextPageToken); //loop ends when there are no more pages

  // --- Deduplication ---
  //google can occasionally return the same place on multiple pages.
  //we use a Set for O(1) lookups — faster than indexOf() or filter() alone.
  const seen = new Set();
  const uniqueResults = allResults.filter((place) => {
    if (seen.has(place.name)) return false; //already encountered — discard
    seen.add(place.name);                   //mark as seen
    return true;
  });

  //calculate how many duplicates had been deleted, and return a clean array 
  const duplicateCount = allResults.length - uniqueResults.length;
  if (duplicateCount > 0) {
    console.log(`  Duplicates removed: ${duplicateCount}`);
  }
  console.log(`  Total unique results: ${uniqueResults.length} businesses.\n`);

  return uniqueResults;
}

module.exports = { searchBusinesses };

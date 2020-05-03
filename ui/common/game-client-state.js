////////////////////////////////////////////////
////// Client state code - global variables
///////////////////////////////////////////////

let userId = new URLSearchParams(window.location.search).get('userId');
const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');
let serverTimeDifference; // Needed to calibrate time disparities during countdowns
let hasGameEndedForThisUser = false; // Client-only variable used when websockect connection dies
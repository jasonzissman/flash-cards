const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');

// Websocket against /{tenantId}/games/{gameId}/join
// var exampleSocket = new WebSocket("wss://www.example.com/socketserver", "protocolOne");


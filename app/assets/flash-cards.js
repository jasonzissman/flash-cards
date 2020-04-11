const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');

// Websocket against /{tenantId}/games/{gameId}/join
// TODO - eventually use wss, not ws
const webSocketUrl = `ws://${tenantId}/games/${gameId}/join`;
const webSocket = new WebSocket(webSocketUrl);

webSocket.onopen = (event) => {
  exampleSocket.send("Here's some text that the server is urgently awaiting!");
};

webSocket.onmessage = (event) => {
  alert("Response from server: " + event.data);
};

setTimeout(() => {
    webSocket.close();
}, 5000);

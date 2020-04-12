const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');
const userId = new URLSearchParams(window.location.search).get('userId');

// Sample code to create a game.
// http://localhost:3001/?tenantId=tenant-123&gameId=game-456&userId=user-789

// var xhr = new XMLHttpRequest();
// xhr.open('POST', 'http://localhost:3001/tenant-123/games', false);
// xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
// xhr.onload = function () {
//     // do something to response
//     console.log(this.responseText);
// };
// xhr.send('');

// Websocket against /{tenantId}/games/{gameId}/join
// TODO - eventually use wss, not ws
const webSocketUrl = `ws://localhost:3002`;
const webSocket = new WebSocket(webSocketUrl);

webSocket.onopen = (event) => {
  
  // join game
  const joinGameObject = {
    action: "JOIN_GAME",
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  };
  webSocket.send(JSON.stringify(joinGameObject));
};

webSocket.onmessage = (event) => {
  console.log("Response from server: " + event.data);
};


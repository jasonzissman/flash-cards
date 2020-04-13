const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');
const userId = new URLSearchParams(window.location.search).get('userId');

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

function printMessage(message) {
  document.getElementById("game-stuff").innerHTML = message + document.getElementById("game-stuff").innerHTML;
  document.getElementById("game-stuff").innerHTML = "<hr/>" + document.getElementById("game-stuff").innerHTML;
}

webSocket.onmessage = (event) => {
  printMessage(JSON.stringify(JSON.parse(event.data, undefined, 4)));
};

document.getElementById("create-game").onclick = () => {
  // TODO - delete this - to be called by launching party

  http://localhost:3001/?tenantId=tenant-123&gameId=game-456&userId=user-789

  var xhr = new XMLHttpRequest();
  xhr.open('POST', 'http://localhost:3001/tenant-123/games', false);
  xhr.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
  xhr.onload = function () {
    
    printMessage(this.responseText);
  };
  xhr.send('');
};


document.getElementById("start-game").onclick = () => {
    const startGameObject = {
      action: "START_GAME"
    };
    webSocket.send(JSON.stringify(startGameObject));
};

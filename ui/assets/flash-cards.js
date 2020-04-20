const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');
const userId = new URLSearchParams(window.location.search).get('userId');

var HAS_JOINED_GAME = false;
var GAME_STATE = undefined;

// TODO - eventually use wss, not ws
const webSocketUrl = `ws://localhost:3002`;
const webSocket = new WebSocket(webSocketUrl);

webSocket.onopen = (event) => {

};

function printMessage(message) {
  console.log(message);
}

function updateUI() {

  if (!HAS_JOINED_GAME) {
    // Show #welcome-screen
    // Hide #game-screen
  } else {
    // Hide #welcome-screen
    // Show #game-screen
    // Update game UI
  }

}

webSocket.onmessage = (event) => {
  let serverMessage = JSON.parse(event.data);
  if(serverMessage.gameState) {
    GAME_STATE = serverMessage.gameState;
    updateUI();
  }
  printMessage(JSON.stringify(serverMessage, undefined, 4));
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

// TODO really this is join game (and create/start if not already there)
document.getElementById("start-game").onclick = () => {

  // TODO why differentiate create game from join game from start game? should all be the same.

  // // start game
  // const startGameObject = {
  //   action: "START_GAME"
  // };
  // webSocket.send(JSON.stringify(startGameObject));

  // join game
  const joinGameObject = {
    action: "JOIN_GAME",
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  };
  webSocket.send(JSON.stringify(joinGameObject));
};

document.getElementById("start-next-round").onclick = () => {
  const startGameObject = {
    action: "START_NEXT_ROUND"
  };
  webSocket.send(JSON.stringify(startGameObject));
};

document.getElementById("submit-answer").onclick = () => {
  const startGameObject = {
    action: "SUBMIT_ANSWER",
    answer: "56"
  };
  webSocket.send(JSON.stringify(startGameObject));
};
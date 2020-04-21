const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');
const userId = new URLSearchParams(window.location.search).get('userId');

// state
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
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
  } else {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("welcome-screen").style.display = "block";
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

document.getElementById("start-game").onclick = () => {

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
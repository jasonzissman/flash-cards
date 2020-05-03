////////////////////////////////////////////////
////// WebSocket Code
///////////////////////////////////////////////

// TODO - in the real world, web sockets and http would be on different ports.
const webSocketUrl = location.origin.replace(/^http/, 'ws');

const webSocket = new WebSocket(webSocketUrl);
webSocket.onopen = () => {
  webSocket.send(JSON.stringify({
    action: "INITIALIZE_CONNECTION",
    gameType: gameType,
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  }));
};

webSocket.onmessage = (event) => {
  let serverMessage = JSON.parse(event.data);
  if (serverMessage) {
    if (serverMessage.messageType === "GAME_STATE_CHANGE") {
      updateUI(serverMessage);
    } else if (serverMessage.messageType === "NOTIFY_USER") {
      notifyUser(serverMessage.notification);
    } else if (serverMessage.messageType === "INIT_CONNECTION_COMPLETE") {
      userId = serverMessage.userId;
      serverTimeDifference = new Date().getTime() - serverMessage.serverTime;
      document.getElementById("game-share-link").value = location.href.split("?")[0] + "?gameId=" + serverMessage.gameId;
    } else if (serverMessage.messageType === "PING") {
      webSocket.send(JSON.stringify({
        action: "PONG"
      }));
    } else if (serverMessage.messageType === "GAME_NOT_FOUND") {
      endGame(`Could not find game ${serverMessage.gameId}. <a href="/">Please start a new game.</a>`);
    }
  }
  
};

webSocket.onclose = () => {
  if (!hasGameEndedForThisUser) {
    endGame(`The game has ended. <a href="/">Please start a new game.</a>`);
  }
};

function joinGame() {
  let userEnteredName = document.getElementById("display-name").value.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 40).trim();
  localStorage.setItem("displayName", userEnteredName);
  webSocket.send(JSON.stringify({
    action: "JOIN_GAME",
    displayName: userEnteredName
  }));
}

function submitAnswer() {
  webSocket.send(JSON.stringify({
    action: "SUBMIT_ANSWER",
    answer: document.getElementById("answer-field").value
  }));
}

function startNextRound() {
  webSocket.send(JSON.stringify({
    action: "START_NEXT_ROUND"
  }));
}

// TODO - should this be a form like submit answer?
document.getElementById("start-next-round").onclick = () => {
  startNextRound();
};
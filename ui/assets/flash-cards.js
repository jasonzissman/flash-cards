const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');
const userId = new URLSearchParams(window.location.search).get('userId');



// TODO - eventually use wss, not ws
const webSocketUrl = `ws://localhost:3002`;
const webSocket = new WebSocket(webSocketUrl);
webSocket.onopen = () => {
  const initConnObject = {
    action: "INITIALIZE_CONNECTION",
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  };
  webSocket.send(JSON.stringify(initConnObject));
};

////////////////////////////////////////////////
////// UI CODE - belongs somewhere else
///////////////////////////////////////////////

function printMessage(message) {
  console.log(message);
}
function getCurrentPlayerFromActivePlayers(activePlayers) {
  let retVal = undefined;
  for (var player of activePlayers) {
    if (player.id === userId) {
      retVal = player;
      break;
    }
  }
  return retVal;
}

function hasPlayerJoinedGame(activePlayers) {
  return getCurrentPlayerFromActivePlayers(activePlayers) !== undefined;
}

function getCurrentUserScore(activePlayers) {
  return getCurrentPlayerFromActivePlayers(activePlayers).score;
}

function shouldShowWelcomeScreen(activePlayers) {
  return !activePlayers || activePlayers.length === 0 || !hasPlayerJoinedGame(activePlayers);
}

function updateUI(serverMessage) {
  // TODO - disable submit button if current player has correctly answered      
  // TODO - put in big timer notifying user when next round starts
  // TODO - put in cool block graphics to show users why answer is correct
  // TODO - put in countdown timer for round

  let gameState = serverMessage.gameState;
  let activePlayers = serverMessage.activePlayers;
  if (shouldShowWelcomeScreen(activePlayers)) {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("welcome-screen").style.display = "block";
  } else {
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("current-round").innerHTML = "Round " + gameState.currentRound;
    document.getElementById("user-score").innerHTML = getCurrentUserScore(activePlayers) + " points";

    if (gameState.activeRound) {
      document.getElementById("question-prompt").innerHTML = gameState.activeRound.prompt[0] + " X " + gameState.activeRound.prompt[1];
      document.getElementById("submit-answer").style.display = "inline-block";
      document.getElementById("start-next-round").style.display = "none";
    } else {
      document.getElementById("start-next-round").style.display = "inline-block";
      document.getElementById("submit-answer").style.display = "none";
    }
  }
  // #scoreboard-list
  // <li>Player 1 (34 points)</li>
  var scoreboardHtml = ""
  for (var player of activePlayers) {
    scoreboardHtml += "<li>" + player.displayName + " (" + player.score + " points)</li>";
  }
  document.getElementById("scoreboard-list").innerHTML = scoreboardHtml;
}

function notifyUser(notification) {
  if (notification.type === "USER_ANSWERED_CORRECTLY_FIRST") {
    document.getElementById("notification-title").innerHTML = "+2 POINTS";
    document.getElementById("notification-message").innerHTML = "First Correct Answer!";
    confetti(document.getElementById("confetti-holder"));
  } else if (notification.type === "USER_ANSWERED_CORRECTLY") {
    document.getElementById("notification-title").innerHTML = "+1 POINT";
    document.getElementById("notification-message").innerHTML = "Correct Answer!";
    confetti(document.getElementById("confetti-holder"));
  }
  document.getElementById("notification-holder").classList.add('visible');
  setTimeout(() => {
    document.getElementById("notification-holder").classList.remove('visible');
  }, 2000);
}

////////////////////////////////////////////////
////// END OF UI CODE
///////////////////////////////////////////////


webSocket.onmessage = (event) => {
  let serverMessage = JSON.parse(event.data);
  if (serverMessage) {
    if (serverMessage.messageType === "GAME_STATE_CHANGE") {
      updateUI(serverMessage);
    } else if (serverMessage.messageType === "NOTIFY_USER") {
      notifyUser(serverMessage.notification);
    }
  }
  printMessage(JSON.stringify(serverMessage, undefined, 4));
};

document.getElementById("join-game").onclick = () => {
  const joinGameObject = {
    action: "JOIN_GAME",
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  };
  webSocket.send(JSON.stringify(joinGameObject));
};

document.getElementById("start-next-round").onclick = () => {
  // 
  const startGameObject = {
    action: "START_NEXT_ROUND"
  };
  webSocket.send(JSON.stringify(startGameObject));
};

document.getElementById("submit-answer").onclick = () => {
  const submitAnswerObject = {
    action: "SUBMIT_ANSWER",
    answer: document.getElementById("answer-field").value
  };
  webSocket.send(JSON.stringify(submitAnswerObject));
};
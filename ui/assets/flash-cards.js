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

let roundCountdownTimerIntervalId;
function updateRoundCountdownTimer(activeRound) {
  if (activeRound && roundCountdownTimerIntervalId === undefined) {
    roundCountdownTimerIntervalId = setInterval(() => {
      let timeLeft = activeRound.expireTime - new Date().getTime();
      if (timeLeft < 0) {
        timeLeft = 0;
      }
      document.getElementById("time-left-in-round").innerHTML = (Math.round(timeLeft / 100) / 10).toFixed(1);
    }, 49);
  }
}

function turnOffRoundCountdownTimer() {
  if (roundCountdownTimerIntervalId !== undefined) {
    clearInterval(roundCountdownTimerIntervalId);
    roundCountdownTimerIntervalId = undefined;
  }
}

function updateUI(serverMessage) {
  // TODO - put in big timer notifying user when next round starts. Use yellow notification UI?
  // TODO - put in cool block graphics to show why answer is correct  
  // TODO - improve yellow notification UI... hard to read

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
      updateRoundCountdownTimer(gameState.activeRound);
    } else {
      document.getElementById("start-next-round").style.display = "inline-block";
      document.getElementById("submit-answer").style.display = "none";
      turnOffRoundCountdownTimer();
    }
  }

  
  var scoreboardHtml = ""
  let sortedPlayersByScore = activePlayers.sort((a, b) => {
    return b.score - a.score;
  });
  for (var player of sortedPlayersByScore) {
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
  // TODO - validate user input. Set maximum length and alphanumeric only
  localStorage.setItem("displayName", document.getElementById("display-name").value);
  const joinGameObject = {
    action: "JOIN_GAME",
    tenantId: tenantId,
    gameId: gameId,
    userId: userId,
    displayName: document.getElementById("display-name").value
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

document.getElementById("display-name").value = localStorage.getItem("displayName");
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

function hasPlayerJoinedGame(activePlayers) {
  let retVal = false;
  for (var player of activePlayers) {
    if (player.id === userId) {
      retVal = true;
      break;
    }
  }
  return retVal;
}

function shouldShowWelcomeScreen(activePlayers) {
  return !activePlayers || activePlayers.length === 0 || !hasPlayerJoinedGame(activePlayers);
}

function updateUI(serverMessage) {
  let gameState = serverMessage.gameState;
  let activePlayers = serverMessage.activePlayers;
  if (shouldShowWelcomeScreen(activePlayers)) {
    document.getElementById("game-screen").style.display = "none";
    document.getElementById("welcome-screen").style.display = "block";
  } else {
    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("current-round").innerHTML = "Round " + gameState.currentRound;
    if (gameState.activeRound) {
      document.getElementById("question-prompt").innerHTML = gameState.activeRound.prompt[0] + " X " + gameState.activeRound.prompt[1];

    }
  }
}

function notifyUser(notification) {
  if (notification.type === "USER_ANSWERED_CORRECTLY_FIRST") {    
    document.getElementById("notification-title").innerHTML = "+2 POINTS";
    document.getElementById("notification-message").innerHTML = "First Correct Answer!";
    confetti(document.getElementById("submit-answer"));
  } else if (notification.type === "USER_ANSWERED_CORRECTLY") {
    document.getElementById("notification-title").innerHTML = "+1 POINTS";
    document.getElementById("notification-message").innerHTML = "Correct!";
    confetti(document.getElementById("submit-answer"));
  }
  document.getElementById("notification-holder").classList.add('visible');
  setTimeout(() => {
    document.getElementById("notification-holder").classList.remove('visible');
  }, 2000);
}

////////////////////////////////////////////////
////// END OF UI CODE
///////////////////////////////////////////////

// {
//   "gameType": "FLASH_CARDS_MULTIPLICATION",
//   "activePlayers": [
//       {
//           "id": "user-555",
//           "displayName": "user-555"
//       }
//   ],
//   "gameState": {
//       "currentRound": 2,
//       "hasGameStarted": true,
//       "activeRound": {
//           "id": "e70613f3-db99-473c-bd57-b7ed8893c01c",
//           "startTime": 1587641240309,
//           "expireTime": 1587641250309,
//           "prompt": [
//               12,
//               2
//           ],
//           "answers": {}
//       },
//       "pastTenRounds": [
//           {
//               "id": "88d59466-9364-44d0-b6eb-cc92c05eb9ad",
//               "startTime": 1587641141750,
//               "expireTime": 1587641151750,
//               "endTime": 1587641151766,
//               "prompt": [
//                   9,
//                   12
//               ],
//               "answers": {}
//           }
//       ]
//   }
// }

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
let userId = new URLSearchParams(window.location.search).get('userId');
const tenantId = new URLSearchParams(window.location.search).get('tenantId');
const gameId = new URLSearchParams(window.location.search).get('gameId');



////////////////////////////////////////////////
////// UI CODE - belongs somewhere else
///////////////////////////////////////////////

hasGameEndedForThisUser = false;

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

// TODO - countdown lags 0.8 s when hosted in heroku
// Perhaps adjust for latency by keeping track of server time?

let roundCountdownTimerIntervalId;
function updateRoundCountdownTimer(activeRound) {
  if (activeRound && hasUserAlreadyAnswered(activeRound.answers)) {
    turnOffRoundCountdownTimer();
    document.getElementById("round-status").innerHTML = "Waiting on other players...";
  } else if (activeRound && roundCountdownTimerIntervalId === undefined) {
    roundCountdownTimerIntervalId = setInterval(() => {
      let timeLeft = activeRound.expireTime - new Date().getTime();
      if (timeLeft < 0) {
        timeLeft = 0;
      }
      document.getElementById("round-status").innerHTML = (Math.round(timeLeft / 100) / 10).toFixed(1) + " seconds";
    }, 49);
  }
}

function turnOffRoundCountdownTimer() {
  if (roundCountdownTimerIntervalId !== undefined) {
    clearInterval(roundCountdownTimerIntervalId);
    roundCountdownTimerIntervalId = undefined;
  }
}


let lastResizeTimeStamp = new Date().getTime();
function adjustBlockHeight() {
  // Only resize every 500ms or longer
  if (new Date().getTime() - lastResizeTimeStamp > 500) {
    lastResizeTimeStamp = new Date().getTime();
    var elems = document.querySelectorAll(`#animated-blocks-table tr td`);
    for (var i = 0; i < elems.length; i++) {
      elems[i].width = elems[i].getBoundingClientRect().height;
    }
  }
}

window.addEventListener('resize', (event) => {  
  adjustBlockHeight();
});

let blocksAlreadyRenderedRoundId;
function fillInAnimatedBlocks(activeRound) {
  if (activeRound && blocksAlreadyRenderedRoundId !== activeRound.id) {
    blocksAlreadyRenderedRoundId = activeRound.id;
    for (let i = 11; i > -1; i--) {
      for (let j = 0; j < 12; j++) {
        document.querySelector(`#animated-blocks-table tr:nth-child(${i + 1}) td:nth-child(${j + 1})`).classList.remove("filled-in");
      }
    }
    let counter = 0;
    for (let j = 11; j > (11 - activeRound.prompt[1]); j--) {
      for (let i = 0; i < activeRound.prompt[0]; i++) {
        counter++;
        setTimeout(() => {
          document.querySelector(`#animated-blocks-table tr:nth-child(${j + 1}) td:nth-child(${i + 1})`).classList.add("filled-in");
        }, 21 * counter);
      }
    }

  }
}

function showModal() {
  document.getElementById("modal").classList.add('active');
}
function hideModal() {
  // Do not close if next round countdown is active or if game has ended for user
  if (nextRoundCountdownTimerIntervalId === undefined && !hasGameEndedForThisUser) {
    document.getElementById("modal").classList.remove('active');
  }
}
function showShareLinkSection() {
  document.getElementById("share-link-section").style.display = "block";
  showModal();
  document.getElementById("game-share-link").focus();
  document.getElementById("game-share-link").select();
}

function turnOnNotificationMessage() {
  document.getElementById("share-link-section").style.display = "none";
  document.getElementById("notification-holder").style.display = "block";
  showModal();
}
function turnOffNotificationMessage() {
  // Only turn off if next round countdown is not active
  if (nextRoundCountdownTimerIntervalId === undefined) {
    hideModal();
    document.getElementById("notification-holder").style.display = "none";
  }
}

let nextRoundCountdownTimerIntervalId;
function updateNextRoundCountdownTimer(nextRoundStartTime) {
  if (nextRoundStartTime !== undefined && nextRoundCountdownTimerIntervalId === undefined) {

    document.getElementById("notification-title").innerHTML = "Next Round Starting";
    turnOnNotificationMessage();

    nextRoundCountdownTimerIntervalId = setInterval(() => {
      let timeLeft = nextRoundStartTime - new Date().getTime();
      if (timeLeft <= 0) {
        timeLeft = 0;
      }
      document.getElementById("notification-message").innerHTML = (Math.round(timeLeft / 100) / 10).toFixed(1) + " seconds";
    }, 49);
  }
}

function turnOffNextRoundCountdownTimer() {
  if (nextRoundCountdownTimerIntervalId !== undefined) {
    clearInterval(nextRoundCountdownTimerIntervalId);
    nextRoundCountdownTimerIntervalId = undefined;
    turnOffNotificationMessage();
  }
}

function turnOnUserAnswerFields() {
  if (document.getElementById("answer-question-form").style.display === "none") {
    document.getElementById("answer-field").value = '';
    document.getElementById("answer-question-form").style.display = "inline-block";
    document.getElementById("answer-field").focus();
    document.getElementById("submit-answer").disabled = true;
  }
}

function turnOffUserAnswerFields() {
  document.getElementById("answer-question-form").style.display = "none";
}

function hasUserAlreadyAnswered(answers) {
  return answers[userId] !== undefined;
}

function prepareHiddenAnswerDisplay(questionPrompt) {
  document.getElementById("correct-answer").innerHTML = "Correct answer: " + questionPrompt[0] * questionPrompt[1];
}

function turnOnRealAnswerDisplay() {
  document.getElementById("correct-answer").style.display = "block";
}

function turnOffRealAnswerDisplay() {
  document.getElementById("correct-answer").style.display = "none";
}

function endGame(message) {
  hasGameEndedForThisUser = true;
  document.getElementById("notification-title").innerHTML = "GAME OVER";
  if (message) {
    document.getElementById("notification-message").innerHTML = message;
  }
  turnOnNotificationMessage();
}

function updateUI(serverMessage) {

  let gameState = serverMessage.gameState;
  let activePlayers = serverMessage.activePlayers;
  if (shouldShowWelcomeScreen(activePlayers)) {

    if (document.getElementById("welcome-screen").style.display === "none") {
      document.getElementById("game-screen").style.display = "none";
      document.getElementById("welcome-screen").style.display = "block";
      document.getElementById("display-name").focus();
    }

  } else {

    document.getElementById("welcome-screen").style.display = "none";
    document.getElementById("game-screen").style.display = "block";
    document.getElementById("current-round").innerHTML = "Round " + gameState.currentRoundIndex;
    
    adjustBlockHeight();
    if (gameState.activeRound) {

      document.getElementById("question-prompt").innerHTML = gameState.activeRound.prompt[0] + " X " + gameState.activeRound.prompt[1];
      fillInAnimatedBlocks(gameState.activeRound);
      prepareHiddenAnswerDisplay(gameState.activeRound.prompt);

      if (!hasUserAlreadyAnswered(gameState.activeRound.answers)) {
        turnOffRealAnswerDisplay();
        turnOnUserAnswerFields();
      } else {
        turnOnRealAnswerDisplay();
        turnOffUserAnswerFields();
      }

      document.getElementById("start-next-round").style.display = "none";
      updateRoundCountdownTimer(gameState.activeRound);
    } else {
      turnOffUserAnswerFields();
      turnOffRoundCountdownTimer();
      if (document.getElementById("start-next-round").style.display === "none") {
        document.getElementById("start-next-round").style.display = "inline-block";
        document.getElementById("start-next-round").focus();
        document.getElementById("round-status").innerHTML = "Completed";
      }
    }

    if (gameState.nextRoundStartTime !== undefined) {
      updateNextRoundCountdownTimer(gameState.nextRoundStartTime);
    } else {
      turnOffNextRoundCountdownTimer()
    }
  }

  var scoreboardHtml = ""
  let sortedPlayersByScore = activePlayers.sort((a, b) => {
    return b.score - a.score;
  });
  for (var player of sortedPlayersByScore) {
    let scoreString = + player.score + " points";
    if (player.score === 1) {
      scoreString = "1 point";
    }
    if (player.id === userId) {
      scoreboardHtml += "<li class='current-user'>" + player.displayName + "<br/>(" + scoreString + ")</li>";
    } else {
      scoreboardHtml += "<li>" + player.displayName + "<br/>(" + player.score + " points)</li>";
    }
  }
  document.getElementById("scoreboard-list").innerHTML = scoreboardHtml;
}

function notifyUser(notification) {

  let notificationDuration = 3000;

  if (notification.type === "USER_ANSWERED_CORRECTLY_FIRST") {
    document.getElementById("notification-title").innerHTML = "+2 POINTS";
    document.getElementById("notification-message").innerHTML = "First to Answer Correctly!";
    confetti(document.getElementById("confetti-holder"));
  } else if (notification.type === "USER_ANSWERED_CORRECTLY") {
    document.getElementById("notification-title").innerHTML = "+1 POINT";
    document.getElementById("notification-message").innerHTML = "Correct Answer!";
    confetti(document.getElementById("confetti-holder"));
  } else if (notification.type === "USER_ANSWERED_INCORRECTLY") {
    document.getElementById("notification-title").innerHTML = "+0 POINTS";
    document.getElementById("notification-message").innerHTML = "Incorrect answer.";
    confetti(document.getElementById("confetti-holder"), {
      divContent: ":(",
      colors: [""],
      width: "50px",
      height: "50px",
      fontSize: "45px",
      elementCount: 25
    });
  } else if (notification.type === "NEW_USER_JOINED_GAMES") {
    if (notification.userId === userId) {
      document.getElementById("notification-title").innerHTML = "WELCOME";
      document.getElementById("notification-message").innerHTML = "You have joined the game!";
    } else {
      document.getElementById("notification-title").innerHTML = "NEW PLAYER";
      document.getElementById("notification-message").innerHTML = notification.displayName + " has joined!";
    }
    notificationDuration = 2000;
    confetti(document.getElementById("confetti-holder"));
  }

  turnOnNotificationMessage();
  setTimeout(() => {
    turnOffNotificationMessage();
  }, notificationDuration);
}

document.getElementById("show-share-link").onclick = () => {
  showShareLinkSection();
};
document.getElementById("modal-overlay").onclick = () => {
  hideModal();
};

////////////////////////////////////////////////
////// END OF UI CODE
///////////////////////////////////////////////


// TODO - in the real world, web sockets and http would be on different ports.
const webSocketUrl = location.origin.replace(/^http/, 'ws');

const webSocket = new WebSocket(webSocketUrl);
webSocket.onopen = () => {
  webSocket.send(JSON.stringify({
    action: "INITIALIZE_CONNECTION",
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
      document.getElementById("game-share-link").value = location.href.split("?")[0] + "?gameId=" + serverMessage.gameId;
    } else if (serverMessage.messageType === "PING") {
      webSocket.send(JSON.stringify({
        action: "PONG"
      }));
    } else if (serverMessage.messageType === "GAME_NOT_FOUND") {
      endGame(`Could not find game ${serverMessage.gameId}. <a href="/">Please start a new game.</a>`);
    }
  }
  printMessage(JSON.stringify(serverMessage, undefined, 4));
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

document.getElementById("start-next-round").onclick = () => {
  startNextRound();
};

document.getElementById("answer-field").onchange = () => {
  if (document.getElementById("answer-field").value !== undefined) {
    document.getElementById("submit-answer").disabled = false;
  }
};

document.getElementById("answer-field").onkeyup = () => {
  if (document.getElementById("answer-field").value !== undefined) {
    document.getElementById("submit-answer").disabled = false;
  }
};

document.getElementById("display-name").value = localStorage.getItem("displayName");
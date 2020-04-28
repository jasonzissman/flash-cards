const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const app = express();
const httpPort = 3001;
const webSocketPort = 3002;

// TODO - run through back end and make sure null-pointer exceptions cannot take down app.
// TODO - after running for a while and hitting refresh a lot: "MaxListenersExceededWarning: Possible EventEmitter memory leak detected. 11 game-state-changed listeners added to [GameStateChangeEmitter]. Use emitter.setMaxListeners() to increase limit"

const gameHelper = require("./app/games/game-helper");

// HTML/JS
app.use(express.static('ui'));

// See active games for tenant
app.get('/:tenantId/active-games', (req, res) => {
  let tenantId = req.params.tenantId;
  let activeGamesForTenant = gameHelper.getActiveGamesForTenant(tenantId);
  res.status(200).json(activeGamesForTenant);
});

let initializeConnection = (message, webSocketConn) => {

  // TODO - eventually, instead of trusting client, establish token generation scheme
  // where 1-time use token is associated with these points.

  let gameId = message.gameId;
  if (!gameId) {
    gameId = gameHelper.createNewGame(message.tenantId);
  } else {
    gameId = gameId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 50).trim();
  }

  let tenantId = message.tenantId;
  if (!tenantId) {
    tenantId = "GENERIC_TENANT_ID";
  } else {
    tenantId = tenantId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 50).trim();
  }

  let userId = message.userId;
  if (!userId) {
    userId = uuidv4();
  } else {
    userId = userId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 50).trim();
  }

  webSocketConn.sessionInfo = {
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  };

  // Alert user of updates to the game
  gameHelper.getGame(gameId).gameState.gameStateChangeEmitter.on('game-state-changed', (gameState) => {
    let message = {
      gameType: "FLASH_CARDS_MULTIPLICATION",
      messageType: "GAME_STATE_CHANGE",
      activePlayers: gameHelper.getGame(gameId).activePlayers,
      gameState: gameState
    }
    webSocketConn.send(JSON.stringify(message));
  });

  gameHelper.getGame(gameId).gameState.gameStateChangeEmitter.on('notify-user', (userId, notification) => {
    // TODO - confirm that this only is sent to intended user,
    // not all users or other users.
    if (webSocketConn.sessionInfo.userId === userId) {
      let message = {
        gameType: "FLASH_CARDS_MULTIPLICATION",
        messageType: "NOTIFY_USER",
        notification: notification
      }
      webSocketConn.send(JSON.stringify(message));
    }
  });

  webSocketConn.send(JSON.stringify({
    gameType: "FLASH_CARDS_MULTIPLICATION",
    messageType: "INIT_CONNECTION_COMPLETE",
    tenantId: webSocketConn.sessionInfo.tenantId,
    gameId: webSocketConn.sessionInfo.gameId,
    userId: webSocketConn.sessionInfo.userId
  }));
};

function isValidRequest(messageStr) {
  let isValid = messageStr && messageStr.length < 1000;

  if (isValid) {
    try {
      JSON.parse(messageStr);
    } catch (e) {
      console.log("Improper JSON provided!");
      isValid = false;
    }
  }

  return isValid;
}

// Handle websocket connection
const webSocketServer = new WebSocket.Server({ port: webSocketPort });
webSocketServer.on('connection', (webSocketConn) => {

  console.log('connection established');

  // On message received
  webSocketConn.on('message', (messageStr) => {

    if (!isValidRequest(messageStr)) {
      console.log("Invalid message!!! Size: " + messageStr.length);
      let message = {
        gameType: "FLASH_CARDS_MULTIPLICATION",
        messageType: "INVALID_MESSAGE_PROVIDED",
        message: "Invalid message provided."
      };
      webSocketConn.send(JSON.stringify(message));
      
    } else {

      let message = JSON.parse(messageStr);
      message.action = message.action.replace(/[^a-z-_0-9]+/gi, " ").substring(0,50).trim();

      // If trying to join game but no ID, create a game
      if (message.action === "INITIALIZE_CONNECTION") {
        initializeConnection(message, webSocketConn);
      } else {
        const gameId = webSocketConn.sessionInfo.gameId;
        const tenantId = webSocketConn.sessionInfo.tenantId;
        const userId = webSocketConn.sessionInfo.userId;

        let response = gameHelper.processMessage(gameId, tenantId, userId, message);
        webSocketConn.send(JSON.stringify(response));
      }
    }


  });

  // On connection ended
  // TODO - TEST IF THIS IS DOING WHAT YOU THINK
  webSocketConn.on('close', () => {
    console.log("WS conn closed");
    if (webSocketConn.sessionInfo) {
      const gameId = webSocketConn.sessionInfo.gameId;
      const tenantId = webSocketConn.sessionInfo.tenantId;
      const userId = webSocketConn.sessionInfo.userId;
      let response = gameHelper.exitGame(gameId, tenantId, userId);
      webSocketConn.send(JSON.stringify(response));
    }
  });

  // TODO - put in heartbeat/ping that periodically confirms connections are still active.
  // example: https://github.com/websockets/ws#how-to-detect-and-close-broken-connections

});


app.listen(httpPort, () => {
  console.log('Flashcards app listening on port %s!', httpPort);
});
const express = require('express');
const WebSocket = require('ws');
const { v4: uuidv4 } = require('uuid');
const logger = require('./app/games/log-helper');
const app = express();
const httpPort = 3001;
const webSocketPort = 3002;

// TODO - run through back end and make sure null-pointer exceptions cannot take down app.
// THIS INCLUDES SOMEONE SENDING WS COMMANDS AGAINST NON-EXISTENT GAMES OR USERS OR TENANTS

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

  let tenantId = message.tenantId;
  if (!tenantId) {
    tenantId = "GENERIC_TENANT_ID";
  } else {
    tenantId = tenantId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();
  }

  let gameId = message.gameId;
  if (!gameId) {
    gameId = gameHelper.createNewGame(tenantId);
  } else {
    gameId = gameId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();
  }

  let userId = message.userId;
  if (!userId) {
    userId = uuidv4();
  } else {
    userId = userId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();
  }

  webSocketConn.sessionInfo = {
    tenantId: tenantId,
    gameId: gameId,
    userId: userId
  };

  webSocketConn.sendGameStateChange = (gameState) => {
    webSocketConn.send(JSON.stringify({
      gameType: "FLASH_CARDS_MULTIPLICATION",
      messageType: "GAME_STATE_CHANGE",
      activePlayers: gameHelper.getGame(gameId).activePlayers,
      gameState: gameState
    }));
  };
  gameHelper.getGame(gameId).gameState.gameStateChangeEmitter.on('game-state-changed', webSocketConn.sendGameStateChange);

  webSocketConn.sendUserNotification = (notification) => {
    let message = {
      gameType: "FLASH_CARDS_MULTIPLICATION",
      messageType: "NOTIFY_USER",
      notification: notification
    }
    webSocketConn.send(JSON.stringify(message));
  };
  const userSpecificEventName = 'notify-user-' + userId;
  gameHelper.getGame(gameId).gameState.gameStateChangeEmitter.on(userSpecificEventName, webSocketConn.sendUserNotification);

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
      logger.info("Improper JSON provided!");
      isValid = false;
    }
  }

  return isValid;
}

// Handle websocket connection
const webSocketServer = new WebSocket.Server({ port: webSocketPort });
webSocketServer.on('connection', (webSocketConn) => {

  logger.info('connection established');

  webSocketConn.isAlive = true;

  webSocketConn.on('message', (messageStr) => {

    if (!isValidRequest(messageStr)) {
      logger.error("Invalid message!!! Size: " + messageStr.length);
      let message = {
        gameType: "FLASH_CARDS_MULTIPLICATION",
        messageType: "INVALID_MESSAGE_PROVIDED",
        message: "Invalid message provided."
      };
      webSocketConn.send(JSON.stringify(message));

    } else {

      let message = JSON.parse(messageStr);
      message.action = message.action.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();

      if (message.action === "INITIALIZE_CONNECTION") {
        initializeConnection(message, webSocketConn);
      } else if (message.action === "PONG") {
        // PING-PONG heartbeat to confirm connection is still alive
        webSocketConn.isAlive = true;
      } else {
        const gameId = webSocketConn.sessionInfo.gameId;
        const tenantId = webSocketConn.sessionInfo.tenantId;
        const userId = webSocketConn.sessionInfo.userId;
        let response = gameHelper.processMessage(gameId, tenantId, userId, message);
        webSocketConn.send(JSON.stringify(response));
      }
    }
  });

  webSocketConn.on('close', () => {

    if (webSocketConn.sessionInfo) {
      const gameId = webSocketConn.sessionInfo.gameId;
      const tenantId = webSocketConn.sessionInfo.tenantId;
      const userId = webSocketConn.sessionInfo.userId;

      let response = gameHelper.exitGame(gameId, tenantId, userId);

      let game = gameHelper.getGame(gameId);
      if (game) {
        game.gameState.gameStateChangeEmitter.removeListener('game-state-changed', webSocketConn.sendGameStateChange);
        const userSpecificEventName = 'notify-user-' + userId;
        game.gameState.gameStateChangeEmitter.removeAllListeners(userSpecificEventName);

        if (game.activePlayers.length === 0) {
          gameHelper.deleteGame(gameId);
        }
      }

      webSocketConn.send(JSON.stringify(response));
    }
  });
});

const pingAllConnectionsInterval = setInterval(() => {
  webSocketServer.clients.forEach((webSocketConn) => {
    if (webSocketConn.isAlive === false) {
      return webSocketConn.terminate();
    }
    webSocketConn.isAlive = false;
    webSocketConn.send(JSON.stringify({
      gameType: "FLASH_CARDS_MULTIPLICATION",
      messageType: "PING",
    }));  });
}, 30000);

webSocketServer.on('close', () => {
  clearInterval(pingAllConnectionsInterval);
});

app.listen(httpPort, () => {
  logger.info('Flashcards app listening on port %s!', httpPort);
});
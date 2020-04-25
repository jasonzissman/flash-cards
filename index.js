const express = require('express');
const WebSocket = require('ws');
const app = express();
const httpPort = 3001;
const webSocketPort = 3002;

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
  let gameId = message.gameId;
  if (!gameId) {
    gameId = gameHelper.createNewGame(message.tenantId);
  }

  // TODO - eventually, instead of trusting client, establish token generation scheme
  // where token is associated with these points.
  webSocketConn.sessionInfo = {
    tenantId: message.tenantId,
    gameId: gameId,
    userId: message.userId
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
};

// Handle websocket connection
const webSocketServer = new WebSocket.Server({ port: webSocketPort });
webSocketServer.on('connection', (webSocketConn) => {

  console.log('connection established');

  // On message received
  webSocketConn.on('message', (messageStr) => {

    // TODO - validate client input

    let message = JSON.parse(messageStr);

    // If trying to join game but no ID, create a game
    if (message.action === "INITIALIZE_CONNECTION") {
      initializeConnection(message, webSocketConn);
    }

    const gameId = webSocketConn.sessionInfo.gameId;
    const tenantId = webSocketConn.sessionInfo.tenantId;
    const userId = webSocketConn.sessionInfo.userId;

    let response = gameHelper.processMessage(gameId, tenantId, userId, message);

    webSocketConn.send(JSON.stringify(response));
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

  webSocketConn.send(JSON.stringify({ status: "connection established" }));
});


app.listen(httpPort, () => {
  console.log('Flashcards app listening on port %s!', httpPort);
});
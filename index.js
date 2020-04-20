const express = require('express');
const WebSocket = require('ws');
const app = express();
const httpPort = 3001;
const webSocketPort = 3002;

const gameHelper = require("./app/games/game-helper");

// HTML/JS
app.use(express.static('ui'));

// TODO why differentiate create game from join game from start game? should all be the same.
// Create new game
// app.post('/:tenantId/games', (req, res) => {


//   let tenantId = req.params.tenantId;
//   const gameId = gameHelper.createNewGame(tenantId);

//   res.status(200).json({
//     gameId: gameId
//   });
// });

// See active games for tenant
app.get('/:tenantId/active-games', (req, res) => {
  let tenantId = req.params.tenantId;
  let activeGamesForTenant = gameHelper.getActiveGamesForTenant(tenantId);
  res.status(200).json(activeGamesForTenant);
});

// Handle websocket connection
const webSocketServer = new WebSocket.Server({ port: webSocketPort });
webSocketServer.on('connection', (webSocketConn) => {

  console.log('connection established');

  // On message received
  webSocketConn.on('message', (messageStr) => {
    let message = JSON.parse(messageStr);
    console.log('received: ' + JSON.stringify(message, undefined, 4));

    // TODO - implement this!
    // If trying to join game but no ID, create a game
    // if (message.action === "JOIN_GAME" && !message.gameId && message.tenantId) {
    //  message.gameId = gameHelper.createNewGame(message.tenantId); 
    // }

    // Associate this connection with the game/tenant/user
    if (!webSocketConn.sessionInfo) {
      // TODO - eventually, instead of trusting client, establish token generation scheme
      // where token is associated with these points.
      webSocketConn.sessionInfo = {
        tenantId: message.tenantId,
        gameId: message.gameId,
        userId: message.userId
      };
    }

    const gameId = webSocketConn.sessionInfo.gameId;
    const tenantId = webSocketConn.sessionInfo.tenantId;
    const userId = webSocketConn.sessionInfo.userId;

    let response = gameHelper.processMessage(gameId, tenantId, userId, message);

    if (response.newUserJoined && response.status === "Succesfully joined game") {
      // Set up websocket listener and send current game state to user
      gameHelper.getGame(gameId).gameState.gameStateChangeEmitter.on('game-state-changed', (gameState) => {
        let message = {
          gameType: "FLASH_CARDS_MULTIPLICATION",
          activePlayers: gameHelper.getGame(gameId).activePlayers,
          gameState: gameState
        };
        webSocketConn.send(JSON.stringify(message));
      });
      webSocketConn.send(JSON.stringify(gameHelper.getGame(gameId).gameState.getUserViewOfGameState()));
    }

    webSocketConn.send(JSON.stringify(response));
  });

  // On connection ended
  webSocketConn.on('close', () => {
    console.log("WS conn closed");
    const gameId = webSocketConn.sessionInfo.gameId;
    const tenantId = webSocketConn.sessionInfo.tenantId;
    const userId = webSocketConn.sessionInfo.userId;
    let response = gameHelper.exitGame(gameId, tenantId, userId);
    webSocketConn.send(JSON.stringify(response));
  });

  // TODO - put in heartbeat/ping that periodically confirms connections are still active.
  // example: https://github.com/websockets/ws#how-to-detect-and-close-broken-connections

  webSocketConn.send(JSON.stringify({ status: "connection established" }));
});


app.listen(httpPort, () => {
  console.log('Flashcards app listening on port %s!', httpPort);
});
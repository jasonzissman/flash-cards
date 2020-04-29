const express = require('express');
const logger = require('./app/games/log-helper');
const WebSocketHelper = require('./app/games/websocket-helper');
const gameHelper = require("./app/games/game-helper");
const app = express();
const httpPort = 3001;

// HTML/JS
app.use(express.static('ui'));

// See active games for tenant
app.get('/:tenantId/active-games', (req, res) => {
  let tenantId = req.params.tenantId;
  let activeGamesForTenant = gameHelper.getActiveGamesForTenant(tenantId);
  res.status(200).json(activeGamesForTenant);
});

WebSocketHelper.startWebSocketServer();

app.listen(httpPort, () => {
  logger.info('Flashcards app listening on port %s!', httpPort);
});
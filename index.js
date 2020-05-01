const express = require('express');
const logger = require('./app/games/log-helper');
const WebSocketHelper = require('./app/games/websocket-helper');
const gameHelper = require("./app/games/game-helper");
const app = express();
const httpPort = process.env.PORT || 3001;

// HTML/JS
app.use(express.static('ui'));

// See active games for tenant
app.get('/:tenantId/active-games', (req, res) => {
  let tenantId = req.params.tenantId;
  let activeGamesForTenant = gameHelper.getActiveGamesForTenant(tenantId);
  res.status(200).json(activeGamesForTenant);
});


let appListener = app.listen(httpPort, () => {
  logger.info('Flashcards app listening on port %s!', httpPort);
})

// TODO - in the real world, web sockets and http would be on different ports.
WebSocketHelper.startWebSocketServer(appListener);

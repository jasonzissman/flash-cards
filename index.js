const express = require('express');
const WebSocket = require('ws');
const app = express();
const uuidv4 = require('uuid/v4');
const httpPort = 3001;
const webSocketPort = 3002;

// HTML/JS
app.use(express.static('app'));

let CURRENT_GAMES = {};

// Create new game
app.post('/:tenantId/games', (req, res) => {
  let tenantId = req.params.tenantId;
  let gameName = req.query.gameName;

  if (!CURRENT_GAMES[tenantId]) {
    CURRENT_GAMES[tenantId] = [];
  }

  let gameId = uuidv4();
  CURRENT_GAMES[tenantId].push({
    gameId: gameId,
    gameName: gameName,
    status: "NEW"
  });

  res.status(200).json({
    gameId: gameId
  });
});

// See current games for tenant
app.get('/:tenantId/games', (req,res) => {
  let tenantId = req.params.tenantId;
  res.status(200).json(CURRENT_GAMES[tenantId]);
});

const webSocketServer = new WebSocket.Server({ port: webSocketPort });
// /:tenantId/games/:gameId/join
webSocketServer.on('connection', (webSocketConn) => {

  //let tenantId = req.params.tenantId;
  //let gameId = req.params.gameId;

  webSocketConn.on('message', function incoming(message) {
    console.log('received: %s', message);
  });

  webSocketConn.send('something');
});


app.listen(httpPort, () => {
  console.log('Flashcards app listening on port %s!', port);
});
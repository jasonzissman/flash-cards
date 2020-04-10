var express = require('express');
var app = express();
var uuidv4 = require('uuid/v4');
var port = 3001;

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

// Join existing game via WebSocket connection
app.post('/:tenantId/games/:gameId/join', (req, res) => {
  
  // TODO - implement websocket connection!
  // might need to use library other than express for websockets

  let tenantId = req.params.tenantId;
  let gameId = req.params.gameId;

  res.status(200).json({});
});

app.listen(port, () => {
  console.log('Flashcards app listening on port %s!', port);
});
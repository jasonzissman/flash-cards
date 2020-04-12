const EventEmitter = require('events');

class GameStateChangeEmitter extends EventEmitter {};

module.exports = GameStateChangeEmitter;
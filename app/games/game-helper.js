const GameStateChangeEmitter = require('./game-state-change-emitter');
const uuidv4 = require('uuid/v4');

const gameHelper = {

    CURRENT_GAMES: [],

    createNewGame: (tenantId) => {

        let gameId = uuidv4();
        let newGame = {
            id: gameId,
            dateCreated: new Date().getTime(),
            tenantId: tenantId,
            gameStateChangeEmitter: new GameStateChangeEmitter(),
            activePlayers: []
        };

        gameHelper.CURRENT_GAMES.push(newGame);

        return gameId;
    },

    getActiveGamesForTenant: (tenantId) => {
        let activeGames = [];
        for (var game of gameHelper.CURRENT_GAMES) {
            if (game.tenantId === tenantId && game.activePlayers.length > 0) {
                activeGames.push({
                    id: game.id,
                    dateCreated: game.dateCreated,
                    numActivePlayers: game.activePlayers.length
                });
            }
        }
        return activeGames;
    },

    processMessage: (gameId, tenantId, userId, message) => {

        // TODO validate input data here

        let response = {
            message: "Action unknown."
        };

        if (message.action === "JOIN_GAME") {
            // TODO - get display name
            let displayName = userId;
            response = gameHelper.joinGame(gameId, tenantId, userId, displayName);
        }

        let game = gameHelper.getGame(gameId);
        if (game) {
            game.gameStateChangeEmitter.emit('game-state-changed', gameHelper.getUserViewOfGame(gameId));
        }

        return response;
    },

    deleteGame: (gameId) => {
        // TODO - eventually migrate old games elsewhere
        // so that we maintain historical data. Don't just delete.
        
        gameHelper.getGame(gameId).gameStateChangeEmitter.removeAllListeners();
        gameHelper.CURRENT_GAMES = gameHelper.CURRENT_GAMES.filter((game) => {
            return game.id !== gameId;
        });
    },

    getGame: (gameId) => {
        let retVal = undefined;
        for (var game of gameHelper.CURRENT_GAMES) {
            if (game.id === gameId) {
                retVal = game;
                break;
            }
        }
        return retVal;
    },

    getUserViewOfGame: (gameId) => {
        let retVal = undefined;
        let game = gameHelper.getGame(gameId);
        if (game) {
            retVal = {
                id: game.id,
                dateCreated: game.dateCreated,
                numActivePlayers: game.activePlayers.length
            };
        } 
        return retVal;
    },

    exitGame: (gameId, tenantId, userId) => {

        // TODO validate input data here       
        let response = {
            message: "Could not remove user from game."
        };

        const game = gameHelper.getGame(gameId);
        if (game) {
            game.activePlayers = game.activePlayers.filter((activePlayer) => {
                return activePlayer.id !== userId;
            });
    
            console.log("User %s removed from game %s for tenant %s.", userId, gameId, tenantId);
    
            if (game.activePlayers.length === 0) {
                console.log("No more users in game %s for tenant %s. Deleting game.", gameId, tenantId);
                gameHelper.deleteGame(gameId);
            }
            
            game.gameStateChangeEmitter.emit('game-state-changed', gameHelper.getUserViewOfGame(gameId));

            response = {
                message: "User removed from game."
            };
        }

        return response;
    },

    joinGame: (gameId, tenantId, userId, displayName) => {

        let response = {
            status: "Unable to join game"
        };

        // TODO - validate that this user belongs to this tenant and this game

        const game = gameHelper.getGame(gameId);
        if (game) {
            var playerAlreadyJoined = false;
            for (var activePlayer of game.activePlayers) {
                if (activePlayer.id === userId) {
                    playerAlreadyJoined = true;
                    break;
                }
            }
    
            // TODO - if player already joined, consider
            // bouncing previous session for that user and
            // inserting new session anyway
            if (!playerAlreadyJoined) {
                game.activePlayers.push({
                    id: userId,
                    displayName: displayName
                });

                response = {
                    status: "Succesfully joined game",
                    newUserJoined: true,
                };
                console.log("User %s joined game %s for tenant %s.", userId, gameId, tenantId);
            }
        }


        return response;
    }
};

module.exports = gameHelper;
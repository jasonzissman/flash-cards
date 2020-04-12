const uuidv4 = require('uuid/v4');

const gameHelper = {

    CURRENT_GAMES: {},

    createNewGame: (tenantId) => {

        let gameId = uuidv4();

        gameHelper.CURRENT_GAMES.push({
            id: gameId,
            tenantId: tenantId,
            activePlayers: []
        });

        return gameId;
    },

    getActiveGamesForTenant: (tenantId) => {
        let activeGames = [];
        for (var game in gameHelper.CURRENT_GAMES) {
            if (game.tenantId === tenantId && game.activePlayers.length > 0) {
                activeGames.push({
                    id: game.id,
                    tenantId: game.tenantId
                });
            }
        }
        return activeGames;
    },

    processMessage: (sessionInfo, message) => {

        // TODO validate message data here
        let response = {
            message: "Action unknown."
        };

        const gameId = sessionInfo.gameId;
        const tenantId = sessionInfo.tenantId;
        const userId = sessionInfo.userId;

        if (message.action === "JOIN_GAME") {
            response = gameHelper.joinGame(gameId, tenantId, userId);
        }

        return response;
    },

    getGame(gameId) {
        let retVal = undefined;
        for (var game in gameHelper.CURRENT_GAMES) {
            if (game.id === gameId) {
                retVal = game;
                break;
            }
        }
        return retVal;
    },

    joinGame: (gameId, tenantId, userId) => {

        let response = {
            status: "Unable to join game"
        };

        // TODO - validate that this user belongs to this tenant and this game

        const game = gameHelper.getGame(gameId);
        var playerAlreadyJoined = false;
        for (var activePlayer in game.activePlayers) {
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
                userId: userId
            });
            response = {
                status: "Succesfully joined game"
            };
            console.log("User %s joined game %s for tenant %s.", userId, gameId, tenantId);
        }

        return response;
    }
};

module.exports = gameHelper;
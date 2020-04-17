const GameStateFlashCardsMultiplication = require('./game-state-flash-cards-multiplication');
const uuidv4 = require('uuid/v4');

const gameHelper = {

    CURRENT_GAMES: [],

    createNewGame: (tenantId) => {

        let gameId = uuidv4();
        
        let gameState = new GameStateFlashCardsMultiplication();        
        
        let newGame = {
            id: gameId,
            dateCreated: new Date().getTime(),
            tenantId: tenantId,
            gameState: gameState,
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
        } else if (message.action === "START_GAME") {
            response = gameHelper.startGame(gameId);
        } else if (message.action === "SUBMIT_ANSWER") {
            response = gameHelper.submitAnswer(gameId, userId, message.answer);
        } else if (message.action === "START_NEXT_ROUND") {
            response = gameHelper.startNextRound(gameId);
        }

        return response;
    },

    submitAnswer: (gameId, userId, answer) => {
        let response = {
            message: "Could not submit answer."
        };
        let game = gameHelper.getGame(gameId);
        if (game && game.gameState && game.gameState.hasGameStarted) {
            game.gameState.userAnswered(userId, answer);
            response = {
                message: "Answer received."
            };
            if (gameHelper.haveAllPlayersAnswered(gameId)) {
                game.gameState.endRound();
            }
        }        
        return response;
    },

    haveAllPlayersAnswered: (gameId) => {
        let retVal = true;
        let game = gameHelper.getGame(gameId);
        if (game && game.gameState && game.gameState.hasGameStarted) {
            let answers = game.gameState.getCurrentRoundAnswers();
            let activePlayerIds = game.activePlayers.map((player) => {return player.id;});
            for(id of activePlayerIds) {
                if (answers[id] === undefined) {
                    retVal = false;
                }
            }
        }
        return retVal;
    },
    
    startNextRound: (gameId) => {
        // TODO - is this working?
        let response = {
            message: "Could not start next round."
        };
        let game = gameHelper.getGame(gameId);
        if (game && game.gameState && !game.gameState.hasGameStarted) {
            response = game.gameState.startNextRound();
        }
        return response;
    },

    startGame: (gameId) => {
        let response = {
            message: "Could not start game."
        };
        let game = gameHelper.getGame(gameId);
        if (game && game.gameState && !game.gameState.hasGameStarted) {
            game.gameState.startGame();
            response = {
                message: "Game started."
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

                gameHelper.emitGameStateChange(gameId);
                console.log("User %s joined game %s for tenant %s.", userId, gameId, tenantId);
            }
        }

        return response;
    },

    emitGameStateChange: (gameId) => {
        let game = gameHelper.getGame(gameId);
        if (game) {
            game.gameState.gameStateChangeEmitter.emit('game-state-changed', game.gameState.getUserViewOfGameState());
        }
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
                            
            gameHelper.emitGameStateChange(gameId);

            response = {
                message: "User removed from game."
            };
        }

        return response;
    },

    
};

module.exports = gameHelper;
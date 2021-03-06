const GameStateFlashCardsMultiplication = require('./game-state-flash-cards-multiplication');
const GameStateFlashCardsAddition = require('./game-state-flash-cards-addition');
const logger = require('./log-helper');
const { v4: uuidv4 } = require('uuid');

const gameHelper = {

    CURRENT_GAMES: [],

    createNewGame: (tenantId, gameType) => {

        let gameId = uuidv4();

        let gameState;
        if (gameType === "FLASH_CARDS_MULTIPLICATION") {
            gameState = new GameStateFlashCardsMultiplication();
        } else if (gameType === "FLASH_CARDS_ADDITION") {
            gameState = new GameStateFlashCardsAddition();
        }        

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

        let response = {
            message: "Action unknown."
        };

        if (message.action === "JOIN_GAME") {
            message.displayName = message.displayName.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 50).trim();
            response = gameHelper.joinGame(gameId, tenantId, userId, message.displayName);
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
        if (game && game.gameState) {
            game.gameState.userAnswered(userId, answer);

            let correctAnswer = game.gameState.getCorrectAnswerForActiveRound();
            // Double equals (not triple) on purpose to allow for type coercion
            if (answer == correctAnswer) {
                let isFirstToAnswerCorrectly = false;
                if (game.activePlayers.length > 1) {
                    isFirstToAnswerCorrectly = true;
                    for (let [answerUserId, answer] of Object.entries(game.gameState.activeRound.answers)) {
                        // Double equals (not triple) on purpose to allow for type coercion
                        if (answer.answerProvided == correctAnswer && answerUserId != userId) {
                            isFirstToAnswerCorrectly = false;
                            break;
                        }
                    }
                }

                if (isFirstToAnswerCorrectly) {
                    gameHelper.emitNotificationToUser(gameId, userId, { type: "USER_ANSWERED_CORRECTLY_FIRST" });
                } else {
                    gameHelper.emitNotificationToUser(gameId, userId, { type: "USER_ANSWERED_CORRECTLY" });
                }
                for (var activePlayer of game.activePlayers) {
                    if (activePlayer.id === userId) {
                        activePlayer.score += 1;
                        if (isFirstToAnswerCorrectly) {
                            activePlayer.score += 1;
                        }
                        break;
                    }
                }
            } else {
                gameHelper.emitNotificationToUser(gameId, userId, { type: "USER_ANSWERED_INCORRECTLY" });
            }

            gameHelper.emitGameStateChange(gameId);
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
        if (game && game.gameState) {
            let answers = game.gameState.getCurrentRoundAnswers();
            let activePlayerIds = game.activePlayers.map((player) => { return player.id; });
            if (answers && activePlayerIds && activePlayerIds.length > 0) {
                for (id of activePlayerIds) {
                    if (answers[id] === undefined) {
                        retVal = false;
                        break;
                    }
                }
            }
        }
        return retVal;
    },

    startNextRound: (gameId) => {

        let response = {
            message: "Could not start next round."
        };
        let game = gameHelper.getGame(gameId);
        if (game && game.gameState && !game.gameState.activeRound) {
            response = game.gameState.startCountdownToNextRound(game.activePlayers.length);
        }
        return response;
    },

    joinGame: (gameId, tenantId, userId, displayName) => {

        let response = {
            status: "Unable to join game"
        };

        const game = gameHelper.getGame(gameId);
        if (game) {
            var playerAlreadyJoined = false;
            for (var activePlayer of game.activePlayers) {
                if (activePlayer.id === userId) {
                    playerAlreadyJoined = true;
                    break;
                }
            }

            if (!playerAlreadyJoined) {
                game.activePlayers.push({
                    id: userId,
                    displayName: displayName,
                    score: 0
                });

                response = {
                    status: "Succesfully joined game",
                    newUserJoined: true,
                };

                gameHelper.emitGameStateChange(gameId);
                gameHelper.emitNotificationToAllUsers(gameId, {
                    type: "NEW_USER_JOINED_GAMES",
                    userId: userId,
                    displayName: displayName
                });
                logger.info("User %s joined game %s for tenant %s.", userId, gameId, tenantId);
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

    emitNotificationToUser: (gameId, userId, notification) => {
        let game = gameHelper.getGame(gameId);
        if (game) {
            const userSpecificEventName = 'notify-user-' + userId;
            game.gameState.gameStateChangeEmitter.emit(userSpecificEventName, notification);
        }
    },

    emitNotificationToAllUsers: (gameId, notification) => {
        let game = gameHelper.getGame(gameId);
        if (game) {
            for (var activePlayer of game.activePlayers) {
                const userSpecificEventName = 'notify-user-' + activePlayer.id;
                game.gameState.gameStateChangeEmitter.emit(userSpecificEventName, notification);
            }
        }
    },

    deleteGame: (gameId) => {
        // TODO - eventually migrate old games elsewhere
        // so that we maintain historical data. Don't just delete.

        logger.info("Deleting game " + gameId + " since no players left.");
        gameHelper.getGame(gameId).gameState.gameStateChangeEmitter.removeAllListeners();
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

        let response = {
            message: "Could not remove user from game."
        };

        const game = gameHelper.getGame(gameId);
        if (game) {
            game.activePlayers = game.activePlayers.filter((activePlayer) => {
                return activePlayer.id !== userId;
            });

            logger.info("User %s removed from game %s for tenant %s.", userId, gameId, tenantId);

            gameHelper.emitGameStateChange(gameId);

            response = {
                message: "User removed from game."
            };
        }

        return response;
    },


};

module.exports = gameHelper;
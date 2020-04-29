const WebSocket = require('ws');
const gameHelper = require("./game-helper");
const logger = require('./log-helper');
const { v4: uuidv4 } = require('uuid');

// TODO - run through ALL back end and make sure null-pointer exceptions cannot take down app.
// THIS INCLUDES SOMEONE SENDING WS COMMANDS AGAINST NON-EXISTENT GAMES OR USERS OR TENANTS

let webSocketHelper = {

    webSocketServer: new WebSocket.Server({
        port: 3002
    }),

    startWebSocketServer: () => {

        webSocketHelper.webSocketServer.on('connection', (webSocketConn) => {

            webSocketConn.isAlive = true;
            webSocketConn.created = new Date().getTime();
            webSocketConn.lastActivity = new Date().getTime();

            webSocketConn.on('message', (messageStr) => {
                webSocketHelper.handleWebSocketMessage(messageStr, webSocketConn);
            });

            webSocketConn.on('close', () => {
                webSocketHelper.handleWebSocketClose(webSocketConn);
            });
        });

        const pingAllConnectionsInterval = webSocketHelper.startConnectionsHealthPing();
        webSocketHelper.webSocketServer.on('close', () => {
            clearInterval(pingAllConnectionsInterval);
        });
    },

    startConnectionsHealthPing: () => {
        const pingInterval = 30000; // ms
        return setInterval(() => {
            let tenMinutesAgo = new Date().getTime() - 600000;
            let eightHoursAgo = new Date().getTime() - 28800000;
            webSocketHelper.webSocketServer.clients.forEach((webSocketConn) => {
                if (webSocketConn.isAlive === false || webSocketConn.lastActivity < tenMinutesAgo || webSocketConn.created < eightHoursAgo) {
                    logger.info(`Websocket connection expired for user ${webSocketConn.sessionInfo.userId}. Terminating websocket.`);
                    return webSocketConn.terminate();
                }
                webSocketConn.isAlive = false;
                webSocketConn.send(JSON.stringify({
                    gameType: "FLASH_CARDS_MULTIPLICATION",
                    messageType: "PING",
                }));
            });
        }, pingInterval);
    },

    handleWebSocketMessage: (messageStr, webSocketConn) => {

        if (!webSocketHelper.isValidMessage(messageStr)) {
            logger.error("Invalid message!!! Size: " + messageStr.length);
            let message = {
                gameType: "FLASH_CARDS_MULTIPLICATION",
                messageType: "INVALID_MESSAGE_PROVIDED",
                message: "Invalid message provided."
            };
            webSocketConn.send(JSON.stringify(message));

        } else {

            let message = JSON.parse(messageStr);
            message.action = message.action.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();

            if (message.action === "INITIALIZE_CONNECTION") {
                webSocketHelper.initializeWebSocketConnection(webSocketConn, message);
            } else if (message.action === "PONG") {
                // PING-PONG heartbeat to confirm connection is still alive
                webSocketConn.isAlive = true;
            } else {
                webSocketConn.lastActivity = new Date().getTime();
                const gameId = webSocketConn.sessionInfo.gameId;
                const tenantId = webSocketConn.sessionInfo.tenantId;
                const userId = webSocketConn.sessionInfo.userId;
                let response = gameHelper.processMessage(gameId, tenantId, userId, message);
                webSocketConn.send(JSON.stringify(response));
            }
        }
    },

    handleWebSocketClose: (webSocketConn) => {
        if (webSocketConn.sessionInfo) {
            const gameId = webSocketConn.sessionInfo.gameId;
            const tenantId = webSocketConn.sessionInfo.tenantId;
            const userId = webSocketConn.sessionInfo.userId;

            let response = gameHelper.exitGame(gameId, tenantId, userId);

            let game = gameHelper.getGame(gameId);
            if (game) {
                game.gameState.gameStateChangeEmitter.removeListener('game-state-changed', webSocketConn.sendGameStateChange);
                const userSpecificEventName = 'notify-user-' + userId;
                game.gameState.gameStateChangeEmitter.removeAllListeners(userSpecificEventName);

                if (game.activePlayers.length === 0) {
                    gameHelper.deleteGame(gameId);
                }
            }

            webSocketConn.send(JSON.stringify(response));
        }
    },

    isValidMessage: (messageStr) => {
        let isValid = messageStr && messageStr.length < 1000;

        if (isValid) {
            try {
                JSON.parse(messageStr);
            } catch (e) {
                logger.info("Improper JSON provided!");
                isValid = false;
            }
        }

        return isValid;
    },

    getCleansedSessionInfo: (message) => {

        let tenantId = message.tenantId;
        if (!tenantId) {
            tenantId = "GENERIC_TENANT_ID";
        } else {
            tenantId = tenantId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();
        }

        let gameId = message.gameId;
        if (!gameId) {
            gameId = gameHelper.createNewGame(tenantId);
        } else {
            gameId = gameId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();
        }

        let userId = message.userId;
        if (!userId) {
            userId = uuidv4();
        } else {
            userId = userId.replace(/[^a-z-_0-9]+/gi, " ").substring(0, 100).trim();
        }

        return {
            tenantId: tenantId,
            gameId: gameId,
            userId: userId
        };
    },

    initializeWebSocketConnection: (webSocketConn, message) => {

        webSocketConn.sessionInfo = webSocketHelper.getCleansedSessionInfo(message);

        webSocketConn.sendGameStateChange = (gameState) => {
            webSocketConn.send(JSON.stringify({
                gameType: "FLASH_CARDS_MULTIPLICATION",
                messageType: "GAME_STATE_CHANGE",
                activePlayers: gameHelper.getGame(webSocketConn.sessionInfo.gameId).activePlayers,
                gameState: gameState
            }));
        };
        gameHelper.getGame(webSocketConn.sessionInfo.gameId).gameState.gameStateChangeEmitter.on('game-state-changed', webSocketConn.sendGameStateChange);

        webSocketConn.sendUserNotification = (notification) => {
            webSocketConn.send(JSON.stringify({
                gameType: "FLASH_CARDS_MULTIPLICATION",
                messageType: "NOTIFY_USER",
                notification: notification
            }));
        };
        const userSpecificEventName = 'notify-user-' + webSocketConn.sessionInfo.userId;
        gameHelper.getGame(webSocketConn.sessionInfo.gameId).gameState.gameStateChangeEmitter.on(userSpecificEventName, webSocketConn.sendUserNotification);

        webSocketConn.send(JSON.stringify({
            gameType: "FLASH_CARDS_MULTIPLICATION",
            messageType: "INIT_CONNECTION_COMPLETE",
            tenantId: webSocketConn.sessionInfo.tenantId,
            gameId: webSocketConn.sessionInfo.gameId,
            userId: webSocketConn.sessionInfo.userId
        }));
    }
};

module.exports = webSocketHelper;
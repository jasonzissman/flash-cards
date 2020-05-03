function getCurrentPlayerFromActivePlayers(activePlayers, userId) {
    let retVal = undefined;
    for (var player of activePlayers) {
        if (player.id === userId) {
            retVal = player;
            break;
        }
    }
    return retVal;
}

function hasPlayerJoinedGame(activePlayers) {
    return getCurrentPlayerFromActivePlayers(activePlayers, userId) !== undefined;
}

function getCurrentUserScore(activePlayers) {
    return getCurrentPlayerFromActivePlayers(activePlayers, userId).score;
}

function shouldShowWelcomeScreen(activePlayers) {
    return !activePlayers || activePlayers.length === 0 || !hasPlayerJoinedGame(activePlayers);
}
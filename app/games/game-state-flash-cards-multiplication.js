const GameStateFlashCards = require('./game-state-flash-cards');

class GameStateFlashCardsMultiplication extends GameStateFlashCards {

    getCorrectAnswerForActiveRound() {
        if (this.activeRound) {
            return this.activeRound.prompt[0] * this.activeRound.prompt[1];
        }
    }

    generateTwoRandomIntegers() {
        let max = 12;
        return [Math.floor(Math.random() * (max + 1)), Math.floor(Math.random() * (max + 1))];
    }
};

module.exports = GameStateFlashCardsMultiplication;
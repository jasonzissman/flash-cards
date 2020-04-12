class GameStateFlashCardsMultiplication {

    // Simple first pass: use keyboard input, not multiple choice answers

    constructor() {
        this.currentRoundIndex = 0;
        this.rounds = []; // game rounds containing problem presented, each person's answer, who won, right answer, each person's timing
    }

    onGameStateChange(callback) {
        callback();
    }

    startNextRound() {

        this.rounds[this.currentRoundIndex] = {
            startTime: new Date().getTime(),
            endTime: undefined, // TODO - max of 10 seconds. Convey time limit to UI somehow?
            prompt: [4,7], // TODO - generate random integers for multiplying
            answers: [], // Array of {userId, answerProvided, timeSubmitted}
            active: true, // Round is currently being played
        };

        this.onGameStateChange();
    }

    getCurrentRoundInfo() {
        // return question/prompt, index (required for clients joining mid-game)
    }

    getLastTenRoundsInfo() {
        // return winners, question/prompts, right answers for last 10 rounds
    }

    userAnswered(userId, answer) {
        // Update round info to include user's answer and time
        this.onGameStateChange();
    }

    endRound() {
        this.rounds[this.currentRoundIndex].active = false;
        this.rounds[this.currentRoundIndex].endTime = new Date().getTime();
        this.currentRound++;
        this.onGameStateChange();
    }
};

module.exports = GameStateFlashCardsMultiplication;
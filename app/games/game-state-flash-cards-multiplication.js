class GameStateFlashCardsMultiplication {

    // Simple first pass: use keyboard input, not multiple choice answers

    constructor() {
        this.currentRoundIndex = 0;
        this.rounds = []; // game rounds containing problem presented, each person's answer, who won, right answer, each person's timing
    }

    onGameStateChange(callback) {
        if (callback) {
            callback();
        }
    }

    startNextRound() {
        let rightNow = new Date();
        let roundDuration = 10; // seconds
        let expireTime = new Date();
        expireTime.setSeconds(expireTime.getSeconds() + roundDuration);
        this.rounds[this.currentRoundIndex] = {
            startTime: rightNow.getTime(),
            expireTime: expireTime.getTime(), // round cannot end past this time
            endTime: undefined, // time when round actually ended
            prompt: this.generateTwoRandomIntegers(12),
            answers: {}, // {userId: { answerProvided, timeSubmitted}}
            active: true, // Round is currently being played
        };

        setTimeout(() => {
            // TODO - make sure this doesn't bleed in between rounds
            if (this.rounds[this.currentRoundIndex].active) {
                this.endRound();
            }
        }, roundDuration * 1000);

        this.onGameStateChange();
    }

    getCurrentRoundInfo() {
        let currentRound = this.rounds[this.currentRoundIndex];
        return {
            startTime: currentRound.startTime,
            endTime: currentRound.endTime,
            prompt: currentRound.prompt,
            answers: currentRound.answers, // FILTER
            active: currentRound.active
        }
    }

    getLastTenRoundsInfo() {
        // return winners, question/prompts, right answers for last 10 rounds
    }

    userAnswered(userId, answer) {
        // Update round info to include user's answer and time
        let currentRound = this.rounds[this.currentRoundIndex];
        if (currentRound.active) {

            currentRound.answers[userId] = {
                answerProvided: answer,
                timeSubmitted: new Date().getTime()
            };

            this.onGameStateChange();
        }
    }

    endRound() {
        if (this.rounds[this.currentRoundIndex].active) {
            this.rounds[this.currentRoundIndex].active = false;
            this.rounds[this.currentRoundIndex].endTime = new Date().getTime();
            this.currentRound++;
            this.onGameStateChange();
        }
    }

    generateTwoRandomIntegers(max) {
        return [Math.floor(Math.random() * (max + 1)), Math.floor(Math.random() * (max + 1))];
    }
};

module.exports = GameStateFlashCardsMultiplication;
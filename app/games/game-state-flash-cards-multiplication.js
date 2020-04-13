const GameStateChangeEmitter = require('./game-state-change-emitter');

class GameStateFlashCardsMultiplication {

    constructor() {
        this.currentRoundIndex = 0;
        this.hasGameStarted = false;
        this.rounds = []; 
        this.gameStateChangeEmitter = new GameStateChangeEmitter();
    }
    
    emitGameStateChange() {
        this.gameStateChangeEmitter.emit('game-state-changed', this.getUserViewOfGameState());
    }

    startGame() {
        this.hasGameStarted = true;
        this.startNextRound();
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
            let roundIndex = this.currentRoundIndex;
            if (this.rounds[roundIndex].active) {
                this.endRound();
            }
        }, roundDuration * 1000);

        this.emitGameStateChange();
    }

    getUserViewOfGameState () {
        return {
            currentRoundIndex: this.currentRoundIndex,
            hasGameStarted: this.hasGameStarted,
            rounds: this.rounds // TODO - FILTER
        };
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

        let currentRound = this.rounds[this.currentRoundIndex];
        if (currentRound.active) {

            currentRound.answers[userId] = {
                answerProvided: answer,
                timeSubmitted: new Date().getTime()
            };

            this.emitGameStateChange();
        }
    }

    endRound() {
        if (this.rounds[this.currentRoundIndex].active) {
            this.rounds[this.currentRoundIndex].active = false;
            this.rounds[this.currentRoundIndex].endTime = new Date().getTime();
            this.currentRoundIndex++;
            this.emitGameStateChange();
        }
    }

    generateTwoRandomIntegers(max) {
        return [Math.floor(Math.random() * (max + 1)), Math.floor(Math.random() * (max + 1))];
    }
};

module.exports = GameStateFlashCardsMultiplication;
const { v4: uuidv4 } = require('uuid');
const GameStateChangeEmitter = require('./game-state-change-emitter');

class GameStateFlashCardsMultiplication {

    constructor() {
        this.currentRoundIndex = 0;
        this.activeRound = undefined;
        this.activeRoundTimerId = undefined;
        this.pastRounds = [];
        this.gameStateChangeEmitter = new GameStateChangeEmitter();
        this.nextRoundStartTime = undefined;
    }

    emitGameStateChange() {
        this.gameStateChangeEmitter.emit('game-state-changed', this.getUserViewOfGameState());
    }

    startCountdownToNextRound(numActivePlayers) {

        let response = {
            status: "Could not start round. Previous round still in progress.",
        };

        if (!this.activeRound && this.nextRoundStartTime === undefined) {

            let countDownTime = 1500; 
            if (numActivePlayers > 1) {
                countDownTime = 3000;
            }
            this.nextRoundStartTime = new Date().getTime() + countDownTime;

            setTimeout(() => {
                this.nextRoundStartTime = undefined;
                this.startNextRound();
            }, countDownTime);

            response = {
                status: "Next round countdown started.",
            };
            this.emitGameStateChange();
        }

        return response;
    }

    startNextRound() {
        this.nextRoundStartTime = undefined;
        this.currentRoundIndex++;

        let rightNow = new Date();
        let roundDuration = 20; // seconds
        let expireTime = new Date();
        expireTime.setSeconds(expireTime.getSeconds() + roundDuration);

        this.activeRound = {
            id: uuidv4(),
            startTime: rightNow.getTime(),
            expireTime: expireTime.getTime(), // round cannot end past this time
            endTime: undefined, // time when round actually ended
            prompt: this.generateTwoRandomIntegers(12),
            answers: {}, // {userId: { answerProvided, timeSubmitted}}            
        };

        this.activeRoundTimerId = setTimeout(() => {
            if (this.activeRound) {
                this.endRound();
            }
        }, roundDuration * 1000);

        this.emitGameStateChange();
    }

    getCurrentRoundAnswers() {
        let retVal = undefined;
        if (this.activeRound) {
            retVal = this.activeRound.answers;
        }
        return retVal;
    }

    getUserViewOfGameState() {
        return {
            currentRoundIndex: this.currentRoundIndex,
            activeRound: this.activeRound,
            nextRoundStartTime: this.nextRoundStartTime
        };
    }

    userAnswered(userId, answer) {

        if (this.activeRound) {

            this.activeRound.answers[userId] = {
                answerProvided: answer,
                timeSubmitted: new Date().getTime()
            };

            this.emitGameStateChange();
        }
    }

    getCorrectAnswerForActiveRound() {
        if (this.activeRound) {
            return this.activeRound.prompt[0] * this.activeRound.prompt[1];
        }
    }

    endRound() {
        if (this.activeRound) {
            if (this.activeRoundTimerId) {
                clearTimeout(this.activeRoundTimerId);
                this.activeRoundTimerId = undefined;
            }
            this.activeRound.endTime = new Date().getTime();
            this.pastRounds.push(this.activeRound);
            this.activeRound = undefined;
            this.emitGameStateChange();
        }
    }

    generateTwoRandomIntegers(max) {
        return [Math.floor(Math.random() * (max + 1)), Math.floor(Math.random() * (max + 1))];
    }
};

module.exports = GameStateFlashCardsMultiplication;
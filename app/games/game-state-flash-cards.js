const { v4: uuidv4 } = require('uuid');
const GameStateChangeEmitter = require('./game-state-change-emitter');

class GameStateFlashCards {

    constructor() {
        this.currentRoundIndex = 0;
        this.activeRound = undefined;
        this.activeRoundTimerId = undefined;
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
            prompt: this.generateTwoRandomIntegers(),
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

    endRound() {
        if (this.activeRound) {
            if (this.activeRoundTimerId) {
                clearTimeout(this.activeRoundTimerId);
                this.activeRoundTimerId = undefined;
            }
            this.activeRound.endTime = new Date().getTime();            
            this.activeRound = undefined; // TODO - eventually persist old round data somewhere?
            this.emitGameStateChange();
        }
    }

};

module.exports = GameStateFlashCards;
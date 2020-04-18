const { v4: uuidv4 } = require('uuid');
const GameStateChangeEmitter = require('./game-state-change-emitter');

class GameStateFlashCardsMultiplication {

    constructor() {
        this.currentRound = 0;
        this.hasGameStarted = false;
        this.activeRound = undefined;
        this.activeRoundTimerId = undefined;
        this.pastRounds = []; 
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
        
        let response = {
            status: "Could not start round. Previous round still in progress.",            
        };

        if (!this.activeRound) {

            this.currentRound++;

            let rightNow = new Date();
            let roundDuration = 10; // seconds
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

            response = {
                status: "Next Round Started.",            
            };
        }

        return response;
    }

    getCurrentRoundAnswers() {
        return this.activeRound.answers;
    }

    getUserViewOfGameState () {
        return {
            currentRound: this.currentRound,
            hasGameStarted: this.hasGameStarted,
            activeRound: this.activeRound,
            pastTenRounds: this.pastRounds.slice(-10)
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
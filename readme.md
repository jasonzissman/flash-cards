# JZ Flash Cards

**JZ Flash Cards** is a web-based mathematics game that lets you play multiplication flash cards against other opponents online in real time.

## How to Start a Game

1. Start a new game here: https://jz-multiplication.herokuapp.com/multiplication.html.
2. Enter your name and hit "join".
3. Click "Invite More Players" to generate a link to invite others to your game.
4. Click "Start Next Round" once everyone has joined.

## System Design

There are two primary components to this project:

1. A NodeJS server that holds a game's state and broadcasts state changes. 
2. A browser-based interface that renders the state and sends updates as users play the game.

The game's state includes things like which players have joined the game, the current score, and which flash cards are 'live' for the current round.

Websocket connections are leveraged to quickly communicate state changes between the players and the NodeJs server.

## Building and Running the Code

```bash
npm install
npm run start
## Game can now be loaded at http://localhost:3001/multiplication.html
```
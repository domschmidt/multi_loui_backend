var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var games = {};

/**
 * Creates a game
 */
var createGame = function(socket, jsonData) {
	console.log("create game with data: " + jsonData);
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		if (gameId !== undefined) {
			games[gameId] = {};
			console.log("created game with id: " + gameId);
			joinGame(socket, jsonData);
		}
	} else {
		console.log("tried to create game with insufficient data");
	}
}

/**
 * Adds a user to a game
 */
var joinGame = function(socket, jsonData) {
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		if (gameId !== undefined) {
			var game = games[gameId];
			if (game !== undefined) {
				if (game.players === undefined) {
					game.players = new Array();
				}
				game.players.push(socket.id);
				console.log("player " + socket.id + " joined " + gameId);
			}
		}
	} else {
		console.log("tried to join a game with insufficient data");
	}
}

/**
 * Send the token to the next user in the queue
 */
var pushTokenToNextPlayer = function(socket, game) {
	var currentIndex = game.playerIndex;
	if (currentIndex === undefined || currentIndex >= game.players.length -1) {
		currentIndex = 0;
	} else {
		currentIndex = currentIndex + 1;
	}
	var token = game.token;
	if (token === undefined) {
		token = {
				y: 300,
				r: 0
		};
	}
 	io.to(game.players[currentIndex]).emit('/game/play', token);
	game.playerIndex = currentIndex;
}

/**
 * Start a game
 */
var startGame = function(socket, jsonData) {
	console.log("start game: " + jsonData);
	updateGame(socket, jsonData);
}

/**
 * Push a new state
 */
var pushGameState = function(socket, jsonData) {
	console.log("push game state: " + jsonData);
	var gameId = jsonData.gameId;
	var updatedToken = jsonData.token;
	var game = games[gameId];
	game.token = updatedToken;
	updateGame(socket, jsonData);
}

/**
 * Updates the game state and sends the token to the next player (if game not finished yet)
 */
var updateGame = function(socket, jsonData) {
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		if (gameId !== undefined) {
			var game = games[gameId];
			if (game !== undefined) {
				pushTokenToNextPlayer(socket, game);
			} else {
				console.log("tried to operate on unexisting game");
			}
		}
	} else {
		console.log("tried to start game with insufficient data");
	}
}

io.on('connection', function(socket) {
	console.log("connection established");
	socket.on('\/game\/create', function(jsonData) {
		createGame(socket, jsonData);
	});
	socket.on('\/game\/join', function(jsonData) {
		joinGame(socket, jsonData);
	});
	socket.on('\/game\/state', function(jsonData) {
		pushGameState(socket, jsonData);
	});
	socket.on('\/game\/start', function(jsonData) {
		startGame(socket, jsonData);
	});
});

http.listen(1337, function() {
	console.log('Multi loui is listening on *:1337');
});

app.use(express.static('public'));

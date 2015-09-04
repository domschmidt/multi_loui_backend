var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var router = require('socket.io-events')();

/*
 * router.on('/game\/\d+\/create', function (sock, args, next) { var name =
 * args.shift(); var msg = args.shift(); console.log(name, msg); });
 * io.use(router);
 */

var middleware = require('socketio-wildcard')();

io.use(middleware);

var games = {};

var createGame = function(socket, jsonData) {
	console.log("create game with data: " + jsonData);
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		if (gameId !== undefined) {
			games[gameId] = {};
			console.log("created game with id: " + gameId);
		}
	} else {
		console.log("tried to create game with insufficient data");
	}
}

var joinGame = function(socket, jsonData) {
	console.log("join game with data: " + jsonData);
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		var playerId = jsonData.playerId;
		if (gameId !== undefined && playerId !== undefined) {
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
		console.log("tried to create game with insufficient data");
	}
}

var pushTokenToNextPlayer = function(socket, game) {
	var currentIndex = game.playerIndex;
	if (currentIndex === undefined || currentIndex >= game.players.length) {
		currentIndex = 0;
	} else {
		currentIndex = currentIndex + 1;
	}
	// socket.broadcast.to(game.players[currentIndex]).emit('/game/play',
	// "token");
	io.to(game.players[currentIndex]).emit('/game/play', 'for your eyes only');
	game.playerIndex = currentIndex;
}

var startGame = function(socket, jsonData) {
	console.log("start game with data: " + jsonData);
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		if (gameId !== undefined) {
			var game = games[gameId];
			if (game !== undefined) {
				pushTokenToNextPlayer(socket, game);
			} else {
				console.log("tried to start unexisting game");
			}
		}
	} else {
		console.log("tried to start game with insufficient data");
	}
}

var updateGameState = function(socket, jsonData) {
	console.log("state received with data: " + jsonData);
	if (jsonData !== undefined) {
		var gameId = jsonData.gameId;
		if (gameId !== undefined) {
			var game = games[gameId];
			if (game !== undefined) {
				pushTokenToNextPlayer(socket, game);
			} else {
				console.log("tried to start unexisting game");
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
		updateGameState(socket, jsonData);
	});
	socket.on('\/game\/start', function(jsonData) {
		startGame(socket, jsonData);
	});
});

io.listen(8000);

http.listen(1337, function() {
	console.log('Multi loui is listening on *:1337');
});
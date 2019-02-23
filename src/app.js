const {
	io
} = require('./server');

const enterParty = require('./enterParty');
const exitParty = require('./exitParty');
const startParty = require('./startParty');
const takeGuess = require('./takeGuess');

io.on('connection', (socket) => {
	socket.$gtp = {
		party: null,
		player: null
	};

	socket.on('joinParty', (message) => enterParty(socket, message));
	socket.on('createParty', (message) => enterParty(socket, message, false));
	socket.on('startParty', () => startParty(socket));
	socket.on('takeGuess', (message) => takeGuess(socket, message));

	socket.on('exitParty', async () => {
		await exitParty(socket);
		io.in(socket.$gtp.party.id).emit('exitParty');
		socket.$gtp = {
			party: null,
			player: null
		};
	});
	socket.on('error', (e) => {
		console.error('socket error, disconnecting', e);
		exitParty(socket);
	});
	socket.on('disconnect', () => exitParty(socket));
});
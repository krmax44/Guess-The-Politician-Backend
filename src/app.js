const server = require('http').createServer();
const io = require('socket.io')(server);
const axios = require('axios');
const uuid = require('uuid/v4');
const prettyObject = require('./util/prettyObject');
const Sequelize = require('sequelize');

const sequelize = new Sequelize('sqlite://db.sqlite');

const id = {
	type: Sequelize.UUID,
	defaultValue: () => uuid(),
	primaryKey: true,
	allowNull: false
};

const Party = sequelize.define('party', {
	id: {
		type: Sequelize.STRING,
		defaultValue: () => Math.random().toString(36).substr(2, 4).toUpperCase(),
		primaryKey: true,
		allowNull: false
	},
	started: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	}
});

const Player = sequelize.define('player', {
	id,
	name: Sequelize.STRING,
	points: {
		type: Sequelize.INTEGER,
		defaultValue: 0
	}
});

Player.belongsTo(Party, {
	foreignKey: 'partyid'
});

const Politician = sequelize.define('politician', {
	id,
	name: Sequelize.STRING
});

Politician.belongsTo(Party, {
	foreignKey: 'partyid'
});

const Fact = sequelize.define('fact', {
	id,
	type: Sequelize.ENUM('text', 'image', 'audio'),
	content: Sequelize.STRING,
	additionalText: {
		type: Sequelize.STRING,
		allowNull: true
	}
});

Fact.belongsTo(Politician, {
	foreignKey: 'politicianid'
});
Fact.belongsTo(Party, {
	foreignKey: 'partyid'
});

[Party, Player, Politician, Fact].forEach((model) => model.sync({
	force: true
}));

io.on('connection', (socket) => {
	console.log(socket);
	socket.$gtp = {
		party: null,
		player: null
	};

	socket.on('joinParty', (message) => enterParty(socket, message));
	socket.on('createParty', (message) => enterParty(socket, message, false));

	socket.on('exitParty', async () => {
		await exitParty(socket);
		socket.emit('exitParty');
		socket.$gtp = {
			party: null,
			player: null
		};
	});
	socket.on('error', (e) => {
		console.log('socket error, disconnecting', socket, e);
		exitParty(socket);
	});
	socket.on('disconnect', () => exitParty(socket));
});

const prepareParty = async (party) => {
	try {
		const request = await axios.get('https://query.wikidata.org/bigdata/namespace/wdq/sparql', {
			params: {
				format: 'json',
				query: `SELECT DISTINCT ?person ?signature ?positionsLabel ?partyLabel ?genderLabel ?dateofbirth ?children WHERE {
					?person wdt:P109 ?signature.
					?person wdt:P39 ?positions.
					?person wdt:P102 ?party.
					?person wdt:P21 ?gender .
					?person wdt:P569 ?dateofbirth .
					
					OPTIONAL { ?person wdt:P570 ?dod. }
					FILTER(!BOUND(?dod))
					
					?person wdt:P27 wd:Q183.
					
					SERVICE wikibase:label { bd:serviceParam wikibase:language "de, en". }
				}`
			}
		});

		console.log(request);
	} catch (e) {
		console.error('error when preparing party', e);
		exitParty()
	}
};

const enterParty = async (socket, message, createParty) => {
	try {
		if (!message.name) {
			return socket.emit('error', {
				message: 'Invalid username.'
			});
		}

		let party;
		if (createParty === false) {
			party = await Party.create();
		} else {
			party = await Party.findByPrimary(message.party);
		}

		const player = await Player.create({
			name: message.name,
			partyId: party.id
		});

		const players = await Player.findAll({
			where: {
				partyId: party.id
			}
		});

		socket.$gtp.party = {
			party,
			player
		};

		socket.join(party.id);

		dataUpdate(socket, party, player, players);
	} catch (e) {
		console.error('error when creating party', e);
	}
};

const exitParty = async (socket) => {
	const partyId = socket.$gtp.party;
	const playerId = socket.$gtp.player;

	try {
		if (partyId !== null) {
			const partyPlayers = await Player.count({
				where: {
					partyid: partyId
				}
			});

			if (partyPlayers <= 1) {
				Party.destroy({
					where: {
						id: partyId
					}
				});
			}
		}

		if (playerId !== null) {
			Player.destroy({
				where: {
					id: playerId
				}
			});
		}

		io.in(party.uuid).emit('exitParty');

		return true;
	} catch (e) {
		console.error('could not exit party', e);
	}
};

server.listen(3000, (e) => {
	console.log('listening', e);
});

const dataUpdate = (socket, party, player, players) => {
	if (!players) {
		players = await Player.findAll({
			where: {
				partyId: party.id
			}
		});
	}

	socket.emit('dataUpdate', {
		party: prettyObject(party.get({
			plain: true
		}), 'id', 'started'),
		player: prettyObject(player.get({
			plain: true
		}), 'id', 'name', 'points'),
		players: players.map((player) => prettyObject(player, 'id', 'name', 'points'))
	});
};
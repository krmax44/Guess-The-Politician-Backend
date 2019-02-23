const {
	io
} = require('./server');
const prettyObject = require('./util/prettyObject');
const {
	Party,
	Player
} = require('./db');

async function updateData({
	id
}, players) {
	if (!players) {
		players = await Player.findAll({
			where: {
				partyid: id
			}
		});
	}

	const party = await Party.findByPrimary(id);
	io.in(id).emit('updateData', {
		party: prettyObject(party.get({
			plain: true
		}), 'id', 'started'),
		players: players.map((player) => prettyObject(player.get({
			plain: true
		}), 'id', 'name', 'points'))
	});
}

module.exports = updateData;
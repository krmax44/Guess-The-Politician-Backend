const {
	Party,
	Player
} = require('./db.js');

const prettyObject = require('./util/prettyObject');
const prepareParty = require('./prepareParty');
const updateData = require('./updateData');

async function enterParty(socket, message, createParty) {
	try {
		if (!message.name) {
			return socket.emit('error', {
				message: 'Invalid username.'
			});
		}

		let party;
		if (createParty === false) {
			party = await Party.create();
			prepareParty(party);
		} else {
			party = await Party.findByPrimary(message.party);
		}

		const player = await Player.create({
			name: message.name,
			partyid: party.id
		});

		const players = await Player.findAll({
			where: {
				partyid: party.id
			}
		});

		socket.$gtp = {
			party,
			player
		};

		socket.join(party.id);
		socket.emit('playerUpdate', prettyObject(player.get({
			plain: true
		}), 'id', 'name'));

		updateData(party);
	} catch (e) {
		console.error('error when creating party', e);
	}
}

module.exports = enterParty;
const {
	io
} = require('./server');
const {
	Party,
	Player
} = require('./db.js');
const updateData = require('./updateData');
const updateScheduler = require('./updateScheduler');

async function exitParty(socket) {
	if (socket.$gtp.party === null) {
		return;
	}

	const partyId = socket.$gtp.party.id;
	const playerId = socket.$gtp.player.id;

	try {
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
			updateScheduler.unscheduleAllUpdates(socket.$gtp.party);
		}

		Player.destroy({
			where: {
				id: playerId
			}
		});

		updateData(party);

		return true;
	} catch (e) {
		console.error('could not exit party', e);
	}
}

module.exports = exitParty;
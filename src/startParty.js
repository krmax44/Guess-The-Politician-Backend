const updateData = require('./updateData');
const nextTick = require('./nextTick');
const {
	Party
} = require('./db');

async function startParty(socket) {
	const party = await Party.findByPrimary(socket.$gtp.party.id);
	await party.update({
		started: true
	});
	updateData(party);
	nextTick(party);
}

module.exports = startParty;
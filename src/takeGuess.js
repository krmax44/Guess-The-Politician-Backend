const {
	PartyPolitician,
	Politician
} = require('./db.js');
const {
	io
} = require('./server');
const {
	compareTwoStrings
} = require('string-similarity');
const updateScheduler = require('./updateScheduler');
const nextTick = require('./nextTick');
const updateData = require('./updateData');
const contentTypes = require('./contentTypes');

async function takeGuess(socket, message) {
	const party = socket.$gtp.party;
	const player = socket.$gtp.player;

	try {
		const partyPolitician = await PartyPolitician.find({
			where: {
				partyid: party.id,
				played: false
			}
		});
		const politician = await Politician.findByPrimary(partyPolitician.politicianid);

		if (compareTwoStrings(message.guess, politician.name) > 0.6 && partyPolitician.guessed === false) {
			updateScheduler.unscheduleAllUpdates(party);
			updateScheduler.scheduleUpdate(party, 'nextTick', () => {
				nextTick(party);
			}, 5000);

			player.points += 1;
			player.save();

			partyPolitician.guessed = true;
			partyPolitician.save();

			const currentFactIndex = contentTypes.indexOf(partyPolitician.currentfact);

			if (currentFactIndex < contentTypes.length - 1) {
				await partyPolitician.update({
					played: true
				});
			}

			io.in(party.id).emit('correctPolitician', {
				answer: politician.name,
				winner: player.name
			});

			socket.emit('inputRight');
			updateData(party);

		} else {
			socket.emit('inputWrong');
		}
	} catch (e) {
		console.error('error while validating input', e);
	}
}

module.exports = takeGuess;
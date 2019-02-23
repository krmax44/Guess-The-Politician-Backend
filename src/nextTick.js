const {
	Fact,
	Politician,
	PartyPolitician
} = require('./db.js');
const {
	io
} = require('./server');
const prettyObject = require('./util/prettyObject');
const contentTypes = require('./contentTypes');
const updateScheduler = require('./updateScheduler');

async function nextTick(party) {
	const room = io.in(party.id);

	const partyPolititian = await PartyPolitician.find({
		where: {
			partyid: party.id,
			played: false
		}
	});

	if (!partyPolititian) {
		room.emit('gameOver');
	} else {
		try {
			const polititian = await Politician.findByPrimary(partyPolititian.politicianid);
			const fact = await Fact.findOne({
				where: {
					politicianid: partyPolititian.politicianid,
					contenttype: partyPolititian.currentfact
				}
			});

			room.emit('nextTick', prettyObject(fact.get({
				plain: true
			}), 'mediatype', 'content', 'additionalcontent'));

			const currentFactIndex = contentTypes.indexOf(partyPolititian.currentfact);

			if (currentFactIndex < contentTypes.length - 1) {
				partyPolititian.update({
					currentfact: contentTypes[currentFactIndex + 1]
				});
				updateScheduler.scheduleUpdate(party, 'nextTick', () => nextTick(party), 10000);
			} else {
				updateScheduler.scheduleUpdate(party, 'showSolution', () => {
					partyPolititian.update({
						played: true
					});
					room.emit('correctPolitician', {
						answer: polititian.name,
						winner: null
					});
				}, 10000);
				updateScheduler.scheduleUpdate(party, 'nextTick', () => nextTick(party), 15000);
			}
		} catch (e) {
			console.error('error while ticking', e);
		}
	}
}

module.exports = nextTick;
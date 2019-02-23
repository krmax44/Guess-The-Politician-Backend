const {
	Politician,
	PartyPolitician
} = require('./db.js');
const Sequelize = require('sequelize');

async function prepareParty(party) {
	try {
		const politicians = await Politician.findAll({
			limit: 5,
			order: Sequelize.literal('random()')
		});

		await PartyPolitician.bulkCreate(
			politicians.map((politician) => ({
				politicianid: politician.id,
				partyid: party.id
			}))
		);
	} catch (e) {
		console.error('error while preparing party', e);
	}
}

module.exports = prepareParty;
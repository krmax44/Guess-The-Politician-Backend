const {
	Politician,
	Fact
} = require('./db.js');
const axios = require('axios');

async function politicianData() {
	try {
		const request = await axios.get('https://query.wikidata.org/bigdata/namespace/wdq/sparql', {
			params: {
				format: 'json',
				query: `SELECT DISTINCT ?personLabel ?dateofbirth ?gender ?partyLabel ?positionsLabel ?signature ?image WHERE {
					?person wdt:P569 ?dateofbirth.
					?person wdt:P21 ?gender.
					?person wdt:P102 ?party.
					?person wdt:P39 ?positions.
					?person wdt:P109 ?signature.
					?person wdt:P18 ?image
					OPTIONAL { ?person wdt:P570 ?dod. }
					?person wdt:P27 wd:Q183.
					SERVICE wikibase:label { bd:serviceParam wikibase:language "de, en". }
					FILTER(!BOUND(?dod))
				}`
			}
		});

		const dataset = request.data.results.bindings.map((item) => {
			for (key in item) {
				item[key] = item[key].value;
			}
			return item;
		});
		const facts = [];

		for (item of dataset) {
			const politician = await Politician.create({
				name: item.personLabel
			});

			const politicianid = politician.id;
			const dateofbirth = new Date(item.dateofbirth);

			facts.push({
				mediatype: 'text',
				contenttype: 'dateofbirth',
				content: `The person was born ${dateofbirth.getDate()}/${dateofbirth.getMonth() + 1}/${dateofbirth.getFullYear()}.`,
				politicianid
			}, {
				mediatype: 'text',
				contenttype: 'gender',
				content: `The person is ${item.gender.includes('Q6581072') ? 'female' : 'male'}.`,
				politicianid
			}, {
				mediatype: 'text',
				contenttype: 'party',
				content: `The person is a member of the ${item.partyLabel}.`,
				politicianid
			}, {
				mediatype: 'text',
				contenttype: 'position',
				content: `Currently, the person holds the position ${item.positionsLabel}.`,
				politicianid
			}, {
				mediatype: 'image',
				contenttype: 'signature',
				content: item.signature,
				additionalcontent: `This is the person's signature.`,
				politicianid
			}, {
				mediatype: 'image',
				contenttype: 'image',
				content: item.image,
				additionalcontent: 'This is how the person looks like.',
				politicianid
			});
		}

		await Fact.bulkCreate(facts);
	} catch (e) {
		console.error('error while fetching data', e);
		return false;
	}
}


module.exports = politicianData;
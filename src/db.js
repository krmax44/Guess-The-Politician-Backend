const uuid = require('uuid/v4');
const Sequelize = require('sequelize');
const sequelize = new Sequelize('sqlite://db.sqlite');

const id = {
	type: Sequelize.UUID,
	defaultValue: () => uuid(),
	primaryKey: true,
	allowNull: false
};

const contentTypes = require('./contentTypes');
const contenttype = Sequelize.ENUM(...contentTypes);

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

const Fact = sequelize.define('fact', {
	id,
	mediatype: Sequelize.ENUM('text', 'image'),
	contenttype,
	content: Sequelize.STRING,
	additionalcontent: {
		type: Sequelize.STRING,
		allowNull: true
	}
});

Fact.belongsTo(Politician, {
	foreignKey: 'politicianid'
});

const PartyPolitician = sequelize.define('partypolitician', {
	id,
	played: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	guessed: {
		type: Sequelize.BOOLEAN,
		defaultValue: false
	},
	currentfact: {
		type: contenttype,
		defaultValue: contentTypes[0]
	}
});

PartyPolitician.belongsTo(Party, {
	foreignKey: 'partyid'
});
PartyPolitician.belongsTo(Politician, {
	foreignKey: 'politicianid'
});

/*const PartyFact = sequelize.define('partyfacts', {
	id
});

PartyFact.belongsTo(Fact, {
	foreignKey: 'factid'
});
PartyFact.belongsTo(Party, {
	foreignKey: 'partyid'
});*/

[Party, Player, Politician, Fact, PartyPolitician].forEach((model) => model.sync({
	force: true
}));

module.exports = {
	Party,
	Player,
	Politician,
	Fact,
	PartyPolitician,
	//PartyFact,
	sequelize
};
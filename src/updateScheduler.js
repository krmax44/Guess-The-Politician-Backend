const queue = {};

function scheduleUpdate(party, identifier, fn, timeout) {
	if (!queue[party.id]) {
		queue[party.id] = {};
	}

	queue[party.id][identifier] = setTimeout(fn, timeout);
}

function unscheduleUpdate(party, identifier) {
	if (!queue[party.id]) {
		return;
	}

	clearInterval(queue[party.id][identifier]);
}

function unscheduleAllUpdates(party) {
	if (!queue[party.id]) {
		return;
	}

	for (identifier in queue[party.id]) {
		console.log('cleared ' + identifier);
		clearInterval(queue[party.id][identifier]);
	}
}

module.exports = {
	scheduleUpdate,
	unscheduleUpdate,
	unscheduleAllUpdates
};
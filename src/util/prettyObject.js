module.exports = (object, ...keys) => {
	let newObject = {};
	for (key in object) {
		if (keys.includes(key)) {
			newObject[key[0] === '_' ? key.replace('_', '') : key] = object[key];
		}
	}
	return newObject;
};
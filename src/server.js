const server = require('http').createServer();
const io = require('socket.io')(server);

const politicianData = require('./politicianData');

politicianData().then(() => {
	server.listen(process.env.PORT || 3000);
}).catch(() => {
	console.error('error while fetching wikidata');
	process.exit();
});

module.exports = {
	io,
	server
};
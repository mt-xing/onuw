import Socket from './socket.js';
import Connections from './ui/connections.js';
import disconnect from './ui/disconnect.js';
import Gameplay from './ui/gameplay.js';
import GameSetup from './ui/gameSetup.js';

const socket = new Socket('http://localhost:8080/onuw');

const gameDom = document.getElementById('game');
if (gameDom === null) {
	// eslint-disable-next-line no-alert
	alert('ERROR: No game dom');
	throw new Error();
}
const c = new Connections(socket, gameDom);
socket.on('setupStart', () => {
	c.end();
	Gameplay.remove();
	GameSetup.construct(socket, c.game, gameDom, (game) => {
		const g = new Gameplay(socket, game, gameDom);
	});
});
socket.on('disconn', () => {
	disconnect(gameDom);
});
socket.on('disconnect', () => {
	disconnect(gameDom);
});

import Socket from './socket.js';
import Connections from './ui/connections.js';
import GameSetup from './ui/gameSetup.js';

const socket = new Socket('http://localhost:8080/onuw');

const gameDom = document.getElementById('game');
if (gameDom === null) {
	alert('ERROR: No game dom');
	throw new Error();
}
const c = new Connections(socket, gameDom);
socket.on('setupStart', () => {
	const s = new GameSetup(socket, c.game, gameDom);
});

import Socket from './socket.js';

const socket = new Socket('http://localhost:8080/onuw');

// @ts-ignore
window.createRoom = () => {
	socket.send('create', { name: 'Michael' });
};

/**
 * @param {string} tag
 * @param {string | Object} msg
 */
// @ts-ignore
window.sendMsgDebug = (tag, msg) => {
	if (typeof msg !== 'string') {
		socket.send(tag, msg);
		return;
	}
	socket.emit(tag, msg);
};

socket.on('createYes', console.log);

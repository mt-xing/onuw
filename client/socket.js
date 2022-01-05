/* eslint-disable no-console */

export default class Socket {
	#socket;

	/**
	 * Construct a new socket.io connection
	 * @param {string} url
	 */
	constructor(url) {
		// @ts-ignore
		// eslint-disable-next-line no-undef
		this.#socket = io(url);
		this.#socket.on('connect', () => {
			console.debug(`Socket connected; id: ${this.#socket.id}`);
		});
		// @ts-ignore
		this.#socket.io.engine.on('packet', (packet) => {
			if (packet.type === 'message') {
				console.debug(packet);
			}
		});
	}

	/**
	 * Register a callback
	 * @param {string} type
	 * @param {(msg: string) => void} callback
	 */
	on(type, callback) {
		this.#socket.on(type, callback);
	}

	/**
	 * Send a message to the server
	 * @param {string} type
	 * @param {string} msg
	 */
	emit(type, msg) {
		console.debug(`Sending data type "${type}" message: ${msg}`);
		this.#socket.emit(type, msg);
	}

	/**
	 * @param {string} type
	 * @param {Object} msg
	 */
	send(type, msg) {
		this.emit(type, JSON.stringify(msg));
	}
}

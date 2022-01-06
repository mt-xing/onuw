import * as io from '../node_modules/socket.io/dist/index.js';
import { MAX_ROLES, Roles } from '../game/role.js';
import { CENTER_SIZE } from '../game/state.js';

export default class Broker {
	/**
	 * @type {string[]}
	 */
	#names;

	/**
	 * @type {Map<Roles, number>}
	 */
	#roles;

	/**
	 * @type {number}
	 */
	roleTime;

	/**
	 * @type {number}
	 */
	talkTime;

	/**
	 * @type {io.Socket[]}
	 */
	playerToSocket;

	/**
	 * @type {boolean}
	 */
	#acceptingPlayers;

	/**
	 * Create a helper to setup a new game
	 * @param {string} hostPlayerName
	 * @param {io.Socket} hostPlayerSocket
	 */
	constructor(hostPlayerName, hostPlayerSocket) {
		this.#names = [hostPlayerName];
		this.#roles = new Map();
		this.#acceptingPlayers = true;
		this.roleTime = 15;
		this.talkTime = 5 * 60;
		this.playerToSocket = [hostPlayerSocket];
	}

	/**
	 * Add a player to the game
	 * @param {string} name
	 * @param {io.Socket} socket
	 * @returns {number|'full'|'duplicate'|'done'} Whether joining was successful or not
	 */
	addPlayer(socket, name) {
		if (!this.#acceptingPlayers) {
			return 'done';
		}
		if (this.#names.length >= MAX_ROLES - CENTER_SIZE) {
			return 'full';
		}
		if (this.#names.some((x) => x === name)) {
			return 'duplicate';
		}
		this.#names.push(name);
		this.playerToSocket.push(socket);
		return this.#names.length - 1;
	}

	get players() {
		return this.#names;
	}

	/** @param {Roles} role */
	addRole(role) {
		const r = this.#roles.get(role);
		if (r === undefined) {
			this.#roles.set(role, 1);
		} else {
			this.#roles.set(role, r + 1);
		}
	}

	/** @param {Roles} role */
	removeRole(role) {
		const r = this.#roles.get(role);
		if (r === undefined) { return; }
		if (r - 1 <= 0) {
			this.#roles.delete(role);
		} else {
			this.#roles.set(role, r - 1);
		}
	}

	get numRoles() {
		let i = 0;
		this.#roles.forEach((v) => { i += v; });
		return i;
	}

	get roleArr() {
		/** @type {Roles[]} */
		const i = [];
		this.#roles.forEach((v, role) => {
			let r = v;
			while (r > 0) {
				i.push(role);
				r--;
			}
		});
		return i;
	}

	startSetup() {
		this.#acceptingPlayers = false;
	}
}

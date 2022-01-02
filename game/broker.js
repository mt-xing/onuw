import * as io from '../node_modules/socket.io/dist/index';
import { MAX_ROLES, Roles } from './role';
import { CENTER_SIZE } from './state';

export default class Broker {
	/**
	 * @type {string[]}
	 */
	#names;

	/**
	 * @type {Set<Roles>}
	 */
	roles;

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
		this.roles = new Set();
		this.#acceptingPlayers = true;
		this.roleTime = 15;
		this.talkTime = 5 * 60;
		this.playerToSocket = [hostPlayerSocket];
	}

	/**
	 * Add a player to the game
	 * @param {string} name
	 * @returns {number|'full'|'duplicate'|'done'} Whether joining was successful or not
	 */
	addPlayer(name) {
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
		return this.#names.length - 1;
	}

	get players() {
		return this.#names;
	}

	startSetup() {
		this.#acceptingPlayers = false;
	}
}

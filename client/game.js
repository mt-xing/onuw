import { DoubleRoles, Roles } from '../game/role.js';

export default class OnuwGame {
	/** @type {number} */
	playerID;

	/**
	 * @type {string[]}
	 */
	#players;

	/**
	 * @type {Set<Roles>}
	 */
	#roles;

	/**
	 * @type {number}
	 */
	#numRoles;

	constructor() {
		this.playerID = NaN;
		this.#players = [];
		this.#roles = new Set();
		this.#numRoles = 0;
	}

	reset() {
		this.playerID = NaN;
		this.#players = [];
		this.#roles = new Set();
		this.#numRoles = 0;
	}

	get isHost() {
		return this.playerID === 0;
	}

	/**
	 * @param {number} id
	 * @param {string} name
	 */
	addPlayer(id, name) {
		this.#players[id] = name;
	}

	/**
	 * @param {Roles} roleID
	 * @returns {[boolean, number]} Was added; number of total roles now
	 */
	toggleRole(roleID) {
		const roleQuantity = DoubleRoles.has(roleID) ? 2 : 1;
		const isIn = this.#roles.has(roleID);
		if (isIn) {
			this.#numRoles -= roleQuantity;
			this.#roles.delete(roleID);
		} else {
			this.#numRoles += roleQuantity;
			this.#roles.add(roleID);
		}

		return [!isIn, this.#numRoles];
	}
}

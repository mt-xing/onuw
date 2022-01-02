import Role from './role.js';
import Player from './player.js';
import { shuffle } from './utils.js';

export const CENTER_SIZE = 3;

/**
 * State of the game
 */
export default class State {
	/**
	 * @type {Role[]}
	 */
	#centerRoles;

	/**
	 * @type {Player[]}
	 */
	#players;

	/**
	 * @param {Role[]} roles
	 * @param {string[]} names
	 */
	constructor(roles, names) {
		if (roles.length !== names.length + CENTER_SIZE) {
			throw new Error('Invalid number of roles selected');
		}
		const r = shuffle(roles);
		this.#centerRoles = r.slice(0, CENTER_SIZE);

		const playerRoles = r.slice(CENTER_SIZE);
		const playerNames = names.slice();
		this.#players = playerNames.map((name, i) => new Player(name, playerRoles[i]));
	}

	/**
	 * Swap the roles of two players
	 * @param {number} a
	 * @param {number} b
	 */
	swap(a, b) {
		const t = this.#players[a].currentRole;
		this.#players[a].currentRole = this.#players[b].currentRole;
		this.#players[b].currentRole = t;
	}

	/**
	 * Swap the role of a player with the center
	 * @param {number} player
	 * @param {number} center Center ID, [0, 2]
	 */
	swapCenter(player, center) {
		const t = this.#players[player].currentRole;
		this.#players[player].currentRole = this.#centerRoles[center];
		this.#centerRoles[center] = t;
	}

	get numPlayers() {
		return this.#players.length;
	}

	/**
	 * Get a particular player role
	 * @param {number} id Player ID
	 * @returns {Player}
	 */
	getPlayer(id) {
		return this.#players[id];
	}

	/**
	 * @param {number} id
	 * @returns {Role}
	 */
	getCenter(id) {
		return this.#centerRoles[id];
	}

	/**
	 * @param {number} id
	 * @returns {string}
	 */
	getName(id) {
		return this.#players[id].name;
	}
}

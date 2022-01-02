import Role from './role.js';

export default class Player {
	/**
	 * Role this player started the game with
	 * @type {Role}
	 */
	startingRole;

	/**
	 * Role this player currently has
	 * @type {Role}
	 */
	currentRole;

	/**
	 * Name of the player
	 * @type {string}
	 */
	name;

	/**
	 * Create a new player
	 * @param {string} name Name of the player (ideally unique)
	 * @param {Role} role Role the player starts with
	 */
	constructor(name, role) {
		this.startingRole = role;
		this.currentRole = role;
		this.name = name;
	}
}

import { DEFAULT_ROLE_TIME, DEFAULT_TALK_TIME } from '../game/constants.js';
import { Roles } from '../game/role.js';

export default class OnuwGame {
	/** @type {number} */
	playerID;

	/** @type {Roles | undefined} */
	#playerStartRole;

	/**
	 * @type {string[]}
	 */
	#players;

	/**
	 * @type {Map<Roles, number>}
	 */
	#roles;

	/**
	 * @type {number}
	 */
	#numRoles;

	/**
	 * Seconds
	 * @type {number}
	 */
	roleTime;

	/**
	 * Seconds
	 * @type {number}
	 */
	talkTime;

	constructor() {
		this.playerID = NaN;
		this.#players = [];
		this.#roles = new Map();
		this.#numRoles = 0;
		this.roleTime = DEFAULT_ROLE_TIME;
		this.talkTime = DEFAULT_TALK_TIME * 60;
	}

	reset() {
		this.playerID = NaN;
		this.#players = [];
		this.#roles = new Map();
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
	 */
	addRole(roleID) {
		const t = this.#roles.get(roleID);
		this.#numRoles++;
		if (t === undefined) {
			this.#roles.set(roleID, 1);
		} else {
			this.#roles.set(roleID, t + 1);
		}
	}

	/**
	 * @param {Roles} roleID
	 */
	removeRole(roleID) {
		const t = this.#roles.get(roleID);
		if (t === undefined) {
			return;
		} else {
			this.#numRoles--;
			if (t <= 1) {
				this.#roles.delete(roleID);
				return;
			}
			this.#roles.set(roleID, t - 1);
		}
	}

	/**
	 * Number of a particular role in play
	 * @param {Roles} roleID
	 * @returns {number}
	 */
	numRole(roleID) {
		const d = this.#roles.get(roleID);
		if (d === undefined) { return 0; }
		return d;
	}

	get numRoles() {
		return this.#numRoles;
	}

	get numPlayers() {
		return this.#players.length;
	}

	/**
	 * @param {Roles[]} roles
	 * @param {number} roleTime
	 * @param {number} talkTime
	 * @param {string[]} names
	 */
	confirmData(roles, roleTime, talkTime, names) {
		this.roleTime = roleTime;
		this.talkTime = talkTime;
		this.#players = names;

		this.#roles.clear();
		this.#numRoles = 0;
		roles.forEach(this.addRole.bind(this));
	}

	get startingRole() {
		if (this.#playerStartRole === undefined) {
			throw new Error('No role assigned yet');
		}
		return this.#playerStartRole;
	}

	set startingRole(role) {
		this.#playerStartRole = role;
	}

	/**
	 * @param {number} pid
	 * @returns {string}
	 */
	getPlayerName(pid) {
		return this.#players[pid];
	}
}

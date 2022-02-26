import State from './state.js';
import { toTitleCase } from './utils.js';
import WakeOrder from './wake.js';

export default class Role {
	/**
	 * The numeric role, from enum `Roles`
	 * @type {Roles}
	 */
	role;

	/**
	 * Role description
	 * @type {string}
	 */
	description;

	/**
	 * Role instructions for during the game
	 * @type {string}
	 */
	instructions;

	/**
	 * Wake order.
	 *
	 * If this is `null`, this role does not wake.
	 * @type {(typeof WakeOrder)[]|null}
	 */
	wakeOrder;

	/**
	 * Any modifiers applied, if any
	 *
	 * @type {Set<Modifiers>}
	 */
	modifiers;

	/**
	 * Create a new role object
	 * @param {Roles} role
	 * @param {string} description
	 * @param {string} instructions
	 * @param {(typeof WakeOrder)[]|null} wakeOrder
	 */
	constructor(role, description, instructions, wakeOrder) {
		if (this.constructor === Role) {
			throw new Error('Role is an abstract class');
		}
		this.role = role;
		this.description = description;
		this.instructions = instructions;
		this.wakeOrder = wakeOrder;
		this.modifiers = new Set();
	}

	/**
	 * The team that this role WINS with.
	 *
	 * eg: A minion wins with the werewolves
	 * @returns {Teams}
	 */
	get winTeam() {
		return /** @type {Teams} */(Math.floor(this.role / TEAM_MULT));
	}

	/**
	 * The team that loses if this role is KILLED.
	 *
	 * eg: A minion counts as a villager
	 * @returns {Teams}
	 */
	get killTeam() {
		if (this.role === Roles.MINION) {
			return Teams.VILLAGER;
		}
		return /** @type {Teams} */(Math.floor(this.role / TEAM_MULT));
	}

	get roleName() {
		return roleToName[this.role];
	}

	/**
	 * @param {number|Role} other
	 * @returns {boolean} True if and only if this is the same role as `other`
	 */
	equals(other) {
		if (typeof other === 'number') {
			return this.role === other;
		}
		return this.role === other.role;
	}

	/**
	 * @param {number|Role} first
	 * @param {number|Role} second
	 * @returns {boolean} True if and only if `first` is the same role as `second`
	 */
	static equals(first, second) {
		if (typeof first === 'number' && typeof second === 'number') {
			return first === second;
		} if (typeof first === 'number' && typeof second !== 'number') {
			return second.equals(first);
		} if (typeof first !== 'number') {
			return first.equals(second);
		}
		throw new Error();
	}

	/**
	 * Comparator method for wake orders, after null has been filtered
	 * @param {number[]} a
	 * @param {number[]} b
	 * @returns {number}
	 */
	static sortWakeOrder(a, b) {
		if (a.length === 0) {
			if (b.length === 0) {
				return 0;
			}
			return b[0];
		}
		if (b.length === 0) {
			return a[0];
		}
		// Both are non-zero length
		const aIsShorter = a.length < b.length;
		const shorterLength = aIsShorter ? a.length : b.length;
		for (let i = 0; i < shorterLength; i++) {
			if (a[i] !== b[i]) {
				return a[i] - b[i];
			}
		}
		if (a.length === b.length) {
			return 0;
		}
		return aIsShorter ? a[shorterLength] : b[shorterLength];
	}
}

/**
 * Teams that win or lose
 * @readonly
 * @enum {(typeof Teams)[keyof typeof Teams]}
 */
export const Teams = Object.freeze({
	VILLAGER: /** @type {const} */(0),
	WEREWOLF: /** @type {const} */(1),
	TANNER: /** @type {const} */(2),
});

const TEAM_MULT = /** @type {const} */(100);

/**
 * List of all possible roles
 * @readonly
 * @enum {(typeof Roles)[keyof typeof Roles]}
 */
export const Roles = Object.freeze({
	// Werewolves
	WEREWOLF: /** @type {100} */(Teams.WEREWOLF * TEAM_MULT + 0),
	MYSTIC_WOLF: /** @type {101} */(Teams.WEREWOLF * TEAM_MULT + 1),
	DREAM_WOLF: /** @type {102} */(Teams.WEREWOLF * TEAM_MULT + 2),
	MINION: /** @type {105} */(Teams.WEREWOLF * TEAM_MULT + 5), // Special

	// Villagers
	SENTINEL: /** @type {0} */(Teams.VILLAGER * TEAM_MULT + 0),
	MASON: /** @type {1} */(Teams.VILLAGER * TEAM_MULT + 1),
	SEER: /** @type {2} */(Teams.VILLAGER * TEAM_MULT + 2),
	APPRENTICE_SEER: /** @type {3} */(Teams.VILLAGER * TEAM_MULT + 3),
	PARANORMAL_INVESTIGATOR: /** @type {4} */(Teams.VILLAGER * TEAM_MULT + 4),
	ROBBER: /** @type {5} */(Teams.VILLAGER * TEAM_MULT + 5),
	WITCH: /** @type {6} */(Teams.VILLAGER * TEAM_MULT + 6),
	TROUBLEMAKER: /** @type {7} */(Teams.VILLAGER * TEAM_MULT + 7),
	VILLAGE_IDIOT: /** @type {8} */(Teams.VILLAGER * TEAM_MULT + 8),
	DRUNK: /** @type {9} */(Teams.VILLAGER * TEAM_MULT + 9),
	INSOMNIAC: /** @type {10} */(Teams.VILLAGER * TEAM_MULT + 10),
	REVEALER: /** @type {11} */(Teams.VILLAGER * TEAM_MULT + 11),
	HUNTER: /** @type {12} */(Teams.VILLAGER * TEAM_MULT + 12),
	VILLAGER: /** @type {99} */(Teams.VILLAGER * TEAM_MULT + 99),

	// lol
	TANNER: /** @type {200} */(Teams.TANNER * TEAM_MULT),
});

/**
 * @type {Partial<Record<Roles,
 * 	{type: 'up to', number: number} | {type: 'all', number: number}
 * >>}
 */
export const MultiRoles = {
	[Roles.WEREWOLF]: { type: 'up to', number: 2 },
	[Roles.MASON]: { type: 'all', number: 2 },
	[Roles.VILLAGER]: { type: 'up to', number: 3 },
};

export const MAX_ROLES = Object.keys(Roles).length
	+ Object.keys(MultiRoles).map((x) => parseInt(x, 10)).map(
		(x) => (MultiRoles[/** @type {Roles} */(x)]?.number ?? 0),
	).reduce((a, x) => a + x - 1, 0);

/**
 * Lookup from role id to name of role
 * @type {Readonly<Record<Roles, string>>}
 */
export const roleToName = (() => {
	/** @type {Partial<Record<Roles, string>>} */
	const t = {};
	/** @type {(keyof typeof Roles)[]} */(Object.keys(Roles))
		.forEach((key) => { t[Roles[key]] = toTitleCase(key.replace('_', ' ')); });
	return Object.freeze(/** @type {Record<Roles, string>} */(t));
})();

/**
 * List of all modifiers a player can take on
 * @readonly
 * @enum {(typeof Modifiers)[keyof typeof Modifiers]}
 */
export const Modifiers = Object.freeze({
	SENTINEL: /** @type {const} */(0),
	REVEALER: /** @type {const} */(1),
});

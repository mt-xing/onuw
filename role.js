import State from './state';

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
     * Lower goes first, starting from front, lexicographic order.
	 *
	 * If this is `null`, this role does not wake.
     * @type {number[]|null}
     */
	wakeOrder;

	/**
	 * Any modifiers applied, if any
	 *
	 * @type {Set<Modifiers>}
	 */
	modifier;

	/**
     * Create a new role object
     * @param {Roles} role
     * @param {string} description
     * @param {string} instructions
     * @param {number[]|null} wakeOrder
     */
	constructor(role, description, instructions, wakeOrder) {
		if (this.constructor === Role) {
			throw new Error('Role is an abstract class');
		}
		this.role = role;
		this.description = description;
		this.instructions = instructions;
		this.wakeOrder = wakeOrder;
		this.modifier = new Set();
	}

	// #region Abstract methods

	/**
     * @param {(num: number, allowSelf: boolean) => Promise<number[]>} pickPlayers
	 * Number of players and whether self selection is allowed to ids
     * @param {(num: number) => Promise<number[]>} pickCenters Number of cards to pick to ids
     * @param {(choices: string[]) => Promise<number>} pickChoice Array of choices to id of choice
     * @param {(msg: string) => void} giveInfo Show information to the player
     * @param {State} state Reference to the current game state
     * @param {number} id Current player ID
     */
	async act(pickPlayers, pickCenters, pickChoice, giveInfo, state, id) {
		throw new Error('Unimplemented');
	}

	// #endregion

	/**
     * The team that this role WINS with.
     *
     * eg: A minion wins with the werewolves
     * @returns {Teams}
     */
	get winTeam() {
		return Math.floor(this.role / TEAM_MULT);
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
		return Math.floor(this.role / TEAM_MULT);
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
}

/**
 * Teams that win or lose
 * @readonly
 * @enum {number}
 */
export const Teams = {
	VILLAGER: 0,
	WEREWOLF: 1,
	TANNER: 2,
};

const TEAM_MULT = 100;

/**
 * List of all possible roles
 * @readonly
 * @enum {number}
 */
export const Roles = {
	// Werewolves
	WEREWOLF: Teams.WEREWOLF * TEAM_MULT + 0,
	MYSTIC_WOLF: Teams.WEREWOLF * TEAM_MULT + 1,
	DREAM_WOLF: Teams.WEREWOLF * TEAM_MULT + 2,
	MINION: Teams.WEREWOLF * TEAM_MULT + 5, // Special

	// Villagers
	SENTINEL: Teams.VILLAGER * TEAM_MULT + 0,
	MASON: Teams.VILLAGER * TEAM_MULT + 1,
	SEER: Teams.VILLAGER * TEAM_MULT + 2,
	APPRENTICE_SEER: Teams.VILLAGER * TEAM_MULT + 3,
	ROBBER: Teams.VILLAGER * TEAM_MULT + 4,
	WITCH: Teams.VILLAGER * TEAM_MULT + 5,
	TROUBLEMAKER: Teams.VILLAGER * TEAM_MULT + 6,
	DRUNK: Teams.VILLAGER * TEAM_MULT + 7,
	INSOMNIAC: Teams.VILLAGER * TEAM_MULT + 8,
	REVEALER: Teams.VILLAGER * TEAM_MULT + 9,

	// lol
	TANNER: Teams.TANNER * TEAM_MULT,
};

/**
 * List of all modifiers a player can take on
 * @readonly
 * @enum {number}
 */
export const Modifiers = {
	SENTINEL: 0,
	REVEALER: 1,
};

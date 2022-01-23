import State from './state.js';

export default class WakeOrder {
	/** @type {string} */
	#name;

	/**
	 * Wake order.
	 *
	 * Lower goes first, starting from front, lexicographic order.
     *
     * @type {number[]}
     */
	wakeOrder;

	/**
	 * Create a new wake order object.
     *
     * Do NOT call this constructor unless you are inside the game class.
     * It makes life easier to pass around the constructor itself as an argument
     * until the night phase and to only construct each wake order once.
     *
	 * @param {number[]} [wakeOrder]
     * @param {string} [name]
	 */
	constructor(wakeOrder, name) {
		if (this.constructor === WakeOrder) {
			throw new Error('Role is an abstract class');
		}
		if (wakeOrder === undefined || name === undefined) {
			throw new Error('Wake order requires an actual wake order lmao');
		}
		this.wakeOrder = wakeOrder;
		this.#name = name;
	}

	get displayName() {
		return this.#name;
	}

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

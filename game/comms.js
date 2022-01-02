import * as io from '../node_modules/socket.io/dist/index';

/**
 * @typedef {{
 * 	nonce: number,
 * 	resolve: (choices: number[]) => void,
 * 	valid: Set<number>,
 * 	num: number
 * } | {
 * 	nonce: number,
 * 	resolve: (choice: number) => void,
 * 	valid: Set<number>,
 * 	num: null
 * }} PendingResponse
 */

export default class Communicator {
	/**
	 * @type {io.Socket[]}
	 */
	#playerToSocket;

	/**
	 * @type {PendingResponse | null}
	 */
	#pendingResponse;

	/**
	 * @param {io.Socket[]} playerToSocket
	 */
	constructor(playerToSocket) {
		this.#playerToSocket = playerToSocket;
		this.#pendingResponse = null;
	}

	/**
	 * Wake up a player
	 * @param {number} pid Player ID
	 */
	wake(pid) { }

	/**
	 * Send message to a player
	 * @param {number} pid Player ID
	 * @param {string} msg Message
	 */
	message(pid, msg) { }

	/**
	 * Ask player to pick center cards
	 * @param {number} pid
	 * @param {number} timeout
	 * @param {number} num
	 * @returns {Promise<number[]>}
	 */
	pickCenters(pid, timeout, num) {
		throw new Error('TODO');
	}

	/**
	 * Ask player to pick other players
	 * @param {number} pid
	 * @param {number} timeout
	 * @param {number} num
	 * @param {Record<number, string>} banned
	 * @returns {Promise<number[]>}
	 */
	pickPlayers(pid, timeout, num, banned) {
		throw new Error('TODO');
	}

	/**
	 * Ask player to pick a choice
	 * @param {number} pid
	 * @param {number} timeout
	 * @param {string[]} choices
	 * @returns {Promise<number>}
	 */
	pickChoices(pid, timeout, choices) {
		return new Promise((resolve) => {
			/** @type {PendingResponse} */
			this.#pendingResponse = {
				nonce: Math.floor(Math.random() * Number.MAX_SAFE_INTEGER),
				valid: new Set(choices.map((_, i) => i)),
				num: null,
				resolve,
			};
		});
	}

	/**
	 * Make a player sleep
	 * @param {number} pid Player ID
	 */
	sleep(pid) { }

	/**
	 * Send a message to a particular player
	 * @param {number} pid Player ID
	 * @param {string} tag Tag of the message
	 * @param {string} msg Message content
	 */
	sendToPlayer(pid, tag, msg) {
		this.#playerToSocket[pid].emit(tag, msg);
	}

	/**
	 * Process the response from a player when they have finished picking a selection.
	 * Will silently drop invalid responses.
	 * @param {number} nonce Unique identifier for a selection
	 * @param {number[]} selection The player's choice (indices)
	 */
	processPlayerResponse(nonce, selection) {
		if (this.#pendingResponse === null) {
			return;
		}
		const pend = this.#pendingResponse;
		if (pend.nonce !== nonce) {
			return;
		}
		if (selection.length !== (pend.num === null ? 1 : pend.num)) {
			return;
		}
		if (selection.some((x) => !pend.valid.has(x))) {
			return;
		}
		// All valid
		this.#pendingResponse = null;
		if (pend.num === null) {
			pend.resolve(selection[0]);
		} else {
			pend.resolve(selection);
		}
	}
}

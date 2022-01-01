export default class Communicator {
	static routeSocket() {
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
		throw new Error('TODO');
	}

	/**
	 * Make a player sleep
	 * @param {number} pid Player ID
	 */
	sleep(pid) { }
}

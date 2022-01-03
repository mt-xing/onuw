import * as io from '../node_modules/socket.io/dist/index.js';
import { Roles, Teams } from '../game/role.js';
import { CENTER_SIZE } from '../game/state.js';

/**
 * @typedef {{
 * 	nonce: number,
 * 	valid: Set<number>,
 * 	num: number,
 * 	resolve: (choices: number[]) => void,
 * 	timeout: NodeJS.Timeout
 * } | {
 * 	nonce: number,
 * 	valid: Set<number>,
 * 	num: null,
 * 	resolve: (choice: number) => void,
 * 	timeout: NodeJS.Timeout
 * }} PendingResponse
 */

export default class Communicator {
	/**
	 * @type {io.Socket[]}
	 */
	playerToSocket;

	/**
	 * @type {Map<io.Socket, number>}
	 */
	socketToPlayer;

	/**
	 * @type {PendingResponse | null}
	 */
	#pendingResponse;

	/**
	 * @type {((pid: number) => void) | null}
	 */
	#pendingVoteReady;

	/**
	 * @type {((pid: number, voteTarget: number) => void) | null}
	 */
	#pendingVote;

	/**
	 * @type {(tag: string, msg: string) => void}
	 */
	#broadcast;

	/**
	 * @param {io.Socket[]} playerToSocket
	 * @param {(tag: string, msg: string) => void} broadcast
	 */
	constructor(playerToSocket, broadcast) {
		this.playerToSocket = playerToSocket;
		this.#pendingResponse = null;
		this.#pendingVoteReady = null;
		this.#pendingVote = null;
		this.#broadcast = broadcast;
		this.socketToPlayer = new Map();
		playerToSocket.forEach((socket, id) => this.socketToPlayer.set(socket, id));
	}

	/**
	 * Wake up a player
	 * @param {number} pid Player ID
	 * @param {Roles} role Player Role
	 */
	wake(pid, role) {
		this.sendToPlayer(pid, 'wake', '');
		this.#broadcast('roleStart', JSON.stringify({ role }));
	}

	/**
	 * Send message to a player
	 * @param {number} pid Player ID
	 * @param {string} msg Message
	 */
	message(pid, msg) {
		this.sendToPlayer(pid, 'msg', msg);
	}

	/**
	 * Ask player to pick center cards
	 * @param {number} pid
	 * @param {number} timeout
	 * @param {number} num
	 * @returns {Promise<number[]>}
	 */
	pickCenters(pid, timeout, num) {
		if (timeout <= 0) {
			return Promise.resolve([]);
		}
		const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		this.sendToPlayer(pid, 'pickCenters', JSON.stringify({
			nonce, num,
		}));
		const timeoutObj = setTimeout(this.timeoutPlayerResponse.bind(this, pid, nonce), timeout);
		return new Promise((resolve) => {
			/** @type {PendingResponse} */
			this.#pendingResponse = {
				nonce,
				valid: new Set(Array(CENTER_SIZE).keys()),
				num,
				resolve,
				timeout: timeoutObj,
			};
		});
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
		if (timeout <= 0) {
			return Promise.resolve([]);
		}
		const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		this.sendToPlayer(pid, 'pickPlayers', JSON.stringify({
			nonce, num, banned,
		}));
		const timeoutObj = setTimeout(this.timeoutPlayerResponse.bind(this, pid, nonce), timeout);

		const valid = new Set(Array(this.playerToSocket.length).keys());
		Object.keys(banned).forEach((bannedID) => {
			valid.delete(parseInt(bannedID, 10));
		});

		return new Promise((resolve) => {
			/** @type {PendingResponse} */
			this.#pendingResponse = {
				nonce,
				valid,
				num,
				resolve,
				timeout: timeoutObj,
			};
		});
	}

	/**
	 * Ask player to pick a choice
	 * @param {number} pid
	 * @param {number} timeout
	 * @param {string[]} choices
	 * @returns {Promise<number>}
	 */
	pickChoices(pid, timeout, choices) {
		if (timeout <= 0) {
			return Promise.resolve(NaN);
		}
		const nonce = Math.floor(Math.random() * Number.MAX_SAFE_INTEGER);
		this.sendToPlayer(pid, 'pickChoices', JSON.stringify({
			nonce, choices,
		}));
		const timeoutObj = setTimeout(this.timeoutPlayerResponse.bind(this, pid, nonce), timeout);
		return new Promise((resolve) => {
			/** @type {PendingResponse} */
			this.#pendingResponse = {
				nonce,
				valid: new Set(choices.map((_, i) => i)),
				num: null,
				resolve,
				timeout: timeoutObj,
			};
		});
	}

	/**
	 * Make a player sleep
	 * @param {number} pid Player ID
	 */
	sleep(pid) {
		this.sendToPlayer(pid, 'sleep', '');
	}

	/**
	 * Alert players that day has begun
	 * @param {Record<number, string>} boardInfo Mapping from player id to descriptors
	 */
	transitionToDay(boardInfo) {
		this.#broadcast('day', JSON.stringify(boardInfo));
	}

	/**
	 * @returns {AsyncGenerator<number, void, void>}
	 * Async generator that yields the player ID that is ready to vote
	 */
	async* waitForPlayersReadyToVote() {
		while (true) {
			try {
				yield await new Promise((resolve) => {
					this.#pendingVoteReady = resolve;
				});
			} catch (_) {
				break;
			}
		}
	}

	/**
	 * Broadcast to all that a player is ready to vote
	 * @param {number} id
	 */
	playerReadyToVote(id) {
		this.#broadcast('voteReady', JSON.stringify({ id }));
	}

	/**
	 * Periodic time sync during day phase
	 * @param {number} timeLeft Milliseconds left
	 */
	timeUpdate(timeLeft) {
		this.#broadcast('time', JSON.stringify({ time: timeLeft / 1000 }));
	}

	/**
	 * @returns {AsyncGenerator<[number, number], never, void>}
	 * Async generator that yields a tuple of player ID that voted and player ID they voted for
	 */
	async* startTheVote() {
		this.#pendingVoteReady = null;
		this.#broadcast('voteStart', '');
		while (true) {
			yield await new Promise((resolve) => {
				this.#pendingVote = (a, b) => resolve([a, b]);
			});
		}
	}

	/**
	 * @param {number} playerID Player ID that sent the vote
	 */
	voteReceived(playerID) {
		this.#broadcast('voteReceived', JSON.stringify({ playerID }));
	}

	/**
	 *
	 * @param {number[]} votes Player ID each player voted for
	 * @param {Roles[]} playerRoles
	 * @param {Teams[]} winTeam
	 */
	sendResults(votes, playerRoles, winTeam) {
		this.#broadcast('result', JSON.stringify({
			votes, playerRoles, winTeam,
		}));
	}

	/**
	 * Send a message to a particular player
	 * @param {number} pid Player ID
	 * @param {string} tag Tag of the message
	 * @param {string} msg Message content
	 */
	sendToPlayer(pid, tag, msg) {
		this.playerToSocket[pid].emit(tag, msg);
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
		clearTimeout(pend.timeout);
		if (pend.num === null) {
			pend.resolve(selection[0]);
		} else {
			pend.resolve(selection);
		}
	}

	/**
	 * Handle a vote submitted by a player.
	 *
	 * Will silently drop if not expecting a vote.
	 * @param {number} pid Player ID voting
	 */
	processPlayerVoteReady(pid) {
		if (Number.isNaN(pid)) { return; }
		if (this.#pendingVoteReady === null) { return; }
		this.#pendingVoteReady(pid);
	}

	/**
	 * Handle a vote submitted by a player.
	 *
	 * Will silently drop if not expecting a vote.
	 * @param {number} pid Player ID voting
	 * @param {number} selection Player ID of who they voted for
	 */
	processPlayerVote(pid, selection) {
		if (Number.isNaN(pid)) { return; }
		if (this.#pendingVote === null) { return; }
		this.#pendingVote(pid, selection);
	}

	/**
	 * Timeout a request.
	 *
	 * Silently ignores if request nonce is not valid.
	 * @param {number} pid
	 * @param {number} nonce
	 */
	timeoutPlayerResponse(pid, nonce) {
		if (this.#pendingResponse === null || this.#pendingResponse.nonce !== nonce) {
			return;
		}
		if (this.#pendingResponse.num === null) {
			this.#pendingResponse.resolve(NaN);
		} else {
			this.#pendingResponse.resolve([]);
		}
		this.#pendingResponse = null;
		this.sendToPlayer(pid, 'timeout', JSON.stringify({ nonce }));
	}
}

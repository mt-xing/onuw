import Communicator from './comms.js';
import Role, { Modifiers } from '../game/role.js';
import State from '../game/state.js';
import computeWinner from '../game/winLogic.js';
import WakeOrder from '../game/wake.js';

export default class OnuwGame {
	/**
	 * @type {State}
	 */
	state;

	/**
	 * @type {Communicator}
	 */
	comm;

	/**
	 * Milliseconds per role
	 * @type {number}
	 */
	roleTime;

	/**
	 * Milliseconds to think
	 * @type {number}
	 */
	thinkTime;

	/**
	 * Whether the game is over
	 * @type {boolean}
	 */
	over;

	/**
	 * @param {Role[]} roles
	 * @param {string[]} names
	 * @param {number} roleTime Seconds per role
	 * @param {number} thinkTime Seconds to think at end of game
	 * @param {Communicator} comm
	 */
	constructor(roles, names, roleTime, thinkTime, comm) {
		this.state = new State(roles, names);
		this.comm = comm;
		this.roleTime = roleTime * 1000;
		this.thinkTime = thinkTime * 1000;
		this.over = false;
	}

	async #night() {
		const roles = this.state.allWakingRoles;
		/** @type {Map<typeof WakeOrder, number[]>} */
		const wakeMap = new Map();
		const wakes = [...new Set(
			roles
				.map((x) => x.wakeOrder).filter(
					/**
					 * @param {(typeof WakeOrder)[]|null} x
					 * @returns {x is (typeof WakeOrder)[]}
					 */
					(x) => x !== null,
				)
				.flat(),
		)]
			.map((X) => {
				wakeMap.set(X, []);
				return new X();
			})
			.sort((a, b) => WakeOrder.sortWakeOrder(a.wakeOrder, b.wakeOrder));

		const playerIDarray = Array.from(Array(this.state.numPlayers).keys());
		playerIDarray.forEach((pid) => {
			this.state.getPlayer(pid).startingRole.wakeOrder?.forEach(
				(wake) => wakeMap.get(wake)?.push(pid),
			);
		});

		/**
		 * @param {WakeOrder} wake
		 * @param {number} pid
		 */
		const playerAct = async (wake, pid) => {
			let timeLeft = this.roleTime;
			let lastTime = new Date();

			const updateTimeLeft = () => {
				const newTime = new Date();
				timeLeft -= (newTime.getTime() - lastTime.getTime());
				if (timeLeft < 0) {
					timeLeft = 0;
				}
				lastTime = newTime;
			};

			/**
			 * Generate the map for banned players when selecting
			 * @param {boolean} allowSelf
			 * @returns {Record<number, string>}
			 */
			const getBanned = (allowSelf) => {
				/** @type {Record<number, string>} */
				const banned = {};
				playerIDarray
					.forEach((ppid) => {
						if (this.state.getPlayer(ppid).currentRole.modifiers.has(Modifiers.SENTINEL)) {
							banned[ppid] = 'This player\'s role is being protected by the sentinel';
						}
					});
				if (!allowSelf) {
					if (banned[pid] === undefined) {
						banned[pid] = 'You may not select yourself';
					}
				}
				return banned;
			};

			this.comm.wake(pid, this.state.boardState);

			await wake.act(
				async (num, allowSelf) => {
					const r = await this.comm.pickPlayers(pid, timeLeft, num, getBanned(allowSelf));
					updateTimeLeft();
					return r;
				},
				async (num) => {
					const r = await this.comm.pickCenters(pid, timeLeft, num);
					updateTimeLeft();
					return r;
				},
				async (choices) => {
					const r = await this.comm.pickChoices(pid, timeLeft, choices);
					updateTimeLeft();
					return r;
				},
				this.comm.message.bind(this.comm, pid),
				this.state,
				pid,
			);

			if (timeLeft > 0) {
				// Need to stall
				await new Promise((resolve) => {
					setTimeout(resolve, timeLeft);
				});
			}

			this.comm.sleep(pid);
		};

		for (const wake of wakes) {
			// @ts-ignore
			const players = wakeMap.get(wake.constructor);
			this.comm.roleStart(wake.constructor.name);
			if (players === undefined || players.length === 0) {
				await new Promise((resolve) => {
					setTimeout(resolve, this.roleTime);
				});
				continue;
			}
			await Promise.all(players.map(playerAct.bind(this, wake)));
		}
	}

	async #day() {
		return new Promise((resolve) => {
			const readyUpGenerator = this.comm.waitForPlayersReadyToVote();

			/** @type {NodeJS.Timeout | null} */
			let timeout = null;
			let timeRemaining = this.thinkTime;
			const updateInterval = 15 * 1000; // 15 sec
			const doTime = () => {
				if (timeRemaining > updateInterval) {
					timeout = setTimeout(() => {
						timeRemaining -= updateInterval;
						this.comm.timeUpdate(timeRemaining);
						doTime();
					}, updateInterval);
				} else {
					timeout = setTimeout(() => {
						readyUpGenerator.throw('Unneeded');
						resolve(undefined);
					}, timeRemaining);
				}
			};
			doTime();

			(async () => {
				/** @type {Set<number>} */
				const readyPlayers = new Set();
				while (readyPlayers.size < this.state.numPlayers) {
					const t = (await readyUpGenerator.next()).value;
					if (typeof t !== 'number') {
						return;
					}
					readyPlayers.add(t);
					this.comm.playerReadyToVote(t);
				}
				if (timeout !== null) {
					clearTimeout(timeout);
				}
				resolve(undefined);
			})();
		});
	}

	async #vote() {
		const playerIDarray = Array.from(Array(this.state.numPlayers).keys());
		/**
		 * @type {Map<number, number>}
		 */
		const votes = new Map();
		{
			// Scoping the generator to this block so it can get garbage collected
			// when all the votes are in
			const voteGenerator = this.comm.startTheVote();
			while (votes.size < this.state.numPlayers) {
				const t = (await voteGenerator.next()).value;
				votes.set(t[0], t[1]);
				this.comm.voteReceived(t[0]);
			}
		}

		const roleArray = playerIDarray.map((pid) => this.state.getPlayer(pid).currentRole.role);
		const voteArray = playerIDarray.map((pid) => votes.get(pid) ?? 0);
		const winningTeams = computeWinner(roleArray, voteArray);
		this.comm.sendResults(voteArray, roleArray, winningTeams);

		this.over = true;
	}

	async play() {
		await this.#night();

		this.comm.transitionToDay(this.state.boardState);

		await this.#day();
		await this.#vote();
	}
}

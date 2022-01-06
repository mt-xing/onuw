import Communicator from './comms.js';
import Role, { Modifiers } from '../game/role.js';
import State from '../game/state.js';
import computeWinner from '../game/winLogic.js';

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

	async play() {
		const roles = this.state.allWakingRoles;

		/** @param {number} pid */
		const pRole = (pid) => this.state.getPlayer(pid).startingRole;
		const playerIDarray = Array.from(Array(this.state.numPlayers).keys());
		const wakeOrder = playerIDarray
			.filter((p) => pRole(p).wakeOrder !== null)
			.sort((a, b) => Role.sortWakeOrder(
				pRole(a).wakeOrder ?? [],
				pRole(b).wakeOrder ?? [],
			))
			.reduce((a, x) => {
				if (a.length === 0) {
					return [[x]];
				}
				const lastWake = a[a.length - 1];
				if (pRole(lastWake[0]).role === pRole(x).role) {
					lastWake.push(x);
					return a;
				}
				a.push([x]);
				return a;
			}, /** @type {number[][]} */([]));

		/**
		 * @param {number} pid
		 */
		const playerAct = async (pid) => {
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
				if (allowSelf) {
					if (banned[pid] !== undefined) {
						banned[pid] = 'You may not select yourself';
					}
				}
				return banned;
			};

			const player = this.state.getPlayer(pid);
			this.comm.wake(pid, player.startingRole.role);

			await player.startingRole.act(
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

		let wakeOrderIndex = 0;
		for (const role of roles) {
			if (
				wakeOrderIndex >= wakeOrder.length
				|| !role.equals(pRole(wakeOrder[wakeOrderIndex][0]))
			) {
				this.comm.wake(NaN, role.role);
				await new Promise((resolve) => {
					setTimeout(resolve, this.roleTime);
				});
				continue;
			}
			await Promise.all(wakeOrder[wakeOrderIndex].map(playerAct));
			wakeOrderIndex++;
		}

		/** @type {Record<number, string>} */
		const boardInfo = {};
		playerIDarray.forEach((pid) => {
			const role = this.state.getPlayer(pid).currentRole;
			const playerMods = role.modifiers;
			if (playerMods.has(Modifiers.SENTINEL)) {
				boardInfo[pid] = 'This player\'s role was guarded by the sentinel';
			} else if (playerMods.has(Modifiers.REVEALER)) {
				boardInfo[pid] = `This player has been revealed to be a ${role.roleName}`;
			}
		});
		this.comm.transitionToDay(boardInfo);

		await new Promise((resolve) => {
			const readyUpGenerator = this.comm.waitForPlayersReadyToVote();

			/** @type {NodeJS.Timeout | null} */
			let timeout = null;
			let timeRemaining = this.thinkTime;
			const updateInterval = 15 * 1000; // 15 sec
			if (timeRemaining > updateInterval) {
				timeout = setTimeout(() => {
					timeRemaining -= updateInterval;
					this.comm.timeUpdate(timeRemaining);
				}, updateInterval);
			} else {
				timeout = setTimeout(() => {
					readyUpGenerator.throw('Unneeded');
					resolve(undefined);
				}, this.thinkTime);
			}

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
				clearTimeout(timeout);
				resolve(undefined);
			})();
		});

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
}

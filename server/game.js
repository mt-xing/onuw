import Communicator from './comms.js';
import Role, { Modifiers } from '../game/role.js';
import State from '../game/state.js';

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
	}

	async play() {
		const wakeOrder = Array
			.from(Array(this.state.numPlayers).keys())
			.filter((p) => this.state.getPlayer(p).startingRole.wakeOrder !== null);
		wakeOrder.sort(
			(a, b) => Role.sortWakeOrder(
				this.state.getPlayer(a).startingRole.wakeOrder ?? [],
				this.state.getPlayer(b).startingRole.wakeOrder ?? [],
			),
		);

		for (const pid of wakeOrder) {
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
				Array
					.from(Array(this.state.numPlayers).keys())
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
		}

		/** @type {Record<number, string>} */
		const boardInfo = {};
		for (const pid of Array(this.state.numPlayers).keys()) {
			const role = this.state.getPlayer(pid).currentRole;
			const playerMods = role.modifiers;
			if (playerMods.has(Modifiers.SENTINEL)) {
				boardInfo[pid] = 'This player\'s role was guarded by the sentinel';
			} else if (playerMods.has(Modifiers.REVEALER)) {
				boardInfo[pid] = `This player has been revealed to be a ${role.roleName}`;
			}
		}
		this.comm.transitionToDay(boardInfo);

		// TODO accept ready-ups
		await new Promise((resolve) => {
			setTimeout(resolve, this.thinkTime);
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

		// TODO
	}
}

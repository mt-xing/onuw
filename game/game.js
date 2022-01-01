import Communicator from './comms';
import Role, { Modifiers } from './role';
import State from './state';

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
	 * @param {Role[]} roles
	 * @param {string[]} names
	 * @param {number} roleTime Seconds per role
	 */
	constructor(roles, names, roleTime) {
		this.state = new State(roles, names);
		this.comm = new Communicator();
		this.roleTime = roleTime * 1000;
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

		wakeOrder.forEach((pid) => {
			const timeLeft = this.roleTime; // TODO

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

			this.comm.wake(pid);
			const player = this.state.getPlayer(pid);
			player.startingRole.act(
				(num, allowSelf) => this.comm.pickPlayers(pid, timeLeft, num, getBanned(allowSelf)),
				this.comm.pickCenters.bind(this.comm, pid, timeLeft),
				this.comm.pickChoices.bind(this.comm, pid, timeLeft),
				this.comm.message.bind(this.comm, pid),
				this.state,
				pid,
			);

			this.comm.sleep(pid);
		});
	}
}

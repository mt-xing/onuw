import { makeList } from '../../game/utils.js';
import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { DoubleRoles, Roles, roleToName } from '../../game/role.js';

export default class GameSetup {
	/**
	 * @type {Socket}
	 */
	#socket;

	/**
	  * @type {OnuwGame}
	  */
	#game;

	/**
	  * @type {HTMLElement}
	  */
	#dom;

	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 */
	constructor(socket, game, gameDom) {
		this.#dom = gameDom;
		this.#dom.textContent = null;
		this.#socket = socket;
		this.#game = game;

		this.#dom.appendChild(Dom.p(game.isHost ? 'Select roles:' : 'Wait for roles'));
		this.#generateRolesDom();
	}

	#generateRolesDom() {
		const unused = document.createElement('div');
		unused.appendChild(Dom.p('Unused Roles:'));
		const used = document.createElement('div');
		used.appendChild(Dom.p('Selected Roles:'));
		this.#dom.appendChild(unused);
		this.#dom.appendChild(used);

		const emptyFn = () => {};

		/** @type {keyof typeof Roles} */
		let role;
		for (role in Roles) {
			if (!Object.prototype.hasOwnProperty.call(Roles, role)) {
				continue;
			}
			const roleID = Roles[role];

			const displayText = DoubleRoles.has(roleID) ? `${roleToName[roleID]} x2` : roleToName[roleID];
			const btn = Dom.button(displayText, this.#game.isHost ? () => {
				const [wasAdded, num] = this.#game.toggleRole(roleID);
				this.#dom.appendChild(Dom.p(`There are now ${num} roles`));
				if (wasAdded) {
					unused.removeChild(btn);
					used.appendChild(btn);
					// roleAdd, roleSub, roleTime, talkTime
					this.#socket.send('setupInfo', {
						roleAdd: [roleID],
						roleSub: [],
						roleTime: 0, // TODO
						talkTime: 0,
					});
				} else {
					used.removeChild(btn);
					unused.appendChild(btn);
					this.#socket.send('setupInfo', {
						roleAdd: [],
						roleSub: [roleID],
						roleTime: 0, // TODO
						talkTime: 0,
					});
				}
			} : emptyFn);
			unused.appendChild(btn);
		}
	}
}

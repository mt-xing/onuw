import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { roleToName } from '../../game/role.js';
import Dom from '../dom.js';
import { constructRole } from '../../game/rolesIndiv.js';

export default class Gameplay {
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

		this.#giveRoleInfo();
	}

	#giveRoleInfo() {
		const role = constructRole(this.#game.startingRole);
		this.#dom.appendChild(Dom.p(`Your starting role is ${role.roleName}`));
		this.#dom.appendChild(Dom.p(role.description));
		this.#dom.appendChild(Dom.p(role.instructions));
		this.#dom.appendChild(Dom.p('Good night, all. And good luck.'));
	}
}

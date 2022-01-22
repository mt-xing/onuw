import Dom from '../dom.js';
import Socket from '../socket.js';
import OnuwGame from '../game.js';
import { MultiRoles, Roles, roleToName } from '../../game/role.js';
import { DEFAULT_ROLE_TIME, DEFAULT_TALK_TIME } from '../../game/constants.js';
import { CENTER_SIZE } from '../../game/state.js';
import { assertUnreachable } from '../../game/utils.js';

export default class GameSetup {
	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 * @returns {GameSetup}
	 */
	static construct(socket, game, gameDom, completeCallback) {
		if (game.isHost) {
			return new HostSetup(socket, game, gameDom, completeCallback);
		} else {
			throw new Error('TODO');
		}
	}

	/**
	  * @type {OnuwGame}
	  */
	#game;

	/**
	 * Number of things waiting on before we can start
	 * 0 = ready to start
	 * 1 = waiting on either final setup confirmation or role
	 * 2 = waiting on both
	 * @type {0|1|2}
	 */
	#waiting;

	/** @type {(game: OnuwGame) => void} */
	#allDone;

	/**
	 * ABSTRACT CLASS
	 *
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 */
	constructor(socket, game, gameDom, completeCallback) {
		if (this.constructor === GameSetup) {
			throw new Error('GameSetup is an abstract class');
		}
		// eslint-disable-next-line no-param-reassign
		gameDom.textContent = null;
		this.#game = game;
		this.#game.restart();

		this.#waiting = 2;
		this.#allDone = completeCallback;

		socket.off('setupFinal');
		socket.on('setupFinal', this.#finalSetup.bind(this));
		socket.off('setupRole');
		socket.on('setupRole', this.#receiveRole.bind(this));
	}

	/**
	 * @param {string} data
	 */
	#finalSetup(data) {
		/** @type {{roles: Roles[], roleTime: number, talkTime: number, names: string[]}} */
		const {
			roles, roleTime, talkTime, names,
		} = JSON.parse(data);
		this.#game.confirmData(roles, roleTime, talkTime, names);
		this.#waiting--;
		if (this.#waiting === 0) {
			this.#allDone(this.#game);
		}
	}

	/**
	 * @param {string} data
	 */
	#receiveRole(data) {
		/** @type {{role: Roles}} */
		const { role } = JSON.parse(data);
		this.#game.startingRole = role;
		this.#waiting--;
		if (this.#waiting === 0) {
			this.#allDone(this.#game);
		}
	}
}

class HostSetup extends GameSetup {
	/** @type {Socket} */
	#socket;

	/** @type {OnuwGame} */
	#game;

	/**
	 * @param {Socket} socket
	 * @param {OnuwGame} game
	 * @param {HTMLElement} gameDom
	 * @param {(game: OnuwGame) => void} completeCallback
	 */
	constructor(socket, game, gameDom, completeCallback) {
		super(socket, game, gameDom, completeCallback);

		this.#socket = socket;
		this.#game = game;
		this.#generateDom().forEach(gameDom.appendChild.bind(gameDom));
	}

	#generateDom() {
		const header = document.createElement('header');
		header.classList.add('setupHeader');

		const rolesLeftWrap = Dom.p('Select ');
		const rolesLeft = document.createElement('strong');
		rolesLeft.textContent = '?';
		rolesLeftWrap.appendChild(rolesLeft);
		rolesLeftWrap.appendChild(document.createTextNode(' more roles'));
		rolesLeftWrap.appendChild(Dom.button('Begin Game', () => {}));
		const inputsWrap = Dom.p('Seconds per role: ');
		const role = Dom.input('number', undefined, `${DEFAULT_ROLE_TIME}`);
		role.min = '1';
		role.step = '1';
		role.max = '60';
		role.addEventListener('change', this.#changeRoleTime.bind(this));
		inputsWrap.appendChild(role);
		inputsWrap.appendChild(document.createTextNode('Minutes to discuss: '));
		const talk = Dom.input('number', undefined, `${DEFAULT_TALK_TIME}`);
		talk.min = '1';
		talk.step = '1';
		talk.max = '30';
		talk.addEventListener('change', this.#changeTalkTime.bind(this));
		inputsWrap.appendChild(talk);
		header.appendChild(rolesLeftWrap);
		header.appendChild(inputsWrap);

		const main = document.createElement('main');
		main.classList.add('setup');
		const h2Wrap = document.createElement('div');
		h2Wrap.classList.add('header');
		h2Wrap.appendChild(Dom.h2('Unused Roles'));
		h2Wrap.appendChild(Dom.h2('Used Roles'));
		main.appendChild(h2Wrap);

		for (const r in Roles) {
			if (!Object.prototype.hasOwnProperty.call(Roles, r)) {
				continue;
			}

			/** @type {Roles} */
			// @ts-ignore
			const roleID = Roles[/* @type {keyof typeof Roles} */(r)];
			const specialRules = MultiRoles[roleID];

			switch (specialRules?.type) {
			case 'all':
				main.appendChild(this.#getButton(roleID, specialRules.number));
				break;
			case 'up to':
				for (let i = 0; i < specialRules.number; i++) {
					main.appendChild(this.#getButton(roleID, 1));
				}
				break;
			default:
				main.appendChild(this.#getButton(roleID, 1));
				break;
			}
		}

		return [header, main];
	}

	/**
	 * @param {Roles} roleID
	 * @param {number} num
	 * @returns {HTMLButtonElement}
	 */
	#getButton(roleID, num) {
		let active = false;
		const b = Dom.button(roleToName[roleID], () => {
			if (!active) {
				b.classList.add('active');
				this.#game.addRole(roleID);
				this.#sendModdedRoles(Array(num).fill(roleID), []);
			} else {
				b.classList.remove('active');
				this.#game.removeRole(roleID);
				this.#sendModdedRoles([], Array(num).fill(roleID));
			}
			active = !active;
		});
		return b;
	}

	/**
	 * @param {Roles[]} add
	 * @param {Roles[]} sub
	 */
	#sendModdedRoles(add, sub) {
		this.#socket.send('setupInfo', {
			roleAdd: add,
			roleSub: sub,
			roleTime: this.#game.roleTime,
			talkTime: this.#game.talkTime,
		});
	}

	/**
	 * @param {Event} ev
	 */
	#changeRoleTime(ev) {
		this.#game.roleTime = parseInt(
			/** @type {HTMLInputElement} */(ev.currentTarget).value,
			10,
		);
		if (this.#game.roleTime < 1) {
			this.#game.roleTime = 1;
			// eslint-disable-next-line no-param-reassign
			/** @type {HTMLInputElement} */(ev.currentTarget).value = '1';
		}
		this.#sendTimes();
	}

	/**
	 * @param {Event} ev
	 */
	#changeTalkTime(ev) {
		this.#game.talkTime = parseInt(
			/** @type {HTMLInputElement} */(ev.currentTarget).value,
			10,
		) * 60;
		if (this.#game.talkTime < 1) {
			this.#game.talkTime = 60;
			// eslint-disable-next-line no-param-reassign
			/** @type {HTMLInputElement} */(ev.currentTarget).value = '1';
		}
		this.#sendTimes();
	}

	#sendTimes() {
		this.#socket.send('setupInfo', {
			roleAdd: [],
			roleSub: [],
			roleTime: this.#game.roleTime,
			talkTime: this.#game.talkTime,
		});
	}
}
